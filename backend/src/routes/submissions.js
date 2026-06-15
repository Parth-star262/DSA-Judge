const express = require('express');
const { Queue } = require('bullmq');
const prisma = require('../services/prisma');
const { getResult } = require('../services/redis');
const { auth } = require('../middleware/auth');
const { executeCode } = require('../services/judge0');
const {
  SUBMISSION_QUEUE_NAME,
  buildQueueConnection,
  describeQueueConnection,
} = require('../services/queueConnection');
const { buildExecutableCode, compareOutput } = require('../services/codeHarness');
const { estimateSpaceComplexity, getOptimalSpaceComplexity } = require('../services/spaceComplexity');

const router = express.Router();

const submissionQueue = new Queue(SUBMISSION_QUEUE_NAME, {
  connection: buildQueueConnection(),
});

submissionQueue.on('error', (error) => console.error('[Queue] Error', error));
console.log(`[Queue] Initialized "${SUBMISSION_QUEUE_NAME}"`, describeQueueConnection());

// POST /api/submissions — submit code
router.post('/', auth, async (req, res) => {
  try {
    const { problemSlug, code, language } = req.body;
    if (!problemSlug || !code || !language)
      return res.status(400).json({ error: 'problemSlug, code, language required' });

    const problem = await prisma.problem.findUnique({
      where: { slug: problemSlug },
      include: { testCases: true, scalingInputs: true },
    });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    // Create submission in DB (PENDING)
    const submission = await prisma.submission.create({
      data: {
        userId: req.user.id,
        problemId: problem.id,
        code,
        language,
        verdict: 'PENDING',
        totalCases: problem.testCases.length,
      },
    });

    // Enqueue job
    const job = await submissionQueue.add('judge', {
      submissionId: submission.id,
      code,
      language,
      problemSlug: problem.slug,
      judgeConfig: problem.judgeConfig,
      testCases: problem.testCases,
      scalingInputs: problem.scalingInputs,
      optimalComplexity: problem.optimalComplexity,
      problemId: problem.id,
      userId: req.user.id,
    }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    console.log(`[Submit] Job Added: job=${job.id} submission=${submission.id} queue=${SUBMISSION_QUEUE_NAME}`);

    res.status(202).json({ submissionId: submission.id, jobId: job.id, status: 'PENDING' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/submissions/run — run against a single sample/custom input
router.post('/run', auth, async (req, res) => {
  try {
    const { problemSlug, code, language, input, expectedOutput } = req.body;
    if (!problemSlug || !code || !language) {
      return res.status(400).json({ error: 'problemSlug, code, language required' });
    }

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const executableCode = buildExecutableCode({ slug: problem.slug, judgeConfig: problem.judgeConfig }, language, code);

    console.log(`[Run Path] problemSlug: ${problem.slug}, language: ${language}`);
    console.log(`[Run Path] First 500 chars of executableCode:\n${executableCode.substring(0, 500)}\n----------------------------------------`);

    const judgeResult = await executeCode(executableCode, language, input || '');
    const spaceComplexityEstimate = estimateSpaceComplexity(problem.slug, language, code);
    const optimalSpaceComplexity = getOptimalSpaceComplexity(problem.slug);
    const statusId = judgeResult.statusId;
    const actualOutput = (judgeResult.stdout || '').trim();

    let verdict;
    let passedCases = 0;
    let totalCases = 0;
    let score = 0;

    if (statusId === 5) {
      verdict = 'TLE';
    } else if (statusId >= 6) {
      verdict = 'RUNTIME_ERROR';
    } else if (typeof expectedOutput === 'string') {
      const expected = expectedOutput.trim();
      verdict = compareOutput({ slug: problem.slug, judgeConfig: problem.judgeConfig }, actualOutput, expected) ? 'ACCEPTED' : 'WRONG_ANSWER';
      totalCases = 1;
      passedCases = verdict === 'ACCEPTED' ? 1 : 0;
      score = verdict === 'ACCEPTED' ? 100 : 0;
    } else {
      verdict = 'COMPLETED';
    }

    const payload = {
      verdict,
      score,
      passedCases,
      totalCases,
      executionTime: judgeResult.time || 0,
      output: actualOutput,
      stderr: judgeResult.stderr,
      statusDesc: judgeResult.statusDesc,
      spaceComplexityEstimate,
      optimalSpaceComplexity,
      spaceComplexityMatch: !!(optimalSpaceComplexity && spaceComplexityEstimate === optimalSpaceComplexity),
    };

    console.log(
      "[Run Path] Final response:",
      JSON.stringify(payload, null, 2)
    );
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submissions/user/history — submission history
router.get('/user/history', auth, async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { userId: req.user.id },
      orderBy: { submittedAt: 'desc' },
      take: 50,
      include: { problem: { select: { title: true, slug: true } } },
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submissions/:id — poll result
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
    });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check Redis first
    const cached = await getResult(req.params.id);
    if (cached) {
      console.log(`[Polling] Status Returned: submission=${req.params.id} source=redis verdict=${cached.verdict}`);
      return res.json(cached);
    }

    console.log(`[Polling] Status Returned: submission=${submission.id} source=database verdict=${submission.verdict}`);
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
