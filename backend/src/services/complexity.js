/**
 * Classify time complexity from timing samples.
 *
 * Important: local execution includes process startup/compile overhead,
 * which can hide the algorithmic growth for small inputs. We therefore
 * remove a baseline overhead term before computing growth ratios.
 */
const classifyComplexity = (times) => {
  const points = Object.entries(times)
    .map(([n, t]) => ({ n: Number(n), t: Number(t) }))
    .filter((p) => Number.isFinite(p.n) && Number.isFinite(p.t) && p.n > 0 && p.t > 0)
    .sort((a, b) => a.n - b.n);

  if (points.length < 3) return 'O(?)';

  const baseline = Math.min(...points.map((p) => p.t));
  const adjusted = points.map((p) => ({
    n: p.n,
    t: Math.max(p.t - baseline, 0.0001),
  }));

  const hi = adjusted[adjusted.length - 1];
  const mid = adjusted[adjusted.length - 2];
  const lo = adjusted[Math.max(0, adjusted.length - 3)];

  const bigRatio = hi.t / mid.t;
  const smallRatio = mid.t / lo.t;

  const noiseFloor = hi.t < 0.25 && mid.t < 0.25;
  if (noiseFloor) return 'O(N)';

  if (bigRatio < 2 && smallRatio < 2) return 'O(1) or O(log N)';
  if (bigRatio < 12) return 'O(N)';
  if (bigRatio < 30) return 'O(N log N)';
  if (bigRatio < 200) return 'O(N²)';
  return 'O(N³) or worse';
};

module.exports = { classifyComplexity };
