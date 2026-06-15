require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Worker } = require('bullmq');
const prisma = require('../services/prisma');
const { executeCode } = require('../services/judge0');
const { classifyComplexity } = require('../services/complexity');
const { estimateSpaceComplexity, getOptimalSpaceComplexity } = require('../services/spaceComplexity');
const { setResult, ensureRedisConnection } = require('../services/redis');
const {
  SUBMISSION_QUEUE_NAME,
  buildQueueConnection,
  describeQueueConnection,
} = require('../services/queueConnection');
const { buildExecutableCode, compareOutput } = require('../services/codeHarness');

const startOfLocalDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const daysBetween = (olderDate, newerDate) => {
  const older = startOfLocalDay(olderDate);
  const newer = startOfLocalDay(newerDate);
  return Math.round((newer - older) / (24 * 60 * 60 * 1000));
};

const updateProgressAndStreak = async ({ userId, problemId, verdict }) => {
  if (!userId || !problemId) return;

  const existingProgress = await prisma.userProgress.findUnique({
    where: { userId_problemId: { userId, problemId } },
  });
  const alreadySolved = existingProgress?.status === 'SOLVED';

  if (verdict === 'ACCEPTED') {
    await prisma.userProgress.upsert({
      where: { userId_problemId: { userId, problemId } },
      update: { status: 'SOLVED' },
      create: { userId, problemId, status: 'SOLVED' },
    });

    if (!alreadySolved) {
      const now = new Date();
      const streak = await prisma.streak.findUnique({ where: { userId } });

      if (!streak) {
        await prisma.streak.create({
          data: { userId, currentStreak: 1, longestStreak: 1, lastSolvedAt: now },
        });
      } else {
        const gap = streak.lastSolvedAt ? daysBetween(streak.lastSolvedAt, now) : null;
        const currentStreak = gap === 0 ? streak.currentStreak : gap === 1 ? streak.currentStreak + 1 : 1;

        await prisma.streak.update({
          where: { userId },
          data: {
            currentStreak,
            longestStreak: Math.max(streak.longestStreak, currentStreak),
            lastSolvedAt: now,
          },
        });
      }
    }

    return;
  }

  if (!alreadySolved) {
    await prisma.userProgress.upsert({
      where: { userId_problemId: { userId, problemId } },
      update: { status: 'ATTEMPTED' },
      create: { userId, problemId, status: 'ATTEMPTED' },
    });
  }
};

