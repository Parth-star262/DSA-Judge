const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const badgeTable = await prisma.$queryRawUnsafe(
    `SELECT to_regclass('public."Badge"') IS NOT NULL AS table_exists`
  );

  const tableExists = Array.isArray(badgeTable) && badgeTable[0]?.table_exists;
  if (!tableExists) {
    console.log('Badge table not present yet. Skipping cleanup.');
    return;
  }

  const deleted = await prisma.$executeRawUnsafe(`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY "userId", "badgeType"
          ORDER BY "awardedAt" ASC, id ASC
        ) AS row_num
      FROM "Badge"
    )
    DELETE FROM "Badge"
    WHERE id IN (SELECT id FROM ranked WHERE row_num > 1)
  `);

  console.log(`Removed ${deleted} duplicate badge record(s).`);
}

main()
  .catch((error) => {
    console.error('Badge cleanup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });