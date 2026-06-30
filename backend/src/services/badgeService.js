const prisma = require('./prisma');
const { logger } = require('../middleware/logger');

/**
 * Badge definitions — each has a type key, display name, description,
 * and a check function that receives submission context.
 */
const BADGE_DEFINITIONS = [
  {
    type: 'FIRST_SOLVE',
    name: '🎯 First Blood',
    description: 'Solved your very first problem',
    check: async ({ userId }) => {
      const count = await prisma.userProgress.count({ where: { userId, status: 'SOLVED' } });
      return count === 1;
    },
  },
  {
    type: 'SOLVE_10',
    name: '🔟 Ten Down',
    description: 'Solved 10 problems',
    check: async ({ userId }) => {
      const count = await prisma.userProgress.count({ where: { userId, status: 'SOLVED' } });
      return count >= 10;
    },
  },
  {
    type: 'SOLVE_50',
    name: '🚀 Problem Crusher',
    description: 'Solved 50 problems',
    check: async ({ userId }) => {
      const count = await prisma.userProgress.count({ where: { userId, status: 'SOLVED' } });
      return count >= 50;
    },
  },
  {
    type: 'STREAK_7',
    name: '🔥 Week Warrior',
    description: '7-day solving streak',
    check: async ({ userId }) => {
      const streak = await prisma.streak.findUnique({ where: { userId } });
      return (streak?.currentStreak || 0) >= 7;
    },
  },
  {
    type: 'STREAK_30',
    name: '⚡ Monthly Grinder',
    description: '30-day solving streak',
    check: async ({ userId }) => {
      const streak = await prisma.streak.findUnique({ where: { userId } });
      return (streak?.currentStreak || 0) >= 30;
    },
  },
  {
    type: 'HARD_SOLVE',
    name: '💪 Hard Hitter',
    description: 'Solved a HARD problem',
    check: async ({ userId, problem }) => {
      if (problem?.difficulty === 'HARD') return true;
      const hard = await prisma.submission.findFirst({
        where: {
          userId,
          verdict: 'ACCEPTED',
          problem: { difficulty: 'HARD' },
        },
        include: { problem: { select: { difficulty: true } } },
      });
      return !!hard;
    },
  },
  {
    type: 'COMPLEXITY_MASTER',
    name: '📐 Complexity Master',
    description: 'Achieved optimal time complexity on a submission',
    check: async ({ complexityMatch }) => {
      return complexityMatch === true;
    },
  },
  {
    type: 'TOPIC_ARRAYS',
    name: '📊 Array Ace',
    description: 'Solved all Array problems',
    check: async ({ userId }) => {
      const topic = await prisma.topic.findFirst({ where: { slug: 'arrays' } });
      if (!topic) return false;
      const total = await prisma.problem.count({ where: { topicId: topic.id } });
      const solved = await prisma.userProgress.count({
        where: { userId, status: 'SOLVED', problem: { topicId: topic.id } },
      });
      return total > 0 && solved >= total;
    },
  },
];

/**
 * Attempt to award any newly earned badges.
 * Safe to call after every ACCEPTED verdict — skips already-awarded badges via @@unique.
 */
const awardBadges = async ({ userId, problem, complexityMatch }) => {
  const newBadges = [];

  for (const def of BADGE_DEFINITIONS) {
    try {
      const earned = await def.check({ userId, problem, complexityMatch });
      if (!earned) continue;

      // @@unique([userId, badgeType]) prevents duplicates at DB level
      await prisma.badge.upsert({
        where: { userId_badgeType: { userId, badgeType: def.type } },
        update: {},
        create: { userId, badgeType: def.type },
      });

      newBadges.push({ type: def.type, name: def.name, description: def.description });
    } catch (err) {
      // P2002 = unique constraint violation = badge already exists, ignore
      if (err.code !== 'P2002') {
        logger.warn({ badgeType: def.type, userId, err: err.message }, '[Badges] Failed to check/award badge');
      }
    }
  }

  if (newBadges.length > 0) {
    logger.info({ userId, badges: newBadges.map((b) => b.type) }, '[Badges] New badges awarded');
  }

  return newBadges;
};

/**
 * Metadata map for frontend display (badge type → display info)
 */
const BADGE_META = Object.fromEntries(
  BADGE_DEFINITIONS.map((d) => [d.type, { name: d.name, description: d.description }])
);

module.exports = { awardBadges, BADGE_META };
