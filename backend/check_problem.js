const prisma = require('./src/services/prisma');

async function checkProblem() {
  try {
    const problem = await prisma.problem.findUnique({
      where: { slug: 'separate-the-digits-in-an-array' },
      include: { testCases: true }
    });
    console.log(JSON.stringify(problem, null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkProblem().finally(() => prisma.$disconnect());
