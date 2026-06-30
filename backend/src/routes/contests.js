const express = require('express');
const prisma = require('../services/prisma');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/contests — list upcoming and active contests
router.get('/', async (req, res) => {
  try {
    const contests = await prisma.contest.findMany({
      orderBy: { startAt: 'desc' },
      include: {
        problems: {
          select: { id: true, order: true, points: true, problem: { select: { title: true, slug: true, difficulty: true } } },
          orderBy: { order: 'asc' },
        },
        _count: { select: { submissions: true } },
      },
    });
    res.json(contests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contests/:slug — contest detail
router.get('/:slug', async (req, res) => {
  try {
    const contest = await prisma.contest.findUnique({
      where: { slug: req.params.slug },
      include: {
        problems: {
          select: { id: true, order: true, points: true, problem: { select: { title: true, slug: true, difficulty: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!contest) return res.status(404).json({ error: 'Contest not found' });
    res.json(contest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contests/:slug/leaderboard — contest-specific leaderboard
router.get('/:slug/leaderboard', async (req, res) => {
  try {
    const contest = await prisma.contest.findUnique({ where: { slug: req.params.slug } });
    if (!contest) return res.status(404).json({ error: 'Contest not found' });

    const submissions = await prisma.contestSubmission.findMany({
      where: { contestId: contest.id },
      include: { submission: { select: { verdict: true, score: true } } },
      orderBy: { submittedAt: 'asc' },
    });

    // Calculate leaderboard: first AC per user per problem wins
    const userMap = {};
    for (const cs of submissions) {
      if (cs.submission.verdict !== 'ACCEPTED') continue;
      const key = `${cs.userId}:${cs.problemId}`;
      if (!userMap[key]) {
        if (!userMap[cs.userId]) userMap[cs.userId] = { userId: cs.userId, solvedCount: 0, totalTime: 0, problems: {} };
        userMap[cs.userId].problems[cs.problemId] = cs.timeTaken;
        userMap[cs.userId].solvedCount++;
        userMap[cs.userId].totalTime += cs.timeTaken;
      }
    }

    // Fetch user names
    const userIds = Object.keys(userMap).filter((k) => !k.includes(':'));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userNameMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    const leaderboard = Object.values(userMap)
      .map((u) => ({ ...u, name: userNameMap[u.userId] || 'Unknown' }))
      .sort((a, b) => b.solvedCount - a.solvedCount || a.totalTime - b.totalTime);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contests — admin: create contest
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { title, slug, description, startAt, endAt, problems } = req.body;
    if (!title || !slug || !startAt || !endAt) {
      return res.status(400).json({ error: 'title, slug, startAt, endAt required' });
    }

    const contest = await prisma.contest.create({
      data: {
        title,
        slug: slug.toLowerCase(),
        description,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        problems: {
          create: Array.isArray(problems)
            ? await Promise.all(
                problems.map(async (p, i) => {
                  const problem = await prisma.problem.findUnique({ where: { slug: p.slug } });
                  if (!problem) throw new Error(`Problem not found: ${p.slug}`);
                  return { problemId: problem.id, order: i, points: p.points || 100 };
                })
              )
            : [],
        },
      },
      include: { problems: true },
    });

    res.status(201).json(contest);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Contest slug already exists' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
