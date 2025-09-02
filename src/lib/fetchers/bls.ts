import type { Series, SeriesPoint } from "@/lib/types";
import { fetchFredSeries } from "./fred";

const BLS_BASE = "https://api.bls.gov/publicAPI/v2/timeseries/data";

function coerceNumber(v: unknown): number | null {
  const s = String(v ?? "").trim();
  if (!s || s === "." || s.toUpperCase() === "NA" || s.toUpperCase() === "N/A") return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function toPoint(yearStr: string, mm: string, value: number | null): SeriesPoint {
  const date = `${yearStr}-${mm}-01`;    // place at first of month
  const t = Date.parse(date);
  const year = Number(yearStr);
  return { year, value, t, v: value, date };
}

async function blsGET(seriesId: string, startYear: string, endYear: string, key?: string) {
  const qs = new URLSearchParams({
    startyear: startYear,
    endyear: endYear,
    ...(key ? { registrationkey: key } : {}),
  });
  const url = `${BLS_BASE}/${encodeURIComponent(seriesId)}?${qs.toString()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`BLS GET ${res.status}`);
  return res.json();
}

async function blsPOST(seriesId: string, startYear: string, endYear: string, key?: string) {
  const url = `${BLS_BASE}/`;
  const body: Record<string, any> = {
    seriesid: [seriesId],
    startyear: startYear,
    endyear: endYear,
    ...(key ? { registrationkey: key } : {}),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BLS POST ${res.status}`);
  return res.json();
}

function parseBls(json: any, seriesId: string): Series {
  if (json?.status !== "REQUEST_SUCCEEDED") {
    const msg = json?.message?.[0] ?? "Unknown BLS error";
    throw new Error(`BLS: ${msg}`);
  }
  const s = json?.Results?.series?.[0];
  const rows: any[] = s?.data ?? [];

  // Monthly M01..M12
  const monthly = rows
    .filter((d) => /^M(0[1-9]|1[0-2])$/.test(d.period))
    .map((d) => toPoint(String(d.year), d.period.substring(1), coerceNumber(d.value)))
    .filter((p) => p.value !== null)
    .sort((a, b) => (a.t! - b.t!));

  // If monthly is empty, annual average M13 at December
  const annual = rows
    .filter((d) => d.period === "M13")
    .map((d) => toPoint(String(d.year), "12", coerceNumber(d.value)))
    .filter((p) => p.value !== null)
    .sort((a, b) => (a.t! - b.t!));

  const points = monthly.length ? monthly : annual;

  return {
    unit: undefined,
    series: [{ key: seriesId, points }],
    source: {
      name: "Bureau of Labor Statistics",
      url: `${BLS_BASE}/${encodeURIComponent(seriesId)}`,
    },
    frequency: monthly.length ? "M" : "A",
  };
}

/**
 * Robust BLS fetcher:
 * 1) Try BLS (GET → POST).
 * 2) If parsed points are empty, fall back to FRED mirror (no API key needed).
 */
export async function fetchBlsSeries(
  seriesId: string,
  startYear = "1960",
  endYear = String(new Date().getFullYear())
): Promise<Series> {
  const key = process.env.BLS_API_KEY;

  // 1) BLS GET → POST
  try {
    try {
      const json = await blsGET(seriesId, startYear, endYear, key);
      const s = parseBls(json, seriesId);
      if (s.series?.[0]?.points?.length) return s;
    } catch {
      const json = await blsPOST(seriesId, startYear, endYear, key);
      const s = parseBls(json, seriesId);
      if (s.series?.[0]?.points?.length) return s;
    }
  } catch {
    // swallow: we’ll try FRED next
  }

  // 2) Fallback to FRED mirror (same id)
  const fred = await fetchFredSeries(seriesId);
  if (fred.series?.[0]?.points?.length) {
    // Keep BLS branding but keep FRED url in meta for traceability
    return {
      ...fred,
      source: { name: "Bureau of Labor Statistics (via FRED mirror)", url: fred.source?.url },
    };
  }

  // If still nothing, return an empty series with a helpful hint
  return {
    unit: undefined,
    series: [{ key: seriesId, points: [] }],
    source: { name: "Bureau of Labor Statistics" },
    frequency: "",
  };
}

