const prisma = require('../src/services/prisma');

jest.mock('../src/services/prisma', () => ({
  userProgress: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  streak: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  submission: {
    update: jest.fn(),
  },
}));

jest.mock('../src/services/judge0', () => ({
  executeCode: jest.fn(),
}));

jest.mock('../src/services/complexity', () => ({
  classifyComplexity: jest.fn(),
}));

jest.mock('../src/services/spaceComplexity', () => ({
  estimateSpaceComplexity: jest.fn(() => 'O(1)'),
  getOptimalSpaceComplexity: jest.fn(() => 'O(1)'),
}));

jest.mock('../src/services/codeHarness', () => ({
  buildExecutableCode: jest.fn((_problem, _language, code) => code),
  compareOutput: jest.fn(),
}));

jest.mock('../src/services/badgeService', () => ({
  awardBadges: jest.fn(),
}));

const { executeCode } = require('../src/services/judge0');
const { classifyComplexity } = require('../src/services/complexity');
const { compareOutput } = require('../src/services/codeHarness');
const { awardBadges } = require('../src/services/badgeService');

const { judgeSubmission } = require('../src/services/submissionJudge');

describe('judgeSubmission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.userProgress.findUnique.mockResolvedValue(null);
    prisma.streak.findUnique.mockResolvedValue(null);
    classifyComplexity.mockReturnValue('O(N)');
    awardBadges.mockResolvedValue([]);
  });

  it('marks an accepted submission and awards badges', async () => {
    executeCode
      .mockResolvedValueOnce({ statusId: 3, stdout: '1\n', time: 0.1 })
      .mockResolvedValueOnce({ statusId: 3, stdout: '2\n', time: 0.1 });
    compareOutput.mockReturnValue(true);

    const result = await judgeSubmission({
      submissionId: 'sub-1',
      userId: 'user-1',
      problem: {
        id: 'prob-1',
        slug: 'two-sum',
        testCases: [
          { input: '1', expectedOutput: '1' },
          { input: '2', expectedOutput: '2' },
        ],
        scalingInputs: [],
        optimalComplexity: 'O(N)',
      },
      code: 'solution',
      language: 'cpp',
    });

    expect(result.verdict).toBe('ACCEPTED');
    expect(prisma.submission.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'sub-1' },
      data: expect.objectContaining({ verdict: 'ACCEPTED', score: 100, passedCases: 2 }),
    }));
    expect(awardBadges).toHaveBeenCalled();
  });

  it('marks a partially solved submission when outputs do not match', async () => {
    executeCode
      .mockResolvedValueOnce({ statusId: 3, stdout: '1\n', time: 0.1 })
      .mockResolvedValueOnce({ statusId: 3, stdout: '3\n', time: 0.1 });
    compareOutput
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    const result = await judgeSubmission({
      submissionId: 'sub-2',
      userId: 'user-1',
      problem: {
        id: 'prob-1',
        slug: 'two-sum',
        testCases: [
          { input: '1', expectedOutput: '1' },
          { input: '2', expectedOutput: '2' },
        ],
        scalingInputs: [],
        optimalComplexity: 'O(N)',
      },
      code: 'solution',
      language: 'cpp',
    });

    expect(result.verdict).toBe('PARTIAL');
    expect(awardBadges).not.toHaveBeenCalled();
  });
});