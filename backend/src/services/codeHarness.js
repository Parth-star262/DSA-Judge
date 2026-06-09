// Problem-specific harness builder.
// Prefers per-problem judgeConfig.drivers when available, then falls back to
// built-in wrappers for the problems already shipped in the app.

const parseJudgeConfig = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const resolveProblem = (problemOrSlug) => {
  if (!problemOrSlug) return { slug: '', judgeConfig: null };
  if (typeof problemOrSlug === 'string') return { slug: problemOrSlug, judgeConfig: null };
  return {
    slug: problemOrSlug.slug || '',
    judgeConfig: parseJudgeConfig(problemOrSlug.judgeConfig),
  };
};

const applyUserCodeTemplate = (template, userCode) => template.replace(/\{\{USER_CODE\}\}/g, userCode);

const isUnorderedPairCompare = (problemOrSlug) => {
  const { slug, judgeConfig } = resolveProblem(problemOrSlug);
  return Boolean(judgeConfig?.compare?.unorderedPair) || slug === 'two-sum';
};

const normalizeWhitespace = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const compareOutput = (problemOrSlug, actualOutput, expectedOutput) => {
  const actual = normalizeWhitespace(actualOutput);
  const expected = normalizeWhitespace(expectedOutput);

  if (isUnorderedPairCompare(problemOrSlug)) {
    const actualParts = actual.split(' ').map(Number);
    const expectedParts = expected.split(' ').map(Number);
    if (
      actualParts.length >= 2 &&
      expectedParts.length >= 2 &&
      actualParts.every((n) => Number.isFinite(n)) &&
      expectedParts.every((n) => Number.isFinite(n))
    ) {
      return (
        (actualParts[0] === expectedParts[0] && actualParts[1] === expectedParts[1]) ||
        (actualParts[0] === expectedParts[1] && actualParts[1] === expectedParts[0])
      );
    }
  }

  return actual === expected;
};

const buildTemplateHarness = (template, userCode) => {
  if (!template) return userCode;
  return applyUserCodeTemplate(template, userCode);
};

const getJudgeConfig = (problemOrSlug) => resolveProblem(problemOrSlug).judgeConfig;

const buildConfiguredHarness = (problemOrSlug, language, userCode) => {
  const judgeConfig = getJudgeConfig(problemOrSlug);
  if (!judgeConfig?.templates?.[language]) return null;
  return buildTemplateHarness(judgeConfig.templates[language], userCode);
};

const buildCppHarness = (problemSlug, userCode) => {
  if (problemSlug === 'two-sum') {
    return `${userCode}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string line;
    if (!getline(cin, line)) return 0;
    stringstream ss(line);
    vector<int> nums;
    int x;
    while (ss >> x) nums.push_back(x);

    int target;
    if (!(cin >> target)) return 0;

    Solution sol;
    vector<int> ans = sol.twoSum(nums, target);
    if (ans.size() >= 2) {
      cout << ans[0] << " " << ans[1];
    }
    return 0;
}`;
  }

  if (problemSlug === 'longest-subarray-sum-k') {
    return `${userCode}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string firstLine;
    if (!getline(cin, firstLine)) return 0;
    stringstream fs(firstLine);
    long long n = 0, k = 0;
    fs >> n >> k;

    string secondLine;
    if (!getline(cin, secondLine)) return 0;
    stringstream ss(secondLine);
    vector<int> nums;
    int val;
    while (ss >> val) nums.push_back(val);

    Solution sol;
    cout << sol.longestSubarray(nums, (int)k);
    return 0;
}`;
  }

  if (problemSlug === 'separate-the-digits-in-an-array') {
    return `${userCode}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string line;
    if (!getline(cin, line)) return 0;
    stringstream ss(line);
    vector<int> nums;
    int val;
    while (ss >> val) nums.push_back(val);

    Solution sol;
    vector<int> ans = sol.separateDigits(nums);
    for (int i = 0; i < ans.size(); i++) {
        cout << ans[i] << (i == ans.size() - 1 ? "" : " ");
    }
    return 0;
}`;
  }

  if (problemSlug === 'sort-array-0s-1s-2s') {
    return `${userCode}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; ++i) cin >> arr[i];

    Solution sol;
    sol.sort012(arr);

    for (int i = 0; i < n; ++i) {
      if (i) cout << " ";
      cout << arr[i];
    }
    cout << "\\n";
    return 0;
}`;
  }

  return userCode;
};

