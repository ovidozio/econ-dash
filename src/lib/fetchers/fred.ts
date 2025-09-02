import type { Series, SeriesPoint } from "@/lib/types";

/**
 * Robust FRED fetcher:
 * - If FRED_API_KEY is set → use official JSON API
 * - Otherwise → fall back to fredgraph.csv (no key required)
 *
 * Always returns Series with points carrying {date, t, v} so charts render.
 */
export async function fetchFredSeries(seriesId: string): Promise<Series> {
  const apiKey = process.env.FRED_API_KEY || process.env.NEXT_PUBLIC_FRED_API_KEY;

  if (apiKey) {
    // Official API
    const url =
      `https://api.stlouisfed.org/fred/series/observations` +
      `?series_id=${encodeURIComponent(seriesId)}` +
      `&file_type=json&observation_start=1900-01-01&api_key=${encodeURIComponent(apiKey)}`;

    const resp = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    const txt = await resp.text();
    if (!resp.ok) {
      throw new Error(`FRED API ${resp.status}: ${txt.slice(0, 300)}`);
    }
    let json: any;
    try {
      json = JSON.parse(txt);
    } catch {
      throw new Error(`FRED API returned non-JSON: ${txt.slice(0, 200)}`);
    }

    const rows: any[] = json?.observations ?? [];
    const points: SeriesPoint[] = rows.map((r) => {
      const date = String(r?.date || "");
      const valRaw = r?.value;
      const value = (valRaw === "." || valRaw == null) ? null : Number(valRaw);
      const t = Date.parse(date);
      const year = new Date(t).getFullYear();
      return { year, value, t, v: value, date };
    });

    return {
      unit: undefined,
      series: [{ key: seriesId, points }],
      source: { name: "FRED", url },
      frequency: "M",
    };
  }

  // Fallback: fredgraph CSV export (no key required)
  return fetchFredGraphCsv(seriesId);
}

async function fetchFredGraphCsv(seriesId: string): Promise<Series> {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`;
  const resp = await fetch(url, { cache: "no-store" });
  const csv = await resp.text();
  if (!resp.ok) {
    throw new Error(`fredgraph.csv ${resp.status}: ${csv.slice(0, 300)}`);
  }

  const lines = csv.trim().split(/\r?\n/);
  // header is "DATE,<SERIESID>"
  const header = (lines.shift() || "").split(",");
  const dateCol = header.findIndex((h) => h.toUpperCase() === "DATE");
  const valCol = header.findIndex((h) => h.toUpperCase() === seriesId.toUpperCase());

  if (dateCol < 0 || valCol < 0) {
    throw new Error(`fredgraph.csv: unexpected header: ${header.join(",")}`);
  }

  const points: SeriesPoint[] = [];
  for (const line of lines) {
    if (!line) continue;
    const cols = splitCsvRow(line);
    const date = cols[dateCol];
    const valStr = cols[valCol];
    const value = (valStr === "." || valStr === "" || valStr == null) ? null : Number(valStr);
    const t = Date.parse(date);
    const year = new Date(t).getFullYear();
    points.push({ year, value, t, v: value, date });
  }

  return {
    unit: undefined,
    series: [{ key: seriesId, points }],
    source: { name: "FRED", url },
    frequency: inferFrequency(points),
  };
}

// --- helpers ----------------------------------------------------------------

function splitCsvRow(line: string): string[] {
  // Minimal CSV splitter (fredgraph is simple: no embedded newlines)
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'; i++;
      } else if (ch === '"') {
        inQ = false;
      } else cur += ch;
    } else {
      if (ch === ',') { out.push(cur); cur = ""; }
      else if (ch === '"') { inQ = true; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function inferFrequency(points: SeriesPoint[] | null | undefined): "M" | "A" | string {
  if (!points?.length) return "";
  // If most dates include a month (YYYY-MM), assume monthly.
  let monthly = 0, total = 0;
  for (const p of points) {
    const d = p?.date ?? "";
    if (/\d{4}-\d{2}/.test(d)) monthly++;
    total++;
  }
  return monthly / Math.max(total, 1) > 0.6 ? "M" : "A";
}

