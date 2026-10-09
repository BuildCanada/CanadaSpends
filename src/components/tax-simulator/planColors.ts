// Series colours for plans, in fixed order (plan A, B, C, D). Plan A is the
// reference: a neutral gray drawn dashed. The others are brand ramp steps
// validated for colour-blind and normal-vision separation as a set
// (auburn-800, cerulean-700, sienna-600).
export const PLAN_COLORS = ["#9a9a9a", "#932f2f", "#1f5f7f", "#e56211"];

export function planColor(index: number): string {
  return PLAN_COLORS[index % PLAN_COLORS.length];
}
