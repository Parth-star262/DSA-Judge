const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

prisma.platformAccount.findMany({
  where: { platform: 'LEETCODE' },
  select: { username: true, currentRating: true, ratingHistory: true, lastSyncedAt: true },
}).then((accounts) => {
  console.log(JSON.stringify(accounts, null, 2));
}).finally(() => prisma.$disconnect());
