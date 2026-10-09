// Shared axis helpers for the tax-paid charts (page and social image).

/**
 * A "nice" axis maximum and evenly spaced ticks (1, 2, 2.5 or 5 × 10^n)
 * covering `max`, aiming for about `target` intervals.
 */
export function niceTicks(max: number, target = 5) {
  if (!(max > 0)) return { max: 1, ticks: [0, 1] };
  const rough = max / target;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ??
    10 * magnitude;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + step / 2; v += step) ticks.push(v);
  return { max: niceMax, ticks };
}

/** Compact dollar label for axis ticks: $0, $25k, $1.5M. */
export function formatDollarTick(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `$${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (v >= 1000) {
    const k = v / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `$${Math.round(v)}`;
}
