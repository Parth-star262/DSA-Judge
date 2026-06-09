const express = require('express');
const prisma = require('../services/prisma');
const { redis, getProblemCache, setProblemCache } = require('../services/redis');
const { auth, requireEnrolled, requireAdmin } = require('../middleware/auth');
const { getOptimalSpaceComplexity } = require('../services/spaceComplexity');

const router = express.Router();

const enrichProblemComplexity = (problem) => {
  if (!problem) return problem;
  return {
    ...problem,
    optimalTimeComplexity: problem.targetedTimeComplexity || problem.optimalComplexity || null,
    optimalSpaceComplexity: problem.targetedSpaceComplexity || getOptimalSpaceComplexity(problem.slug),
  };
};

const problemAdminInclude = {
  topic: true,
  testCases: { orderBy: { id: 'asc' } },
  hints: { orderBy: { level: 'asc' } },
  editorial: true,
  companyTags: true,
  scalingInputs: true,
};

const validateProblemPayload = async (body, { requireSlug = true } = {}) => {
  const {
    slug,
    title,
    difficulty,
    topicId,
    description,
    constraints,
    inputFormat,
    outputFormat,
    judgeConfig,
    testCases,
  } = body;
  const normalizedSlug = String(slug || '').trim().toLowerCase();
  const validDifficulties = new Set(['EASY', 'MEDIUM', 'HARD']);

  if (requireSlug && (!normalizedSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug))) {
    return { error: 'Valid slug is required, for example two-sum' };
  }
  if (!title || !description || !constraints || !inputFormat || !outputFormat || !topicId) {
    return { error: 'title, description, constraints, inputFormat, outputFormat, and topicId are required' };
  }
  if (!validDifficulties.has(difficulty)) {
    return { error: 'difficulty must be EASY, MEDIUM, or HARD' };
  }
  if (!Array.isArray(testCases) || testCases.length < 2) {
    return { error: 'At least two test cases are required' };
  }

  if (judgeConfig !== undefined && judgeConfig !== null && typeof judgeConfig === 'string') {
    try {
      JSON.parse(judgeConfig);
    } catch {
      return { error: 'judgeConfig must be valid JSON when provided' };
    }
  }

  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) return { error: 'Topic not found', status: 404 };

  return { normalizedSlug };
};

const buildProblemData = (body, normalizedSlug) => ({
  ...(normalizedSlug ? { slug: normalizedSlug } : {}),
  title: String(body.title).trim(),
  difficulty: body.difficulty,
  description: body.description,
  constraints: body.constraints,
  inputFormat: body.inputFormat,
  outputFormat: body.outputFormat,
  optimalComplexity: body.optimalComplexity || 'O(N)',
  targetedTimeComplexity: body.targetedTimeComplexity || null,
  targetedSpaceComplexity: body.targetedSpaceComplexity || null,
  isPremium: Boolean(body.isPremium),
  judgeConfig: body.judgeConfig ? (typeof body.judgeConfig === 'string' ? JSON.parse(body.judgeConfig) : body.judgeConfig) : null,
  topicId: body.topicId,
});

const mapTestCases = (testCases) => testCases.map((tc) => ({
  input: String(tc.input || ''),
  expectedOutput: String(tc.expectedOutput || ''),
  explanation: String(tc.explanation || ''),
  isSample: Boolean(tc.isSample),
  points: Number(tc.points || 1),
}));

const mapHints = (hints) => (Array.isArray(hints) ? hints : [])
  .filter((hint) => hint.content)
  .map((hint, index) => ({
    level: Number(hint.level || index + 1),
    content: String(hint.content),
  }));

const mapCompanyTags = (companyTags) => (Array.isArray(companyTags) ? companyTags : [])
  .filter(Boolean)
  .map((companyName) => ({ companyName: String(companyName).trim() }));

const mapScalingInputs = (scalingInputs) => (Array.isArray(scalingInputs) ? scalingInputs : [])
  .filter((item) => item.input)
  .map((item) => ({ n: Number(item.n || 0), input: String(item.input) }));

const clearProblemCache = async (slug) => {
  try {
    await redis.del(`problem:${slug}`);
  } catch {
    // Cache invalidation is best effort; DB is the source of truth.
  }
};

// GET /api/problems — topic-wise list
router.get('/', async (req, res) => {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { order: 'asc' },
      include: {
        problems: {
          orderBy: { title: 'asc' },
          select: {
            id: true, slug: true, title: true, difficulty: true, isPremium: true,
            _count: { select: { submissions: true } },
          },
        },
      },
    });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/problems/:slug — problem detail (with sample test cases)
