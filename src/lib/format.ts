export type ScaleMode = "auto" | "raw" | "thousand" | "million" | "billion" | "trillion" | "sci";

const DIVS: Record<Exclude<ScaleMode,"auto"|"sci">, { div: number; suffix: string }> = {
	thousand: { div: 1e3,  suffix: "K"  },
	million:  { div: 1e6,  suffix: "M"  },
	billion:  { div: 1e9,  suffix: "B"  },
	trillion: { div: 1e12, suffix: "T"  },
	raw:      { div: 1,    suffix: ""   },
};

export function chooseScale(max: number) {
	if (!isFinite(max) || max <= 0) return { div: 1, suffix: "", mode: "raw" as ScaleMode };
	if (max >= 1e12) return { div: 1e12, suffix: "T", mode: "trillion" as ScaleMode };
	if (max >= 1e9)  return { div: 1e9,  suffix: "B", mode: "billion"  as ScaleMode };
	if (max >= 1e6)  return { div: 1e6,  suffix: "M", mode: "million"  as ScaleMode };
	if (max >= 1e3)  return { div: 1e3,  suffix: "K", mode: "thousand" as ScaleMode };
	return { div: 1, suffix: "", mode: "raw" as ScaleMode };
}

export function getScale(mode: ScaleMode, dataMax: number) {
	if (mode === "auto") return chooseScale(dataMax);
	if (mode === "sci")  return { div: 1, suffix: "", mode: "sci" as ScaleMode };
	return { ...(DIVS[mode]), mode };
}

export function fmtNumber(n: number, digits = 2) {
	return Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(n);
}

export function fmtScientific(n: number, digits = 3) {
	return !isFinite(n) ? "" : n.toExponential(digits);
}

