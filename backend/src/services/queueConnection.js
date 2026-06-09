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

module.exports = { buildQueueConnection };
