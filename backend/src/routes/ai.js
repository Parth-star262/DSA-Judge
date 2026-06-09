const express = require('express');
const prisma = require('../services/prisma');
const { auth } = require('../middleware/auth');
const { getAIHint, getAICodeReview, getAIDebugHelp } = require('../services/aiService');
const crypto = require('crypto');

const router = express.Router();

const hashPayload = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

// POST /api/ai/hint — get a targeted hint for a problem
router.post('/hint', auth, async (req, res) => {
  try {
    const { problemSlug, code, language } = req.body;
    if (!problemSlug || !code || !language) {
      return res.status(400).json({ error: 'problemSlug, code, and language are required' });
    }

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const result = await getAIHint({
      problemTitle: problem.title,
      problemDescription: problem.description,
      constraints: problem.constraints,
      difficulty: problem.difficulty,
      code,
      language,
      cacheKey: `hint:${problemSlug}:${language}:${hashPayload(code)}`,
    });

    if (!result.ok) {
      return res.status(503).json({ error: result.text });
    }

    res.json({ hint: result.text });
  } catch (err) {
    console.error('[AI Hint]', err.message);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

// POST /api/ai/review — get code review after run/submit
router.post('/review', auth, async (req, res) => {
  try {
    const { problemSlug, code, language, verdict, score, passedCases, totalCases, complexityEstimate } = req.body;
    if (!problemSlug || !code || !language || !verdict) {
      return res.status(400).json({ error: 'problemSlug, code, language, and verdict are required' });
    }

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const result = await getAICodeReview({
      problemTitle: problem.title,
      difficulty: problem.difficulty,
      code,
      language,
      verdict,
      score: score || 0,
      passedCases: passedCases || 0,
      totalCases: totalCases || 0,
      complexityEstimate,
      cacheKey: `review:${problemSlug}:${language}:${verdict}:${score || 0}:${passedCases || 0}:${totalCases || 0}:${hashPayload(code)}`,
    });

    if (!result.ok) {
      return res.status(503).json({ error: result.text });
    }

    res.json({ review: result.text });
  } catch (err) {
    console.error('[AI Review]', err.message);
    res.status(500).json({ error: 'Failed to generate review' });
  }
});

// POST /api/ai/debug — explain why a test case failed
router.post('/debug', auth, async (req, res) => {
  try {
    const { problemSlug, code, language, input, expectedOutput, actualOutput, stderr } = req.body;
    if (!problemSlug || !code || !language) {
      return res.status(400).json({ error: 'problemSlug, code, and language are required' });
    }

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const result = await getAIDebugHelp({
      problemTitle: problem.title,
      code,
      language,
      input: input || '',
      expectedOutput: expectedOutput || '',
      actualOutput: actualOutput || '',
      stderr: stderr || '',
      cacheKey: `debug:${problemSlug}:${language}:${hashPayload([code, input || '', expectedOutput || '', actualOutput || '', stderr || ''].join('::'))}`,
    });

    if (!result.ok) {
      return res.status(503).json({ error: result.text });
    }

    res.json({ analysis: result.text });
  } catch (err) {
    console.error('[AI Debug]', err.message);
    res.status(500).json({ error: 'Failed to generate debug analysis' });
  }
});

module.exports = router;
