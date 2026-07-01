const { Queue, Worker, QueueEvents } = require('bullmq');
const { logger } = require('../middleware/logger');
const { getBullmqConnection } = require('../services/redis');

const QUEUE_NAME = 'submission-judge';

// ── Redis connection config ────────────────────────────────────────────────────
const redisConnection = getBullmqConnection();

// ── Queue (used by submission route to enqueue jobs) ──────────────────────────
let submissionQueue = null;

const getQueue = () => {
  if (!submissionQueue) {
    submissionQueue = new Queue(QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 100 },
      },
    });
  }
  return submissionQueue;
};

// ── Queue Events (for SSE streaming in routes) ────────────────────────────────
let queueEvents = null;

const getQueueEvents = () => {
  if (!queueEvents) {
    queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection });
  }
  return queueEvents;
};

// ── Worker (runs in same process; extracted here for clean code) ───────────────
const startWorker = () => {
  const { judgeSubmission } = require('../services/submissionJudge');
  const prisma = require('../services/prisma');

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { submissionId, userId, problemSlug, code, language } = job.data;
      logger.info({ submissionId, problemSlug, language }, '[Worker] Processing submission');

      // Load problem with all test cases
      const problem = await prisma.problem.findUnique({
        where: { slug: problemSlug },
        include: { testCases: true, scalingInputs: true },
      });

      if (!problem) {
        throw new Error(`Problem not found: ${problemSlug}`);
      }

      const result = await judgeSubmission({
        submissionId,
        userId,
        problem,
        code,
        language,
      });

      logger.info({ submissionId, verdict: result.verdict }, '[Worker] Submission judged');
      return result;
    },
    {
      connection: redisConnection,
      concurrency: 4, // Process up to 4 submissions simultaneously
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, submissionId: job?.data?.submissionId, err: err.message }, '[Worker] Job failed');
  });

  worker.on('error', (err) => {
    logger.error({ err: err.message }, '[Worker] Worker error');
  });

  logger.info('[Worker] Submission judge worker started (concurrency=4)');
  return worker;
};

module.exports = { getQueue, getQueueEvents, startWorker };
