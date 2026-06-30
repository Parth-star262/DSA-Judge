const express = require('express');
const prisma = require('../services/prisma');
const { auth } = require('../middleware/auth');
const { executeCode } = require('../services/judge0');
const { buildExecutableCode, compareOutput } = require('../services/codeHarness');
const { estimateSpaceComplexity, getOptimalSpaceComplexity } = require('../services/spaceComplexity');
const { judgeSubmission } = require('../services/submissionJudge');
const { getQueue, getQueueEvents } = require('../workers/judgeWorker');
const { submissionLimiter } = require('../middleware/security');

const router = express.Router();

// POST /api/submissions — enqueue submission (async judging)
router.post('/', auth, submissionLimiter, async (req, res) => {
  let submission = null;
  try {
    const { problemSlug, code, language } = req.body;
    req.log.info({ problemSlug, language, userId: req.user.id }, '[Submit] Request received');

    if (!problemSlug || !code || !language)
      return res.status(400).json({ error: 'problemSlug, code, language required' });

    const problem = await prisma.problem.findUnique({
      where: { slug: problemSlug },
      select: { id: true, slug: true, testCases: { select: { id: true } } },
    });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    // Create submission in DB (PENDING)
    submission = await prisma.submission.create({
      data: {
        userId: req.user.id,
        problemId: problem.id,
        code,
        language,
        verdict: 'PENDING',
        totalCases: problem.testCases.length,
      },
    });

    // Enqueue job for async judging
    const queue = getQueue();
    await queue.add(
      'judge',
      {
        submissionId: submission.id,
        userId: req.user.id,
        problemSlug,
        code,
        language,
      },
      { jobId: submission.id } // Use submissionId as jobId for easy SSE lookup
    );

    req.log.info({ submissionId: submission.id }, '[Submit] Enqueued for judging');
    res.status(202).json({ submissionId: submission.id, verdict: 'PENDING' });
  } catch (err) {
    if (submission) {
      await prisma.submission.update({
        where: { id: submission.id },
        data: { verdict: 'RUNTIME_ERROR' },
      }).catch(() => {});
    }
    req.log.error({ err: err.message }, '[Submit] Failed to enqueue');
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submissions/:id/stream — SSE: streams live verdict updates
router.get('/:id/stream', auth, async (req, res) => {
  const submissionId = req.params.id;

  // Verify submission belongs to user
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  if (submission.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // If already done, return immediately
  if (submission.verdict !== 'PENDING') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ type: 'complete', submission })}\n\n`);
    return res.end();
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  const send = (data) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  // Heartbeat every 5s to keep connection alive
  const heartbeat = setInterval(() => send({ type: 'heartbeat' }), 5000);

  const queueEvents = getQueueEvents();

  const onCompleted = async ({ jobId, returnvalue }) => {
    if (jobId !== submissionId) return;
    try {
      const result = typeof returnvalue === 'string' ? JSON.parse(returnvalue) : returnvalue;
      send({ type: 'complete', result });
    } catch {
      // Fetch from DB as fallback
      const updated = await prisma.submission.findUnique({ where: { id: submissionId } });
      send({ type: 'complete', result: updated });
    }
    cleanup();
  };

  const onFailed = ({ jobId, failedReason }) => {
    if (jobId !== submissionId) return;
    send({ type: 'error', error: failedReason || 'Judging failed' });
    cleanup();
  };

  const cleanup = () => {
    clearInterval(heartbeat);
    queueEvents.off('completed', onCompleted);
    queueEvents.off('failed', onFailed);
    if (!res.writableEnded) res.end();
  };

  queueEvents.on('completed', onCompleted);
  queueEvents.on('failed', onFailed);
  req.on('close', cleanup);

  // Send initial status
  send({ type: 'queued', submissionId });

  // Timeout after 3 minutes (safety net)
  setTimeout(() => {
    send({ type: 'timeout', message: 'Judging is taking too long. Please check back later.' });
    cleanup();
  }, 3 * 60 * 1000);
});

// POST /api/submissions/run — run against a single sample/custom input (sync, no queue)
router.post('/run', auth, submissionLimiter, async (req, res) => {
  try {
    const { problemSlug, code, language, input, expectedOutput } = req.body;
    if (!problemSlug || !code || !language) {
      return res.status(400).json({ error: 'problemSlug, code, language required' });
    }

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const executableCode = buildExecutableCode({ slug: problem.slug, judgeConfig: problem.judgeConfig }, language, code);

    req.log.info({ problemSlug: problem.slug, language }, '[Run] Executing custom input');

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
      verdict = compareOutput({ slug: problem.slug, judgeConfig: problem.judgeConfig }, actualOutput, expected)
        ? 'ACCEPTED'
        : 'WRONG_ANSWER';
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
    req.log.error({ err: err.message }, '[Run] Failed');
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

// GET /api/submissions/:id — poll result (fallback if SSE not used)
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
