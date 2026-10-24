// Approximate OpenAI price per generated image in USD (output image only; the prompt
// text adds a fraction of a cent). Update if OpenAI changes its pricing.
type Rates = { low: number; medium: number; high: number };

const PRICES: Record<string, { square: Rates; rect: Rates }> = {
  "gpt-image-1-mini": { square: { low: 0.005, medium: 0.011, high: 0.036 }, rect: { low: 0.006, medium: 0.015, high: 0.052 } },
  "gpt-image-1.5": { square: { low: 0.009, medium: 0.034, high: 0.133 }, rect: { low: 0.013, medium: 0.05, high: 0.2 } },
  "gpt-image-1": { square: { low: 0.011, medium: 0.042, high: 0.167 }, rect: { low: 0.016, medium: 0.063, high: 0.25 } },
};

export const QUALITIES = ["high", "medium", "low"] as const;
export type Quality = (typeof QUALITIES)[number];

export const DEFAULT_IMAGE_MODEL = "gpt-image-1-mini";
export const DEFAULT_MAX_COST = 0.04;

export function estimateCost(model: string, orientation: string, quality: Quality): number | null {
  const p = PRICES[model];
  if (!p) return null;
  return (orientation === "square" ? p.square : p.rect)[quality];
}

// Best quality whose estimated price fits the budget. Unknown models get "low" to stay safe.
export function bestQualityWithin(model: string, orientation: string, maxCost: number): Quality {
  if (!PRICES[model]) return "low";
  return QUALITIES.find((q) => (estimateCost(model, orientation, q) ?? Infinity) <= maxCost) ?? "low";
}

export function allowed(model: string, orientation: string, quality: Quality, maxCost: number) {
  const cost = estimateCost(model, orientation, quality);
  return cost === null ? quality === "low" : cost <= maxCost;
}
