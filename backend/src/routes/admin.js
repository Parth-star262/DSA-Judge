const express = require('express');
const prisma = require('../services/prisma');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats — Overall dashboard statistics
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const [userCount, problemCount, submissionCount, pendingSubmissions] = await Promise.all([
      prisma.user.count(),
      prisma.problem.count(),
      prisma.submission.count(),
      prisma.submission.count({ where: { verdict: 'PENDING' } }),
    ]);

    // Get recent activity (last 5 submissions)
    const recentSubmissions = await prisma.submission.findMany({
      take: 5,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { name: true } },
        problem: { select: { title: true } },
      },
    });

    // Get distribution of difficulty
    const difficulties = await prisma.problem.groupBy({
      by: ['difficulty'],
      _count: true,
    });

    res.json({
      stats: {
        totalUsers: userCount,
        totalProblems: problemCount,
        totalSubmissions: submissionCount,
        pendingSubmissions,
      },
      recentActivity: recentSubmissions,
      problemDistribution: difficulties,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users — List all users
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { submissions: true }
        }
      }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id — Update user role
router.put('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['FREE', 'ENROLLED', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/submissions — List all submissions
router.get('/submissions', auth, requireAdmin, async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      take: 100,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        problem: { select: { title: true, slug: true } },
      },
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
