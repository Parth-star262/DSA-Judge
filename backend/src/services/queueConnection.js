const SUBMISSION_QUEUE_NAME = 'submissions';

const buildQueueConnection = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return { host: '127.0.0.1', port: 6379 };
  }

  try {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      db: parsed.pathname && parsed.pathname !== '/' ? Number(parsed.pathname.slice(1)) : undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return { host: '127.0.0.1', port: 6379 };
  }
};

const describeQueueConnection = () => {
  const connection = buildQueueConnection();
  return {
    host: connection.host,
    port: connection.port,
    db: connection.db ?? 0,
    tls: Boolean(connection.tls),
    username: connection.username ? 'configured' : 'default',
  };
};

module.exports = {
  SUBMISSION_QUEUE_NAME,
  buildQueueConnection,
  describeQueueConnection,
};
