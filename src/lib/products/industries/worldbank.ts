import type { SeriesPoint } from "@/lib/types";

export function getWorldBankSectorOptions() {
  return [
    { code: "AGR", label: "Agriculture" },
    { code: "IND", label: "Industry" },
    { code: "SRV", label: "Services" },
  ];
}

const WB_SHARE: Record<"AGR" | "IND" | "SRV", string> = {
  AGR: "NV.AGR.TOTL.ZS",
  IND: "NV.IND.TOTL.ZS",
  SRV: "NV.SRV.TOTL.ZS",
};

async function fetchWBIndicatorSeries(indicatorId: string, country: string): Promise<SeriesPoint[]> {
  // Fetch ONE indicator per request – WB reliably returns data this way.
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(country)}/indicator/${encodeURIComponent(indicatorId)}?format=json&per_page=20000`;
  const resp = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await resp.text();

  if (!resp.ok) {
    throw new Error(`World Bank fetch failed (${resp.status}): ${text.slice(0, 300)}`);
  }

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`World Bank did not return JSON. First 200 chars: ${text.slice(0, 200)}`);
  }

  const rows: any[] = Array.isArray(json) ? json[1] ?? [] : [];
  const out: SeriesPoint[] = [];

  for (const r of rows) {
    const y = Number(r?.date);
    if (!Number.isFinite(y)) continue;
    const raw = r?.value;
    const v = raw === null || raw === undefined ? null : Number(raw);
    out.push({ year: y, value: v });
  }

  // WB returns newest-first; sort ascending
  out.sort((a, b) => a.year - b.year);
  return out;
}

export async function fetchWorldBankSectorSeries(opts: {
  country: string;
  pick?: Array<"AGR" | "IND" | "SRV">;  // chosen sectors
}) {
  const pick = (opts.pick && opts.pick.length ? opts.pick : (["AGR", "IND", "SRV"] as const)).slice();

  // Fetch the three series in parallel
  const series = await Promise.all(
    pick.map(async (k) => {
      const id = WB_SHARE[k];
      const points = await fetchWBIndicatorSeries(id, opts.country);
      return {
        key: k === "AGR" ? "Agriculture" : k === "IND" ? "Industry" : "Services",
        code: k,
        points,
      };
    })
  );

  return { provider: "World Bank", unit: "% of GDP", series };
}

