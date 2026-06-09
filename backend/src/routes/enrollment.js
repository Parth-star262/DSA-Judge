const express = require('express');
const prisma = require('../services/prisma');
const { auth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// POST /api/enrollment/enroll — self-enroll (free → enrolled)
router.post('/enroll', auth, async (req, res) => {
  try {
    if (req.user.role !== 'FREE') {
      return res.json({ message: 'Already enrolled', role: req.user.role });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { role: 'ENROLLED' },
    });

    // Issue new token with updated role
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Enrolled successfully!', token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enrollment/grant — admin grants enrollment to a user
router.post('/grant', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { email } = req.body;
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ENROLLED' },
    });

    res.json({ message: `${user.email} is now enrolled`, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
