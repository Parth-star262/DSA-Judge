const mockGenerateContent = jest.fn();
const mockGroqCreate = jest.fn();

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
  };
});

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockGroqCreate,
      },
    },
  }));
});

describe('callAI', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GROQ_API_KEY = 'test-groq-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    mockGenerateContent.mockReset();
    mockGroqCreate.mockReset();
  });

  it('returns the Gemini response trimmed to five lines', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'one\ntwo\nthree\nfour\nfive\nsix',
      },
    });

    const { callAI } = require('../src/services/aiService');
    const result = await callAI('system', 'user', null);

    expect(result.ok).toBe(true);
    expect(result.text).toBe('one\ntwo\nthree\nfour\nfive');
    expect(mockGroqCreate).not.toHaveBeenCalled();
  });

  it('falls back to Groq when Gemini fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('gemini down'));
    mockGroqCreate.mockResolvedValue({
      choices: [{ message: { content: 'fallback line 1\nfallback line 2\nfallback line 3' } }],
    });

    const { callAI } = require('../src/services/aiService');
    const result = await callAI('system', 'user', null);

    expect(result.ok).toBe(true);
    expect(result.text).toBe('fallback line 1\nfallback line 2\nfallback line 3');
  });
});