const startWorker = async () => {
  console.log('[Worker] Booting');
  console.log(`[Worker] Queue="${SUBMISSION_QUEUE_NAME}" Redis=`, describeQueueConnection());
  await ensureRedisConnection();

  const worker = new Worker(
    SUBMISSION_QUEUE_NAME,
    async (job) => {
      console.log(`[Worker] Job Picked Up: job=${job.id} submission=${job.data.submissionId}`);
      const {
        submissionId,
        code,
        language,
        problemSlug,
        judgeConfig,
        testCases,
        scalingInputs,
        optimalComplexity,
        problemId,
        userId,
      } = job.data;

      await prisma.submission.update({
        where: { id: submissionId },
        data: { verdict: 'RUNNING' },
      });
      console.log(`[Worker] DB Updated: submission=${submissionId} verdict=RUNNING`);

      const executableCode = buildExecutableCode({ slug: problemSlug, judgeConfig }, language, code);

      console.log(`[Worker] Processing submission ${submissionId}`);
      console.log(`[Worker Path] problemSlug: ${problemSlug}, language: ${language}`);
      console.log(`[Worker Path] First 500 chars of executableCode:\n${executableCode.substring(0, 500)}\n----------------------------------------`);

      let passedCases = 0;
      let totalTime = 0;
      let verdict = 'ACCEPTED';
      let tleCases = 0;
      let reCases = 0;
      let firstFailedCase = null;

      // ── 1. Run all test cases ──────────────────────────────────────────
      for (const tc of testCases) {
        try {
          const result = await executeCode(executableCode, language, tc.input);

          // Judge0 status IDs: 3=Accepted, 4=WA, 5=TLE, 6=CE, 11=RE
          if (result.statusId === 5) {
            tleCases++;
            if (!firstFailedCase) firstFailedCase = { input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: '', stderr: 'Time Limit Exceeded' };
          } else if (result.statusId >= 6) {
            reCases++;
            if (!firstFailedCase) firstFailedCase = { input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: result.stdout, stderr: result.stderr || result.statusDesc };
          } else {
            const actual = (result.stdout || '').trim();
            const expected = (tc.expectedOutput || '').trim();
            if (compareOutput({ slug: problemSlug, judgeConfig }, actual, expected)) {
              passedCases++;
            } else {
              if (!firstFailedCase) firstFailedCase = { input: tc.input, expectedOutput: expected, actualOutput: actual, stderr: result.stderr };
            }
          }

          totalTime += result.time || 0;
        } catch (err) {
          reCases++;
          if (!firstFailedCase) firstFailedCase = { input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: '', stderr: err.message };
        }
      }

      // ── 2. Determine verdict ───────────────────────────────────────────
      const total = testCases.length;
      if (tleCases > 0) {
        verdict = 'TLE';
      } else if (reCases > 0 && passedCases === 0) {
        verdict = 'RUNTIME_ERROR';
      } else if (passedCases === total) {
        verdict = 'ACCEPTED';
      } else if (passedCases > 0) {
        verdict = 'PARTIAL';
      } else {
        verdict = 'WRONG_ANSWER';
      }

      const score = total > 0 ? Math.round((passedCases / total) * 100) : 0;
      const avgTime = total > 0 ? totalTime / total : 0;

      // ── 3. Estimate time complexity ────────────────────────────────────
      let complexityEstimate = null;
      if (scalingInputs && scalingInputs.length >= 3) {
        const times = {};
        for (const si of scalingInputs) {
          try {
            const r = await executeCode(executableCode, language, si.input);
            times[si.n] = r.time * 1000; // ms
          } catch {
            // skip
          }
        }
        if (Object.keys(times).length >= 3) {
          complexityEstimate = classifyComplexity(times);
        }
      }

      const spaceComplexityEstimate = estimateSpaceComplexity(problemSlug, language, code);
      const optimalSpaceComplexity = getOptimalSpaceComplexity(problemSlug);

      // ── 4. Store result in Redis & update DB ───────────────────────────
      const resultData = {
        submissionId,
        verdict,
        score,
        passedCases,
        totalCases: total,
        executionTime: avgTime,
        complexityEstimate,
        optimalComplexity,
        complexityMatch: complexityEstimate === optimalComplexity,
        spaceComplexityEstimate,
        optimalSpaceComplexity,
        spaceComplexityMatch: !!(optimalSpaceComplexity && spaceComplexityEstimate === optimalSpaceComplexity),
        firstFailedCase,
      };

      console.log(`[Worker] DB Update Started: submission=${submissionId} verdict=${verdict}`);
      const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          verdict,
          score,
          passedCases,
          executionTime: avgTime,
          complexityEstimate,
        },
      });
      console.log(`[Worker] DB Updated: submission=${updatedSubmission.id} verdict=${updatedSubmission.verdict}`);

      try {
        await setResult(submissionId, resultData);
        console.log(`[Worker] Redis Updated: submission=${submissionId}`);
      } catch (error) {
        console.error(`[Worker] Redis result cache failed: submission=${submissionId}`, error);
      }

      await updateProgressAndStreak({ userId, problemId, verdict });

      console.log(`[Worker] Job Finished: job=${job.id} submission=${submissionId} verdict=${verdict} score=${score}`);
      return resultData;
    },
    {
      connection: buildQueueConnection(),
      concurrency: 3,
    }
  );

  worker.on('ready', () => {
    console.log('[Worker] Ready');
  });

  worker.on('active', (job) => {
    console.log(`[Worker] Active: job=${job.id} submission=${job.data.submissionId}`);
  });

  worker.on('completed', (job, result) => {
    console.log(`[Worker] Completed: job=${job.id} submission=${job.data.submissionId} verdict=${result?.verdict}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Failed: job=${job?.id} submission=${job?.data?.submissionId}`, err);
  });

  worker.on('error', (error) => {
    console.error('[Worker] Error', error);
  });
};

startWorker().catch((error) => {
  console.error('Failed to connect to Redis. Worker not started.');
  console.error(error.message);
  process.exit(1);
});
