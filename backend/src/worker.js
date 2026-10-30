const { startWorker } = require('./workers/judgeWorker');
const { logger } = require('./middleware/logger');

const worker = startWorker();

const shutdown = async (signal) => {
  logger.info({ signal }, '[Worker] Shutting down');
  try {
    await worker.close();
    process.exit(0);
  } catch (error) {
    logger.error({ err: error.message }, '[Worker] Graceful shutdown failed');
    process.exit(1);
  }
};

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
