const express = require('express');
const prisma = require('../services/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

const startOfLocalDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const daysBetween = (olderDate, newerDate) => {
  const older = startOfLocalDay(olderDate);
  const newer = startOfLocalDay(newerDate);
  return Math.round((newer - older) / (24 * 60 * 60 * 1000));
};

const getDisplayCurrentStreak = (streak) => {
  if (!streak?.lastSolvedAt) return 0;
  return daysBetween(streak.lastSolvedAt, new Date()) <= 1 ? streak.currentStreak : 0;
};

// GET /api/leaderboard/global
router.get('/leaderboard/global', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 50);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        submissions: { select: { verdict: true, problemId: true } },
        streak: { select: { currentStreak: true, longestStreak: true, lastSolvedAt: true } },
      },
    });

    const leaderboard = users
      .map((u) => {
        const judgedSubmissions = u.submissions.filter((s) => s.verdict !== 'PENDING');
        const acceptedSubmissions = judgedSubmissions.filter((s) => s.verdict === 'ACCEPTED');
        const attempted = judgedSubmissions.length;
        const solved = new Set(acceptedSubmissions.map((s) => s.problemId)).size;
        const acceptanceRate = attempted > 0 ? (acceptedSubmissions.length / attempted) * 100 : 0;
        return {
          userId: u.id,
          name: u.name,
          solved,
          attempted,
          acceptanceRate: Number(acceptanceRate.toFixed(1)),
          currentStreak: getDisplayCurrentStreak(u.streak),
          longestStreak: u.streak?.longestStreak || 0,
        };
      })
      .filter((u) => u.attempted > 0)
      .sort((a, b) => {
        if (b.solved !== a.solved) return b.solved - a.solved;
        if (b.acceptanceRate !== a.acceptanceRate) return b.acceptanceRate - a.acceptanceRate;
        return b.longestStreak - a.longestStreak;
      })
      .slice(0, limit);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:userId/profile
