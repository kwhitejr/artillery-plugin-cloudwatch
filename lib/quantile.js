// sort array ascending
const asc = arr => arr.sort((a, b) => a - b);

const sum = arr => arr.reduce((a, b) => a + b, 0);

const mean = arr => sum(arr) / arr.length;

const quantile = (sorted, q) => {
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
};

const getQuantileMetrics = (arr) => {
  const sorted = asc(arr);
  const p50 = quantile(sorted, .5);
  const p95 = quantile(sorted, .95);
  const p99 = quantile(sorted, .99);
  const avg = mean(sorted)
  const min = sorted[0];
  const max = sorted[sorted.length -1];

  return {
    p50,
    p95,
    p99,
    avg,
    min,
    max
  }
}

module.exports = getQuantileMetrics;