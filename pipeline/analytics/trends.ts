/**
 * Trend primitives: compound annual growth rate and ordinary least-squares
 * linear regression (with coefficient of determination R²).
 */

/** Compound annual growth rate between `first` and `last` over `years` periods. */
export function cagr(first: number, last: number, years: number): number {
  if (first <= 0 || years <= 0) return 0;
  return (last / first) ** (1 / years) - 1;
}

export interface LinearFit {
  slope: number;
  intercept: number;
  r2: number;
}

/** Ordinary least-squares fit of y = slope·x + intercept. */
export function linearRegression(points: Array<{ x: number; y: number }>): LinearFit {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, r2: 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const slope = denX === 0 ? 0 : num / denX;
  const intercept = meanY - slope * meanX;
  const r2 = denX === 0 || denY === 0 ? 0 : (num * num) / (denX * denY);
  return { slope, intercept, r2 };
}
