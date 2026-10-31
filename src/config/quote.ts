// Instant-quote rates. Estimates only — the final quote comes from a person.
// ⚠️ These per-gram rates are starting values; tune them to your real costs.
export const quoteMaterials = [
  { id: "PLA", name: "PLA", note: "Everyday, matte finish", density: 1.24, perGram: 5 },
  { id: "PETG", name: "PETG", note: "Tough, outdoor-safe", density: 1.27, perGram: 6 },
  { id: "ABS", name: "ABS", note: "Heat resistant", density: 1.04, perGram: 7 },
  { id: "RESIN", name: "Resin", note: "Fine detail, smooth", density: 1.15, perGram: 14, solid: true },
] as const;

export const quoteRules = {
  /** Share of the solid volume an FDM print actually uses (walls + ~20% infill). */
  fdmFill: 0.38,
  /** Resin parts are printed hollowed with drain holes. */
  resinFill: 0.6,
  setupFee: 99,
  minimum: 199,
  gramsPerHour: 12,
  /** Largest part our printers take in one piece (mm). ⚠️ Set this to your printer's bed size. */
  buildVolume: { x: 256, y: 256, z: 256 },
};

export type QuoteMaterial = (typeof quoteMaterials)[number];

export function estimate(volumeCm3: number, m: QuoteMaterial) {
  const fill = "solid" in m && m.solid ? quoteRules.resinFill : quoteRules.fdmFill;
  const grams = Math.max(1, Math.round(volumeCm3 * m.density * fill));
  const price = Math.max(quoteRules.minimum, Math.round((quoteRules.setupFee + grams * m.perGram) / 10) * 10);
  const hours = Math.max(1, Math.round(grams / quoteRules.gramsPerHour));
  return { grams, price, hours };
}
