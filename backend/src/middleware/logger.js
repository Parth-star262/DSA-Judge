const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'dsa-judge-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Pretty-print in dev; structured JSON in production
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname,service' } }
      : undefined,
});

/**
 * Express request logger middleware.
 * Attaches logger to req.log so routes can use req.log.info({ ... }, 'message').
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  req.log = logger.child({ requestId: req.id });

  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    req.log[level](
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: ms,
        userId: req.user?.id,
      },
      `${req.method} ${req.originalUrl} ${res.statusCode} (${ms}ms)`
    );
  });

  next();
};

module.exports = { logger, requestLogger };