const buildPythonHarness = (problemSlug, userCode) => {
  if (problemSlug === 'two-sum') {
    return `${userCode}

def _driver():
    import sys
    lines = sys.stdin.read().strip().splitlines()
    if len(lines) < 2:
        return
    nums = list(map(int, lines[0].split())) if lines[0].strip() else []
    target = int(lines[1].strip())

    if 'Solution' in globals():
        ans = Solution().twoSum(nums, target)
    elif 'twoSum' in globals():
        ans = twoSum(nums, target)
    else:
        ans = two_sum(nums, target)

    if isinstance(ans, (list, tuple)) and len(ans) >= 2:
        print(f"{ans[0]} {ans[1]}")

if __name__ == '__main__':
    _driver()`;
  }

  if (problemSlug === 'longest-subarray-sum-k') {
    return `${userCode}

def _driver():
    import sys
    lines = sys.stdin.read().strip().splitlines()
    if len(lines) < 2:
        return
    n_k = list(map(int, lines[0].split()))
    if len(n_k) < 2:
        return
    _, k = n_k[0], n_k[1]
    nums = list(map(int, lines[1].split())) if lines[1].strip() else []

    if 'Solution' in globals():
        ans = Solution().longestSubarray(nums, k)
    elif 'longestSubarray' in globals():
        ans = longestSubarray(nums, k)
    else:
        ans = longest_subarray(nums, k)

    print(ans)

if __name__ == '__main__':
    _driver()`;
  }

  if (problemSlug === 'separate-the-digits-in-an-array') {
    return `${userCode}

def _driver():
    import sys
    line = sys.stdin.read().strip()
    if not line:
        return
    nums = list(map(int, line.split()))

    if 'Solution' in globals():
        ans = Solution().separateDigits(nums)
    elif 'separateDigits' in globals():
        ans = separateDigits(nums)
    else:
        ans = separate_digits(nums)

    print(" ".join(map(str, ans)))

if __name__ == '__main__':
    _driver()`;
  }

  if (problemSlug === 'sort-array-0s-1s-2s') {
    return `${userCode}

def _driver():
    import sys
    data = sys.stdin.read().strip().split()
    if not data:
        return
    n = int(data[0])
    nums = list(map(int, data[1:1+n])) if n > 0 else []

    if 'Solution' in globals():
        Solution().sort012(nums)
    elif 'sort012' in globals():
        sort012(nums)
    else:
        pass

    print(" ".join(map(str, nums)))

if __name__ == '__main__':
    _driver()`;
  }

  return userCode;
};

const buildJavaScriptHarness = (problemSlug, userCode) => {
  if (problemSlug === 'two-sum') {
    return `${userCode}

(function driver() {
  const fs = require('fs');
  const lines = fs.readFileSync(0, 'utf8').trim().split(/\r?\n/);
  if (lines.length < 2) return;
  const nums = lines[0].trim() ? lines[0].trim().split(/\s+/).map(Number) : [];
  const target = Number(lines[1].trim());
  const ans = twoSum(nums, target);
  if (Array.isArray(ans) && ans.length >= 2) {
    process.stdout.write(String(ans[0]) + ' ' + String(ans[1]));
  }
})();`;
  }

  if (problemSlug === 'longest-subarray-sum-k') {
    return `${userCode}

(function driver() {
  const fs = require('fs');
  const lines = fs.readFileSync(0, 'utf8').trim().split(/\r?\n/);
  if (lines.length < 2) return;
  const first = lines[0].trim().split(/\s+/).map(Number);
  if (first.length < 2) return;
  const k = first[1];
  const nums = lines[1].trim() ? lines[1].trim().split(/\s+/).map(Number) : [];
  process.stdout.write(String(longestSubarray(nums, k)));
})();`;
  }

  if (problemSlug === 'separate-the-digits-in-an-array') {
    return `${userCode}

(function driver() {
  const fs = require('fs');
  const input = fs.readFileSync(0, 'utf8').trim();
  if (!input) return;
  const nums = input.split(/\s+/).map(Number);
  const ans = separateDigits(nums);
  if (Array.isArray(ans)) {
    process.stdout.write(ans.join(' '));
  }
})();`;
  }

  if (problemSlug === 'sort-array-0s-1s-2s') {
    return `${userCode}

(function driver() {
  const fs = require('fs');
  const tokens = fs.readFileSync(0, 'utf8').trim().split(/\s+/);
  if (!tokens.length) return;
  const n = parseInt(tokens[0], 10) || 0;
  const nums = tokens.slice(1, 1 + n).map(Number);

  if (typeof Solution !== 'undefined' && typeof (new Solution()).sort012 === 'function') {
    new Solution().sort012(nums);
  } else if (typeof sort012 === 'function') {
    sort012(nums);
  }

  process.stdout.write(nums.join(' '));
})();`;
  }

  return userCode;
};

