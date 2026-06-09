const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    if (times > 5) return null;
    return Math.min(times * 300, 2000);
  },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));
redis.on('end', () => {
  console.error('Redis connection closed after retry attempts. Cache and queue features are unavailable.');
});

const ensureRedisConnection = async () => {
  await redis.ping();
};

const setResult = async (submissionId, data, ttlSeconds = 3600) => {
  await redis.set(`result:${submissionId}`, JSON.stringify(data), 'EX', ttlSeconds);
};

const getResult = async (submissionId) => {
  try {
    const data = await redis.get(`result:${submissionId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setProblemCache = async (slug, data, ttlSeconds = 600) => {
  try {
    await redis.set(`problem:${slug}`, JSON.stringify(data), 'EX', ttlSeconds);
  } catch {
    // Problem details can still be served directly from the database.
  }
};

const getProblemCache = async (slug) => {
  try {
    const data = await redis.get(`problem:${slug}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setTestCaseCache = async (problemId, data, ttlSeconds = 600) => {
  try {
    await redis.set(`testcases:${problemId}`, JSON.stringify(data), 'EX', ttlSeconds);
  } catch {
    // Test cases can still be read from the database.
  }
};

const getTestCaseCache = async (problemId) => {
  try {
    const data = await redis.get(`testcases:${problemId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

module.exports = {
  redis,
  ensureRedisConnection,
  setResult,
  getResult,
  setProblemCache,
  getProblemCache,
  setTestCaseCache,
  getTestCaseCache,
};
