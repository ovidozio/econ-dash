import { fetchSdmxJson } from "@/lib/fetchers/eurostat";
import type { SeriesPoint } from "@/lib/types";

const DATASET = "nama_10_a64";
const SECTION_CODES = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U"];
const POPULAR_AGGREGATES = ["B-E","G-I"];

export async function fetchEurostatIndustryOptions(opts: { level: "sections"|"detail" }) {
  const sdmx = await fetchSdmxJson(DATASET, { limit: 1 });
  const seriesDims = sdmx?.structure?.dimensions?.series || [];
  const naceDim = seriesDims.find((d: any) => d.id === "nace_r2");
  const labels: Record<string,string> = {};
  (naceDim?.values || []).forEach((v: any) => { labels[v.id] = v.name; });

  if (opts.level === "sections") {
    const base = SECTION_CODES.filter(c => c in labels).map(code => ({ code, label: labels[code] || code }));
    const aggs = POPULAR_AGGREGATES.filter(c => c in labels).map(code => ({ code, label: labels[code] || code }));
    return { provider: "Eurostat", options: [...base, ...aggs] };
  }

  const DETAIL = Object.keys(labels)
    .filter(k => k.startsWith("C") || ["G","H","I","J","K","L","M","N","O","P","Q","R","S"].includes(k))
    .map(code => ({ code, label: labels[code] || code }));
  return { provider: "Eurostat", options: DETAIL };
}

export async function fetchEurostatIndustrySeries(opts: {
  country: string;
  codes?: string[];
  n: number;
  price: "CP_MEUR" | "CLV15_MEUR" | "CLV10_MEUR";
  s_adj: "NSA" | "SA" | "WDA";
}): Promise<{ unitLabel: string; series: Array<{ key: string; code: string; points: SeriesPoint[] }>; meta: any; }> {
  const { country, codes, n, price, s_adj } = opts;
  const nace_r2 = codes?.length ? codes.join(",") : [...SECTION_CODES, ...POPULAR_AGGREGATES].join(",");
  const sdmx = await fetchSdmxJson(DATASET, { unit: price, s_adj, na_item: "B1GQ", nace_r2, geo: country });

  const structure = sdmx?.structure;
  const timeDim = (structure?.dimensions?.observation || []).find((d: any) => d.id === "time");
  const timeIndex = (timeDim?.values || []).map((v: any) => Number(v.name));
  const seriesDims = structure?.dimensions?.series || [];
  const naceIdx = seriesDims.findIndex((d: any) => d.id === "nace_r2");
  const labelMap: Record<string,string> = {};
  seriesDims[naceIdx]?.values?.forEach((v: any) => { labelMap[v.id] = v.name; });

  const unitLabel =
    (seriesDims.find((d: any) => d.id === "unit")?.values?.[0]?.name)
    || (price === "CP_MEUR" ? "Million EUR (current)" : "Million EUR (chain-linked)");

  const ds = sdmx?.dataSets?.[0]?.series || {};
  const out: Array<{ key: string; code: string; points: SeriesPoint[] }> = [];
  for (const k in ds) {
    const parts = k.split(":").map(Number);
    const code = seriesDims[naceIdx].values[parts[naceIdx]].id;
    const obs = ds[k].observations || {};
    const points: SeriesPoint[] = [];
    for (const t in obs) {
      const y = timeIndex[Number(t)];
      const v = obs[t][0];
      points.push({ year, value: v == null ? null : Number(v) });
    }
    points.sort((a, b) => a.year - b.year);
    out.push({ key: labelMap[code] || code, code, points });
  }

  const ranked = codes?.length
    ? out
    : out.sort((a, b) => (last(b.points) ?? -Infinity) - (last(a.points) ?? -Infinity)).slice(0, n);

  const latestYear = Math.max(...timeIndex);
  return { unitLabel, series: ranked, meta: { latestYear, price, s_adj } };
}

function last(points: SeriesPoint[]): number | null {
  for (let i = points.length - 1; i >= 0; i--) {
    const v = points[i].value;
    if (v != null && Number.isFinite(v)) return v as number;
  }
  return null;
}

