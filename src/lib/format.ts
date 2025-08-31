export type ScaleMode =
  | "auto"
  | "raw"
  | "thousand"
  | "million"
  | "billion"
  | "trillion"
  | "sci";

export type ScaleInfo = {
  mode: "raw" | "k" | "m" | "b" | "t" | "sci";
  div: number;
  suffix: "" | " K" | " M" | " B" | " T";
};

/**
 * Chooses display scaling. Key behavior:
 * - "sci": scientific (no divisor; formatter shows ×10^n)
 * - "auto": NEVER applies K/M/B for small magnitudes (maxAbs < 1e3) so tiny values don't get crushed to 0.
 * - raw/K/M/B/T: fixed divisors.
 */
export function getScale(mode: ScaleMode, maxAbs: number): ScaleInfo {
  if (!Number.isFinite(maxAbs)) maxAbs = 0;

  if (mode === "sci") return { mode: "sci", div: 1, suffix: "" };
  if (mode === "raw") return { mode: "raw", div: 1, suffix: "" };
  if (mode === "thousand") return { mode: "k", div: 1e3, suffix: " K" };
  if (mode === "million") return { mode: "m", div: 1e6, suffix: " M" };
  if (mode === "billion") return { mode: "b", div: 1e9, suffix: " B" };
  if (mode === "trillion") return { mode: "t", div: 1e12, suffix: " T" };

  // mode === "auto"
  const a = Math.abs(maxAbs);
  // IMPORTANT: don't scale small data — prevents labels like 0 when values are < 1
  if (a < 1e3) return { mode: "raw", div: 1, suffix: "" };
  if (a < 1e6) return { mode: "k", div: 1e3, suffix: " K" };
  if (a < 1e9) return { mode: "m", div: 1e6, suffix: " M" };
  if (a < 1e12) return { mode: "b", div: 1e9, suffix: " B" };
  return { mode: "t", div: 1e12, suffix: " T" };
}

/**
 * Decimal formatter that shows sensible precision for small numbers.
 * - Exact 0 → "0"
 * - 0 < |v| < 1 → at least 2 decimals (or `digits`, whichever is larger)
 * - otherwise → `digits` decimals
 */
export function fmtNumber(v: number, digits: number): string {
  if (!Number.isFinite(v) || v === 0) return "0";
  const abs = Math.abs(v);
  const minFrac = abs < 1 ? Math.min(2, digits) : 0;
  const maxFrac = abs < 1 ? Math.max(2, digits) : digits;
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  }).format(v);
}

/**
 * Scientific formatter.
 * - Exact 0 → "0"
 * - Others → "a.b ×10^n"
 */
export function fmtScientific(v: number, digits: number): string {
  if (!Number.isFinite(v) || v === 0) return "0";
  return v.toExponential(digits).replace(/e\+?(-?\d+)/i, " ×10^$1");
}

