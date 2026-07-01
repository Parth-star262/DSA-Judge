const { classifyComplexity } = require('../src/services/complexity');

describe('classifyComplexity', () => {
  it('returns linear growth for moderate scaling ratios', () => {
    expect(classifyComplexity({ 10: 0.4, 100: 8, 1000: 165 })).toBe('O(N log N)');
  });

  it('returns O(?) when there are not enough points', () => {
    expect(classifyComplexity({ 10: 1, 20: 2 })).toBe('O(?)');
  });
});