const buildJavaHarness = (problemSlug, userCode) => {
  if (problemSlug === 'two-sum') {
    return `${userCode}

class Main {
  public static void main(String[] args) throws Exception {
    java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
    String line1 = br.readLine();
    String line2 = br.readLine();
    if (line1 == null || line2 == null) return;

    String[] parts = line1.trim().isEmpty() ? new String[0] : line1.trim().split("\\s+");
    int[] nums = new int[parts.length];
    for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
    int target = Integer.parseInt(line2.trim());

    Solution sol = new Solution();
    int[] ans = sol.twoSum(nums, target);
    if (ans != null && ans.length >= 2) {
      System.out.print(ans[0] + " " + ans[1]);
    }
  }
}`;
  }

  if (problemSlug === 'longest-subarray-sum-k') {
    return `${userCode}

class Main {
  public static void main(String[] args) throws Exception {
    java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
    String line1 = br.readLine();
    String line2 = br.readLine();
    if (line1 == null || line2 == null) return;

    String[] first = line1.trim().split("\\s+");
    if (first.length < 2) return;
    int k = Integer.parseInt(first[1]);

    String[] parts = line2.trim().isEmpty() ? new String[0] : line2.trim().split("\\s+");
    int[] nums = new int[parts.length];
    for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);

    Solution sol = new Solution();
    System.out.print(sol.longestSubarray(nums, k));
  }
}`;
  }

  if (problemSlug === 'separate-the-digits-in-an-array') {
    return `${userCode}

class Main {
  public static void main(String[] args) throws Exception {
    java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
    String line = br.readLine();
    if (line == null || line.trim().isEmpty()) return;

    String[] parts = line.trim().split("\\s+");
    int[] nums = new int[parts.length];
    for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);

    Solution sol = new Solution();
    int[] ans = sol.separateDigits(nums);
    if (ans != null) {
      for (int i = 0; i < ans.length; i++) {
        System.out.print(ans[i] + (i == ans.length - 1 ? "" : " "));
      }
    }
  }
}`;
  }

  if (problemSlug === 'sort-array-0s-1s-2s') {
    return `${userCode}

class Main {
  public static void main(String[] args) throws Exception {
    java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
    String first = br.readLine();
    if (first == null || first.trim().isEmpty()) return;
    String[] firstParts = first.trim().split("\\s+");
    int n = Integer.parseInt(firstParts[0]);
    int[] nums = new int[n];
    if (n > 0) {
      String line = br.readLine();
      String[] parts = line == null ? new String[0] : line.trim().split("\\s+");
      for (int i = 0; i < Math.min(n, parts.length); i++) nums[i] = Integer.parseInt(parts[i]);
    }

    Solution sol = new Solution();
    sol.sort012(nums);

    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < n; i++) {
      if (i > 0) sb.append(' ');
      sb.append(nums[i]);
    }
    System.out.print(sb.toString());
  }
}`;
  }

  return userCode;
};

const buildExecutableCode = (problemOrSlug, language, userCode) => {
  if (!problemOrSlug || !language || !userCode) return userCode;

  const configured = buildConfiguredHarness(problemOrSlug, language, userCode);
  if (configured) return configured;

  const { slug } = resolveProblem(problemOrSlug);

  if (language === 'cpp') return buildCppHarness(slug, userCode);
  if (language === 'python') return buildPythonHarness(slug, userCode);
  if (language === 'javascript') return buildJavaScriptHarness(slug, userCode);
  if (language === 'java') return buildJavaHarness(slug, userCode);

  return userCode;
};

module.exports = { buildExecutableCode, compareOutput };
