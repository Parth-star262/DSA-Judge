const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProblem() {
  const problem = await prisma.problem.findUnique({
    where: { slug: 'separate-the-digits-in-an-array' },
    include: { testCases: true }
  });
  console.log(JSON.stringify(problem, null, 2));
}

checkProblem().finally(() => prisma.$disconnect());
