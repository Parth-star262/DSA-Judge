const express = require('express');
const { Queue } = require('bullmq');
const prisma = require('../services/prisma');
const { getResult } = require('../services/redis');
const { auth } = require('../middleware/auth');
const { executeCode } = require('../services/judge0');
const { buildQueueConnection } = require('../services/queueConnection');
const { buildExecutableCode, compareOutput } = require('../services/codeHarness');
const { estimateSpaceComplexity, getOptimalSpaceComplexity } = require('../services/spaceComplexity');

const router = express.Router();

const submissionQueue = new Queue('submissions', {
  connection: buildQueueConnection(),
});

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
    await submissionQueue.add('judge', {
      submissionId: submission.id,
      code,
      language,
      problemSlug,
      judgeConfig: problem.judgeConfig,
      testCases: problem.testCases,
      scalingInputs: problem.scalingInputs,
      optimalComplexity: problem.optimalComplexity,
      problemId: problem.id,
      userId: req.user.id,
    });

    res.status(202).json({ submissionId: submission.id, status: 'PENDING' });
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

    const executableCode = buildExecutableCode({ slug: problemSlug, judgeConfig: problem.judgeConfig }, language, code);
    const judgeResult = await executeCode(executableCode, language, input || '');
    const spaceComplexityEstimate = estimateSpaceComplexity(problemSlug, language, code);
    const optimalSpaceComplexity = getOptimalSpaceComplexity(problemSlug);
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
      verdict = compareOutput({ slug: problemSlug, judgeConfig: problem.judgeConfig }, actualOutput, expected) ? 'ACCEPTED' : 'WRONG_ANSWER';
      totalCases = 1;
      passedCases = verdict === 'ACCEPTED' ? 1 : 0;
      score = verdict === 'ACCEPTED' ? 100 : 0;
    } else {
      verdict = 'COMPLETED';
    }

    res.json({
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
    });
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
    // Check Redis first
    const cached = await getResult(req.params.id);
    if (cached) return res.json(cached);

    // Fallback to DB
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
    });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
