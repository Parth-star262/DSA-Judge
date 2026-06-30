const prisma = require('./prisma');
const { executeCode } = require('./judge0');
const { classifyComplexity } = require('./complexity');
const { estimateSpaceComplexity, getOptimalSpaceComplexity } = require('./spaceComplexity');
const { buildExecutableCode, compareOutput } = require('./codeHarness');
const { awardBadges } = require('./badgeService');


const startOfLocalDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const daysBetween = (olderDate, newerDate) => {
  const older = startOfLocalDay(olderDate);
  const newer = startOfLocalDay(newerDate);
  return Math.round((newer - older) / (24 * 60 * 60 * 1000));
};

const updateProgressAndStreak = async ({ userId, problemId, verdict }) => {
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

const judgeSubmission = async ({ submissionId, userId, problem, code, language }) => {
  const executableCode = buildExecutableCode(problem, language, code);
  console.log(`[Submit] Judging: submission=${submissionId} problem=${problem.slug} language=${language}`);

  let passedCases = 0;
  let totalTime = 0;
  let tleCases = 0;
  let runtimeErrorCases = 0;
  let firstFailedCase = null;

  for (const testCase of problem.testCases) {
    try {
      const result = await executeCode(executableCode, language, testCase.input);

      if (result.statusId === 5) {
        tleCases++;
        firstFailedCase ||= {
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          stderr: 'Time Limit Exceeded',
        };
      } else if (result.statusId >= 6) {
        runtimeErrorCases++;
        firstFailedCase ||= {
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: result.stdout || '',
          stderr: result.stderr || result.statusDesc,
        };
      } else {
        const actualOutput = (result.stdout || '').trim();
        const expectedOutput = (testCase.expectedOutput || '').trim();

        if (compareOutput(problem, actualOutput, expectedOutput)) {
          passedCases++;
        } else {
          firstFailedCase ||= {
            input: testCase.input,
            expectedOutput,
            actualOutput,
            stderr: result.stderr,
          };
        }
      }

      totalTime += result.time || 0;
    } catch (error) {
      runtimeErrorCases++;
      firstFailedCase ||= {
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: '',
        stderr: error.message,
      };
    }
  }

  const totalCases = problem.testCases.length;
  let verdict = 'WRONG_ANSWER';
  if (tleCases > 0) verdict = 'TLE';
  else if (runtimeErrorCases > 0 && passedCases === 0) verdict = 'RUNTIME_ERROR';
  else if (passedCases === totalCases) verdict = 'ACCEPTED';
  else if (passedCases > 0) verdict = 'PARTIAL';

  const score = totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0;
  const executionTime = totalCases > 0 ? totalTime / totalCases : 0;

  let complexityEstimate = null;
  if (problem.scalingInputs.length >= 3) {
    const times = {};
    for (const scalingInput of problem.scalingInputs) {
      try {
        const result = await executeCode(executableCode, language, scalingInput.input);
        times[scalingInput.n] = result.time * 1000;
      } catch {
        // Complexity analysis is best-effort and must not fail the submission.
      }
    }
    if (Object.keys(times).length >= 3) complexityEstimate = classifyComplexity(times);
  }

  const spaceComplexityEstimate = estimateSpaceComplexity(problem.slug, language, code);
  const optimalSpaceComplexity = getOptimalSpaceComplexity(problem.slug);
  const result = {
    submissionId,
    verdict,
    score,
    passedCases,
    totalCases,
    executionTime,
    complexityEstimate,
    optimalComplexity: problem.optimalComplexity,
    complexityMatch: complexityEstimate === problem.optimalComplexity,
    spaceComplexityEstimate,
    optimalSpaceComplexity,
    spaceComplexityMatch: Boolean(
      optimalSpaceComplexity && spaceComplexityEstimate === optimalSpaceComplexity
    ),
    firstFailedCase,
  };

  await prisma.submission.update({
    where: { id: submissionId },
    data: { verdict, score, passedCases, executionTime, complexityEstimate },
  });

  await updateProgressAndStreak({ userId, problemId: problem.id, verdict });

  // Phase 4.2 — Auto-award badges
  let newBadges = [];
  if (verdict === 'ACCEPTED') {
    newBadges = await awardBadges({
      userId,
      problem,
      complexityMatch: result.complexityMatch,
    });
  }

  return { ...result, newBadges };
};

module.exports = { judgeSubmission };

