const prisma = require('./src/services/prisma');

async function fixTestCases() {
  const problemSlug = 'separate-the-digits-in-an-array';
  const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
  
  if (!problem) {
    console.log('Problem not found');
    return;
  }

  // Sample Case 1
  // Old: nums = [13,25,83,77] -> [1,3,2,5,8,3,7,7]
  await prisma.testCase.updateMany({
    where: { 
      problemId: problem.id,
      input: { contains: '13,25,83,77' }
    },
    data: {
      input: '13 25 83 77',
      expectedOutput: '1 3 2 5 8 3 7 7'
    }
  });

  // Sample Case 2
  // Old: nums = [7,1,3,9] -> [7,1,3,9]
  await prisma.testCase.updateMany({
    where: { 
      problemId: problem.id,
      input: { contains: '7,1,3,9' }
    },
    data: {
      input: '7 1 3 9',
      expectedOutput: '7 1 3 9'
    }
  });

  console.log('Test cases updated successfully');
}

fixTestCases().finally(() => prisma.$disconnect());