// POST /api/problems/admin/create - admin-only problem creation
router.post('/admin/create', auth, requireAdmin, async (req, res) => {
  try {
    const validation = await validateProblemPayload(req.body);
    if (validation.error) return res.status(validation.status || 400).json({ error: validation.error });

    const problem = await prisma.problem.create({
      data: {
        ...buildProblemData(req.body, validation.normalizedSlug),
        testCases: { create: mapTestCases(req.body.testCases) },
        hints: { create: mapHints(req.body.hints) },
        editorial: req.body.editorial?.content ? {
          create: {
            content: String(req.body.editorial.content),
            videoUrl: req.body.editorial.videoUrl ? String(req.body.editorial.videoUrl) : null,
          },
        } : undefined,
        companyTags: { create: mapCompanyTags(req.body.companyTags) },
        scalingInputs: { create: mapScalingInputs(req.body.scalingInputs) },
      },
      include: problemAdminInclude,
    });

    res.status(201).json(problem);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Problem slug already exists' });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/problems/admin/:slug - admin-only full problem detail for editing
router.get('/admin/:slug', auth, requireAdmin, async (req, res) => {
  try {
    const problem = await prisma.problem.findUnique({
      where: { slug: req.params.slug },
      include: problemAdminInclude,
    });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json(problem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/problems/admin/:slug - admin-only problem edit
router.put('/admin/:slug', auth, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.problem.findUnique({ where: { slug: req.params.slug } });
    if (!existing) return res.status(404).json({ error: 'Problem not found' });

    const validation = await validateProblemPayload(req.body);
    if (validation.error) return res.status(validation.status || 400).json({ error: validation.error });

    const problem = await prisma.$transaction(async (tx) => {
      await tx.testCase.deleteMany({ where: { problemId: existing.id } });
      await tx.hint.deleteMany({ where: { problemId: existing.id } });
      await tx.companyTag.deleteMany({ where: { problemId: existing.id } });
      await tx.scalingInput.deleteMany({ where: { problemId: existing.id } });

      const updated = await tx.problem.update({
        where: { id: existing.id },
        data: {
          ...buildProblemData(req.body, validation.normalizedSlug),
          testCases: { create: mapTestCases(req.body.testCases) },
          hints: { create: mapHints(req.body.hints) },
          companyTags: { create: mapCompanyTags(req.body.companyTags) },
          scalingInputs: { create: mapScalingInputs(req.body.scalingInputs) },
        },
      });

      if (req.body.editorial?.content) {
        await tx.editorial.upsert({
          where: { problemId: updated.id },
          update: {
            content: String(req.body.editorial.content),
            videoUrl: req.body.editorial.videoUrl ? String(req.body.editorial.videoUrl) : null,
          },
          create: {
            problemId: updated.id,
            content: String(req.body.editorial.content),
            videoUrl: req.body.editorial.videoUrl ? String(req.body.editorial.videoUrl) : null,
          },
        });
      } else {
        await tx.editorial.deleteMany({ where: { problemId: updated.id } });
      }

      return tx.problem.findUnique({
        where: { id: updated.id },
        include: problemAdminInclude,
      });
    });

    await clearProblemCache(req.params.slug);
    if (problem.slug !== req.params.slug) await clearProblemCache(problem.slug);
    res.json(problem);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Problem slug already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const cached = await getProblemCache(req.params.slug);
    if (cached) return res.json(enrichProblemComplexity(cached));

    const problem = await prisma.problem.findUnique({
      where: { slug: req.params.slug },
      include: {
        topic: true,
        testCases: { where: { isSample: true } },  // Only sample cases for free
        companyTags: true,
        editorial: true,
        scalingInputs: true,
      },
    });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const enriched = enrichProblemComplexity(problem);
    await setProblemCache(req.params.slug, enriched);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/problems/:slug/hints — 3-tier hints (level 1 free, 2&3 enrolled)
router.get('/:slug/hints', auth, async (req, res) => {
  try {
    const problem = await prisma.problem.findUnique({ where: { slug: req.params.slug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const isEnrolled = req.user.role !== 'FREE';
    const hints = await prisma.hint.findMany({
      where: { problemId: problem.id },
      orderBy: { level: 'asc' },
    });

    // Free users: return h1 content, h2/h3 locked
    const result = hints.map(h => ({
      level: h.level,
      content: (h.level === 1 || isEnrolled) ? h.content : null,
      locked: h.level > 1 && !isEnrolled,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/problems/:slug/editorial — enrolled only
router.get('/:slug/editorial', auth, requireEnrolled, async (req, res) => {
  try {
    const problem = await prisma.problem.findUnique({ where: { slug: req.params.slug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const editorial = await prisma.editorial.findUnique({ where: { problemId: problem.id } });
    if (!editorial) return res.status(404).json({ error: 'No editorial yet' });

    res.json(editorial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/problems/:slug/progress — user's progress on this problem
router.get('/:slug/progress', auth, async (req, res) => {
  try {
    const problem = await prisma.problem.findUnique({ where: { slug: req.params.slug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const progress = await prisma.userProgress.findUnique({
      where: { userId_problemId: { userId: req.user.id, problemId: problem.id } },
    });
    res.json(progress || { status: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/problems/:slug/progress — update progress
router.post('/:slug/progress', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const problem = await prisma.problem.findUnique({ where: { slug: req.params.slug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const progress = await prisma.userProgress.upsert({
      where: { userId_problemId: { userId: req.user.id, problemId: problem.id } },
      update: { status },
      create: { userId: req.user.id, problemId: problem.id, status },
    });
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
