const OPTIMAL_SPACE_BY_PROBLEM = {
  'two-sum': 'O(N)',
  'longest-subarray-sum-k': 'O(N)',
};

const normalizeCode = (code) =>
  String(code || '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/#.*$/gm, ' ')
    .toLowerCase();

const hasNestedLoops = (src) =>
  /for\s*\([^)]*\)\s*\{[\s\S]{0,500}?for\s*\(/.test(src) ||
  /while\s*\([^)]*\)\s*\{[\s\S]{0,500}?while\s*\(/.test(src) ||
  /for\s*\([^)]*\)\s*\{[\s\S]{0,500}?while\s*\(/.test(src) ||
  /while\s*\([^)]*\)\s*\{[\s\S]{0,500}?for\s*\(/.test(src);

const estimateSpaceComplexity = (problemSlug, language, userCode) => {
  const src = normalizeCode(userCode);

  const usesHashStructures =
    /unordered_map|unordered_set|hashmap|hashset/.test(src) ||
    /\bnew\s+map\b|\bnew\s+set\b/.test(src) ||
    /\bdict\s*\(|\bdefaultdict\s*\(|\bcounter\s*\(/.test(src);

  const usesLinearAuxBuffer =
    /\bvector<[^>]+>\s+\w+\s*\(/.test(src) ||
    /\bnew\s+\w+\s*\[\s*\w+\s*\]/.test(src) ||
    /\barray\s*\(/.test(src) ||
    /\blist\s*\(/.test(src);

  if (usesHashStructures || usesLinearAuxBuffer) return 'O(N)';

  if (hasNestedLoops(src)) return 'O(1)';

  if (problemSlug && OPTIMAL_SPACE_BY_PROBLEM[problemSlug]) {
    // Fall back to problem expectation if heuristic is uncertain.
    return OPTIMAL_SPACE_BY_PROBLEM[problemSlug];
  }

  return 'O(1)';
};

const getOptimalSpaceComplexity = (problemSlug) => OPTIMAL_SPACE_BY_PROBLEM[problemSlug] || null;

module.exports = { estimateSpaceComplexity, getOptimalSpaceComplexity };
