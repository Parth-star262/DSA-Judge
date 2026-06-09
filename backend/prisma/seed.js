const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Topics
  const topicsData = [
    { name: 'Arrays', slug: 'arrays', order: 1 },
    { name: 'Strings', slug: 'strings', order: 2 },
    { name: 'Linked Lists', slug: 'linked-lists', order: 3 },
    { name: 'Stacks & Queues', slug: 'stacks-queues', order: 4 },
    { name: 'Binary Search', slug: 'binary-search', order: 5 },
    { name: 'Sorting', slug: 'sorting', order: 6 },
    { name: 'Recursion', slug: 'recursion', order: 7 },
    { name: 'Dynamic Programming', slug: 'dynamic-programming', order: 8 },
    { name: 'Trees', slug: 'trees', order: 9 },
    { name: 'Graphs', slug: 'graphs', order: 10 },
    { name: 'Greedy', slug: 'greedy', order: 11 },
    { name: 'Bit Manipulation', slug: 'bit-manipulation', order: 12 },
  ];

  const topics = {};
  for (const t of topicsData) {
    topics[t.slug] = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }

  // Sample Problem 1: Two Sum
  const twoSum = await prisma.problem.upsert({
    where: { slug: 'two-sum' },
    update: {},
    create: {
      slug: 'two-sum',
      title: 'Two Sum',
      difficulty: 'EASY',
      topicId: topics['arrays'].id,
      optimalComplexity: 'O(N)',
      description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
      constraints: `2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9`,
      inputFormat: `Line 1: Array elements separated by spaces\nLine 2: Target integer`,
      outputFormat: `Two space-separated indices`,
      testCases: {
        create: [
          { input: '2 7 11 15\n9', expectedOutput: '0 1', isSample: true, points: 1 },
          { input: '3 2 4\n6', expectedOutput: '1 2', isSample: true, points: 1 },
          { input: '3 3\n6', expectedOutput: '0 1', isSample: false, points: 1 },
          { input: '1 2 3 4 5\n9', expectedOutput: '3 4', isSample: false, points: 1 },
        ],
      },
      scalingInputs: {
        create: [
          { n: 10, input: '1 2 3 4 5 6 7 8 9 10\n19' },
          { n: 100, input: Array.from({length:100},(_,i)=>i+1).join(' ') + '\n199' },
          { n: 1000, input: Array.from({length:1000},(_,i)=>i+1).join(' ') + '\n1999' },
          { n: 10000, input: Array.from({length:10000},(_,i)=>i+1).join(' ') + '\n19999' },
        ],
      },
      hints: {
        create: [
          { level: 1, content: 'Think about using a data structure that gives O(1) lookup.' },
          { level: 2, content: 'Use a HashMap. As you iterate, check if (target - nums[i]) already exists in the map.' },
          { level: 3, content: 'For each index i, compute complement = target - nums[i]. If complement is in the map, return [map[complement], i]. Otherwise, store nums[i] → i in the map.' },
        ],
      },
      editorial: {
        create: {
          content: `## Two Sum — Editorial

### Approach: HashMap (O(N) Time, O(N) Space)

Iterate through the array once. For each element, compute its **complement** (target - current value) and check if it's already in the HashMap.

\`\`\`cpp
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> mp;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (mp.count(complement)) return {mp[complement], i};
        mp[nums[i]] = i;
    }
    return {};
}
\`\`\`

**Time:** O(N) | **Space:** O(N)
`,
        },
      },
      companyTags: {
        create: [
          { companyName: 'Google' },
          { companyName: 'Amazon' },
          { companyName: 'Microsoft' },
          { companyName: 'Meta' },
        ],
      },
    },
  });

  // Sample Problem 2: Longest Subarray with Sum K
  const longestSubarray = await prisma.problem.upsert({
    where: { slug: 'longest-subarray-sum-k' },
    update: {},
    create: {
      slug: 'longest-subarray-sum-k',
      title: 'Longest Subarray with Sum K',
      difficulty: 'MEDIUM',
      topicId: topics['arrays'].id,
      optimalComplexity: 'O(N)',
      description: `Given an array \`nums\` of size \`n\` and an integer \`k\`, find the length of the **longest subarray** that sums to \`k\`. If no such sub-array exists, return 0.`,
      constraints: `1 <= n <= 10^5\n-10^4 <= nums[i] <= 10^4\n-10^9 <= k <= 10^9`,
      inputFormat: `Line 1: n and k separated by space\nLine 2: Array elements separated by spaces`,
      outputFormat: `A single integer — length of the longest subarray`,
      testCases: {
        create: [
          { input: '9 15\n10 5 2 7 1 9', expectedOutput: '4', isSample: true, points: 1 },
          { input: '3 6\n-3 2 1', expectedOutput: '3', isSample: true, points: 1 },
          { input: '6 3\n1 2 3 1 1 1', expectedOutput: '3', isSample: false, points: 1 },
          { input: '1 5\n5', expectedOutput: '1', isSample: false, points: 1 },
        ],
      },
      scalingInputs: {
        create: [
          { n: 10, input: '10 50\n' + Array.from({length:10},(_,i)=>i+1).join(' ') },
          { n: 100, input: '100 500\n' + Array.from({length:100},(_,i)=>i+1).join(' ') },
          { n: 1000, input: '1000 5000\n' + Array.from({length:1000},(_,i)=>i+1).join(' ') },
          { n: 10000, input: '10000 50000\n' + Array.from({length:10000},(_,i)=>i+1).join(' ') },
        ],
      },
      hints: {
        create: [
          { level: 1, content: 'Think about prefix sums — how can a prefix sum help you find subarrays?' },
          { level: 2, content: 'Use a HashMap to store prefix sums. If prefixSum - k exists in the map, you have found a subarray.' },
          { level: 3, content: 'Keep a running prefixSum. For each index i, if (prefixSum - k) is in your map, update maxLen = max(maxLen, i - map[prefixSum-k]). Only store prefixSum in map if not already present (to keep the earliest index).' },
        ],
      },
      editorial: {
        create: {
          content: `## Longest Subarray with Sum K — Editorial

### Approach: Prefix Sum + HashMap (O(N))

\`\`\`cpp
int longestSubarray(vector<int>& nums, int k) {
    unordered_map<long long, int> mp;
    long long prefSum = 0;
    int maxLen = 0;
    mp[0] = -1;
    for (int i = 0; i < nums.size(); i++) {
        prefSum += nums[i];
        if (mp.count(prefSum - k)) maxLen = max(maxLen, i - mp[prefSum - k]);
        if (!mp.count(prefSum)) mp[prefSum] = i;
    }
    return maxLen;
}
\`\`\`

**Time:** O(N) | **Space:** O(N)
`,
        },
      },
      companyTags: {
        create: [{ companyName: 'Amazon' }, { companyName: 'Flipkart' }],
      },
    },
  });

  // Sample Problem 3: Sort an Array of 0s, 1s and 2s
  const sort012 = await prisma.problem.upsert({
    where: { slug: 'sort-array-0s-1s-2s' },
    update: {},
    create: {
      slug: 'sort-array-0s-1s-2s',
      title: "Sort an Array of 0's, 1's and 2's",
      difficulty: 'MEDIUM',
      topicId: topics['arrays'].id,
      optimalComplexity: 'O(N)',
      description: `Given an array \`arr\` of size \`n\` where each element is either 0, 1, or 2, sort the array in non-decreasing order.

Your solution should be in-place and should not use built-in sorting.`,
      constraints: `1 <= n <= 10^6\narr[i] in {0, 1, 2}`,
      inputFormat: `Line 1: n\nLine 2: n space-separated integers (each is 0, 1, or 2)`,
      outputFormat: `The sorted array as n space-separated integers`,
      testCases: {
        create: [
          { input: '5\n0 2 1 2 0', expectedOutput: '0 0 1 2 2', isSample: true, points: 1 },
          { input: '4\n2 2 2 2', expectedOutput: '2 2 2 2', isSample: true, points: 1 },
          { input: '6\n1 0 2 1 0 2', expectedOutput: '0 0 1 1 2 2', isSample: false, points: 1 },
          { input: '1\n0', expectedOutput: '0', isSample: false, points: 1 },
          { input: '8\n2 1 0 1 2 0 1 0', expectedOutput: '0 0 0 1 1 1 2 2', isSample: false, points: 1 },
        ],
      },
      scalingInputs: {
        create: [
          {
            n: 10,
            input: '10\n' + Array.from({ length: 10 }, (_, i) => [0, 1, 2][i % 3]).reverse().join(' '),
          },
          {
            n: 100,
            input: '100\n' + Array.from({ length: 100 }, (_, i) => [2, 1, 0][i % 3]).join(' '),
          },
          {
            n: 1000,
            input: '1000\n' + Array.from({ length: 1000 }, (_, i) => [2, 0, 1][i % 3]).join(' '),
          },
          {
            n: 10000,
            input: '10000\n' + Array.from({ length: 10000 }, (_, i) => [1, 2, 0][i % 3]).join(' '),
          },
        ],
      },
      hints: {
        create: [
          { level: 1, content: 'Can you do this in one pass without counting sort array storage?' },
          { level: 2, content: 'Use three pointers: low, mid, high. Keep 0s at the left and 2s at the right.' },
          { level: 3, content: 'Dutch National Flag approach: if arr[mid]==0 swap(arr[low],arr[mid]) and low++,mid++; if arr[mid]==1 mid++; if arr[mid]==2 swap(arr[mid],arr[high]) and high--.' },
        ],
      },
      editorial: {
        create: {
          content: `## Sort an Array of 0s, 1s and 2s — Editorial

### Approach: Dutch National Flag (One Pass)

Maintain three regions:

- \`[0..low-1]\` contains all 0s
- \`[low..mid-1]\` contains all 1s
- \`[high+1..n-1]\` contains all 2s

Process index \`mid\` while \`mid <= high\`.

\`\`\`cpp
void sort012(vector<int>& arr) {
    int low = 0, mid = 0, high = (int)arr.size() - 1;
    while (mid <= high) {
        if (arr[mid] == 0) {
            swap(arr[low], arr[mid]);
            low++; mid++;
        } else if (arr[mid] == 1) {
            mid++;
        } else {
            swap(arr[mid], arr[high]);
            high--;
        }
    }
}
\`\`\`

**Time:** O(N) | **Space:** O(1)
`,
        },
      },
      companyTags: {
        create: [
          { companyName: 'Amazon' },
          { companyName: 'Microsoft' },
          { companyName: 'Adobe' },
        ],
      },
    },
  });

  // Sample Problem 4: Separate the digits in an array
  const separateDigits = await prisma.problem.upsert({
    where: { slug: 'separate-the-digits-in-an-array' },
    update: {},
    create: {
      slug: 'separate-the-digits-in-an-array',
      title: 'Separate the Digits in an Array',
      difficulty: 'EASY',
      topicId: topics['arrays'].id,
      optimalComplexity: 'O(N * d)',
      description: `Given an array of positive integers, return a new array containing all digits of the numbers in the same order they appear.

For example, given [13, 25, 83, 77], return [1,3,2,5,8,3,7,7].`,
      constraints: `1 <= n <= 10^5\n1 <= nums[i] <= 10^9`,
      inputFormat: `Line 1: n\nLine 2: n space-separated integers`,
      outputFormat: `All digits space-separated on a single line`,
      testCases: {
        create: [
          { input: '4\n13 25 83 77', expectedOutput: '1 3 2 5 8 3 7 7', isSample: true, points: 1 },
          { input: '3\n7 1 305', expectedOutput: '7 1 3 0 5', isSample: true, points: 1 },
          { input: '2\n10 20', expectedOutput: '1 0 2 0', isSample: false, points: 1 },
          { input: '1\n5', expectedOutput: '5', isSample: false, points: 1 },
        ],
      },
      scalingInputs: {
        create: [
          { n: 10, input: '10\n' + Array.from({ length: 10 }, (_, i) => i + 1).join(' ') },
          { n: 100, input: '100\n' + Array.from({ length: 100 }, (_, i) => i + 1).join(' ') },
        ],
      },
      hints: {
        create: [
          { level: 1, content: 'Iterate the numbers and convert each number to its digits.' },
          { level: 2, content: 'You can convert to string and split, or extract digits using modulo/division.' },
          { level: 3, content: 'For large numbers, converting to string is usually simplest and safe for these constraints.' },
        ],
      },
      editorial: {
        create: {
          content: `## Separate the Digits — Editorial

Split each number into digits and append to result. Converting to string and then mapping characters to integers is concise and efficient enough for the constraints.`,
        },
      },
      companyTags: {
        create: [ { companyName: 'Practice' } ],
      },
    },
  });

  // Admin user
  await prisma.user.upsert({
    where: { email: 'admin@dsajudge.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@dsajudge.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  console.log('✅ Seed complete!');
  console.log("   Problems: Two Sum, Longest Subarray with Sum K, Sort an Array of 0's, 1's and 2's");
  console.log('   Admin: admin@dsajudge.com / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
