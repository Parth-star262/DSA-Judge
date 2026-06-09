const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const problemCount = await prisma.problem.count();
    const topicCount = await prisma.topic.count();
    console.log(`Problems: ${problemCount}`);
    console.log(`Topics: ${topicCount}`);
  } catch (e) {
    console.error('Error connecting to database:');
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
