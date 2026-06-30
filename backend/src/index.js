const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// ── Phase 1: Security & Logging Middleware ────────────────────────────────────
const { requestId, helmetMiddleware, globalLimiter, authLimiter, submissionLimiter, aiLimiter } = require('./middleware/security');
const { requestLogger } = require('./middleware/logger');

const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');
const enrollmentRoutes = require('./routes/enrollment');
const featuresRoutes = require('./routes/features');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const contestRoutes = require('./routes/contests'); // Phase 4

const app = express();

// ── Core Middleware ───────────────────────────────────────────────────────────
app.set('trust proxy', 1); // Required for rate limiter behind reverse proxy (Render)
app.use(requestId);
app.use(helmetMiddleware);
app.use(globalLimiter);
app.use(cors());
app.use(express.json({ limit: '2mb' })); // Limit payload to prevent abuse
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes); // submissionLimiter applied per endpoint inside
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api', featuresRoutes);

// ── Health Checks ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  const { logger } = require('./middleware/logger');
  try {
    const prisma = require('./services/prisma');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', db: 'connected' });
  } catch (err) {
    logger.error({ err }, 'Health check: DB not ready');
    res.status(503).json({ status: 'not ready', db: 'disconnected', error: err.message });
  }
});

// ── Root Info ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'DSA Judge API is running',
    version: '2.0.0',
    health: '/health',
    routes: {
      auth: '/api/auth',
      problems: '/api/problems',
      submissions: '/api/submissions',
      enrollment: '/api/enrollment',
      ai: '/api/ai',
      contests: '/api/contests',
    },
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  const log = req.log || require('./middleware/logger').logger;
  log.error({ err, method: req.method, url: req.originalUrl }, 'Unhandled error');
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const { logger } = require('./middleware/logger');
  const { exec } = require('child_process');

  // Start the judge worker (Phase 2)
  const { startWorker } = require('./workers/judgeWorker');
  startWorker();

  exec('g++ --version', (err, stdout, stderr) => {
    if (err) logger.warn({ err: err.message }, '[Diagnostic] g++ not found');
    else logger.info({ version: stdout.trim() }, '[Diagnostic] g++ available');
  });

  app.listen(PORT, () => {
    logger.info({ port: PORT }, `DSA Judge API started on http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app;
