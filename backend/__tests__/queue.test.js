jest.mock('../src/services/redis', () => ({
  getBullmqConnection: jest.fn(() => ({ host: 'redis', port: 6379 })),
}));

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((_name, options) => ({
    options,
    add: jest.fn().mockResolvedValue({ id: 'sub-1' }),
  })),
  Worker: jest.fn().mockImplementation((_name, processor, options) => ({
    processor,
    options,
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
  QueueEvents: jest.fn(),
}));

jest.mock('../src/services/prisma', () => ({
  problem: { findUnique: jest.fn() },
}));

jest.mock('../src/services/submissionJudge', () => ({
  judgeSubmission: jest.fn(),
}));

const { Queue, Worker } = require('bullmq');
const prisma = require('../src/services/prisma');
const { judgeSubmission } = require('../src/services/submissionJudge');
const { getQueue, processJudgeJob, startWorker } = require('../src/workers/judgeWorker');

describe('submission queue pipeline', () => {
  beforeEach(() => jest.clearAllMocks());

  it('configures retries and enqueues a submission job', async () => {
    const queue = getQueue();
    await queue.add('judge', {
      submissionId: 'sub-1',
      userId: 'user-1',
      problemSlug: 'two-sum',
      code: 'solution',
      language: 'cpp',
    });

    expect(Queue).toHaveBeenCalledWith('submission-judge', expect.objectContaining({
      defaultJobOptions: expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }),
    }));
    expect(queue.add).toHaveBeenCalledWith('judge', expect.objectContaining({ submissionId: 'sub-1' }));
  });

  it('loads the problem and delegates judging to the worker processor', async () => {
    const problem = { id: 'problem-1', slug: 'two-sum', testCases: [], scalingInputs: [] };
    const result = { submissionId: 'sub-1', verdict: 'ACCEPTED', score: 100 };
    prisma.problem.findUnique.mockResolvedValue(problem);
    judgeSubmission.mockResolvedValue(result);

    await expect(processJudgeJob({
      data: { submissionId: 'sub-1', userId: 'user-1', problemSlug: 'two-sum', code: 'solution', language: 'cpp' },
    })).resolves.toEqual(result);
    expect(judgeSubmission).toHaveBeenCalledWith({
      submissionId: 'sub-1',
      userId: 'user-1',
      problem,
      code: 'solution',
      language: 'cpp',
    });
  });

  it('creates a worker with the configured concurrency', () => {
    startWorker();
    expect(Worker).toHaveBeenCalledWith('submission-judge', expect.any(Function), expect.objectContaining({ concurrency: 4 }));
  });
});