router.get('/users/:userId/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        streak: { select: { currentStreak: true, longestStreak: true, lastSolvedAt: true } },
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            verdict: true,
            score: true,
            submittedAt: true,
            complexityEstimate: true,
            problem: { select: { title: true, slug: true } },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      ...user,
      streak: user.streak ? { ...user.streak, currentStreak: getDisplayCurrentStreak(user.streak) } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/streaks/me
router.get('/streaks/me', auth, async (req, res) => {
  try {
    let streak = await prisma.streak.findUnique({ where: { userId: req.user.id } });

    if (!streak) {
      streak = await prisma.streak.create({ data: { userId: req.user.id } });
    }

    res.json(streak);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookmarks/me
router.get('/bookmarks/me', auth, async (req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      include: {
        problem: {
          select: { id: true, slug: true, title: true, difficulty: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookmarks
router.post('/bookmarks', auth, async (req, res) => {
  try {
    const { problemSlug } = req.body;
    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_problemId: {
          userId: req.user.id,
          problemId: problem.id,
        },
      },
      update: {},
      create: {
        userId: req.user.id,
        problemId: problem.id,
      },
    });

    res.json({ message: 'Bookmarked', bookmark });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookmarks/:problemSlug
router.delete('/bookmarks/:problemSlug', auth, async (req, res) => {
  try {
    const problem = await prisma.problem.findUnique({ where: { slug: req.params.problemSlug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    await prisma.bookmark.delete({
      where: {
        userId_problemId: {
          userId: req.user.id,
          problemId: problem.id,
        },
      },
    });

    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/collections/me
router.get('/collections/me', auth, async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.user.id },
      include: {
        problems: {
          select: { id: true, slug: true, title: true, difficulty: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(collections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/collections
router.post('/collections', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const collection = await prisma.collection.create({
      data: {
        userId: req.user.id,
        name,
        description,
      },
    });

    res.status(201).json(collection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/collections/:collectionId/add
router.put('/collections/:collectionId/add', auth, async (req, res) => {
  try {
    const { problemSlug } = req.body;

    const collection = await prisma.collection.findUnique({ where: { id: req.params.collectionId } });
    if (!collection || collection.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const updated = await prisma.collection.update({
      where: { id: req.params.collectionId },
      data: { problems: { connect: { id: problem.id } } },
      include: {
        problems: {
          select: { id: true, slug: true, title: true, difficulty: true },
        },
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/problems/:slug/comments
router.get('/problems/:slug/comments', async (req, res) => {
  try {
    const problem = await prisma.problem.findUnique({ where: { slug: req.params.slug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const where = { problemId: problem.id };
    if (req.query.language) where.language = String(req.query.language);

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ upvotes: 'desc' }, { submittedAt: 'desc' }],
    });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/problems/:slug/comments
router.post('/problems/:slug/comments', auth, async (req, res) => {
  try {
    const { content, language } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const problem = await prisma.problem.findUnique({ where: { slug: req.params.slug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const comment = await prisma.comment.create({
      data: {
        problemId: problem.id,
        userId: req.user.id,
        content,
        language,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/comments/:commentId/upvote
router.put('/comments/:commentId/upvote', auth, async (req, res) => {
  try {
    const comment = await prisma.comment.update({
      where: { id: req.params.commentId },
      data: { upvotes: { increment: 1 } },
    });

    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/problems/:slug/rating
router.get('/problems/:slug/rating', auth, async (req, res) => {
  try {
    const problem = await prisma.problem.findUnique({ where: { slug: req.params.slug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const myRating = await prisma.rating.findUnique({
      where: {
        userId_problemId: {
          userId: req.user.id,
          problemId: problem.id,
        },
      },
    });

    const aggregated = await prisma.rating.aggregate({
      where: { problemId: problem.id },
      _avg: { stars: true },
      _count: { stars: true },
    });

    res.json({
      myRating: myRating || null,
      avgRating: Number((aggregated._avg.stars || 0).toFixed(2)),
      totalRatings: aggregated._count.stars,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/problems/:slug/rating
router.post('/problems/:slug/rating', auth, async (req, res) => {
  try {
    const { stars, review } = req.body;
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Stars must be 1-5' });
    }

    const problem = await prisma.problem.findUnique({ where: { slug: req.params.slug } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const rating = await prisma.rating.upsert({
      where: {
        userId_problemId: {
          userId: req.user.id,
          problemId: problem.id,
        },
      },
      create: {
        problemId: problem.id,
        userId: req.user.id,
        stars,
        review,
      },
      update: {
        stars,
        review,
      },
    });

    res.json(rating);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/badges/me
router.get('/badges/me', auth, async (req, res) => {
  try {
    const badges = await prisma.badge.findMany({
      where: { userId: req.user.id },
      orderBy: { awardedAt: 'desc' },
    });

    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/dashboard
router.get('/analytics/dashboard', auth, async (req, res) => {
  try {
    const acceptedSubmissions = await prisma.submission.findMany({
      where: {
        userId: req.user.id,
        verdict: 'ACCEPTED',
      },
      select: { problemId: true },
    });
    const solved = new Set(acceptedSubmissions.map((s) => s.problemId)).size;

    const attempted = await prisma.submission.count({
      where: { userId: req.user.id, verdict: { not: 'PENDING' } },
    });

    const rate = attempted > 0 ? (acceptedSubmissions.length / attempted) * 100 : 0;

    const streak = await prisma.streak.findUnique({
      where: { userId: req.user.id },
    });

    const last7Days = await prisma.submission.count({
      where: {
        userId: req.user.id,
        submittedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    res.json({
      totalSolved: solved,
      totalAttempted: attempted,
      acceptanceRate: Number(rate.toFixed(1)),
      currentStreak: getDisplayCurrentStreak(streak),
      longestStreak: streak?.longestStreak || 0,
      last7Days,
      interviewReadiness: Math.min(100, Math.round((solved / 75) * 100)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
