const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

// ── Request ID middleware ─────────────────────────────────────────────────────
const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('x-request-id', req.id);
  next();
};

// ── Helmet security headers ───────────────────────────────────────────────────
const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // API only; CSP handled by frontend
});

// ── Global rate limiter (all routes) ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  keyGenerator: (req) => req.headers['x-forwarded-for'] || req.ip,
});

// ── Auth rate limiter (login/register: tight) ─────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again in 15 minutes.' },
  keyGenerator: (req) => req.headers['x-forwarded-for'] || req.ip,
});

// ── Submission rate limiter (prevent abuse of code execution) ─────────────────
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Submission rate limit exceeded. Please wait before submitting again.' },
  keyGenerator: (req) => req.user?.id || req.headers['x-forwarded-for'] || req.ip,
});

// ── AI rate limiter ────────────────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait a moment.' },
  keyGenerator: (req) => req.user?.id || req.headers['x-forwarded-for'] || req.ip,
});

module.exports = {
  requestId,
  helmetMiddleware,
  globalLimiter,
  authLimiter,
  submissionLimiter,
  aiLimiter,
};
