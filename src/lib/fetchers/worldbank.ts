import type { CountryOption, Series, SeriesPoint } from "@/lib/types";

/** Fetch World Bank country list (excludes aggregates). */
export async function fetchWorldBankCountries(): Promise<CountryOption[]> {
  const url = "https://api.worldbank.org/v2/country?format=json&per_page=400";
  const resp = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`World Bank countries failed (${resp.status}): ${text.slice(0, 300)}`);

  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error(`World Bank countries not JSON. First 200: ${text.slice(0,200)}`); }

  const rows: any[] = Array.isArray(json) ? json[1] ?? [] : [];
  return rows
    .filter((r) => r?.region?.id && r.region.id !== "NA")
    .map((r) => ({ code: String(r?.id || "").toUpperCase(), label: String(r?.name || "").trim() }))
    .filter((c) => c.code && c.label)
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** ONE indicator for ONE country -> Series (includes t/v/date for SeriesChart). */
export async function fetchWorldBankSeries(dataset: string, country: string): Promise<Series> {
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(country)}/indicator/${encodeURIComponent(dataset)}?format=json&per_page=20000`;
  const resp = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`World Bank series failed (${resp.status}): ${text.slice(0, 300)}`);

  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error(`World Bank series not JSON. First 200: ${text.slice(0,200)}`); }

  const rows: any[] = Array.isArray(json) ? json[1] ?? [] : [];
  const points: SeriesPoint[] = [];

  for (const r of rows) {
    const year = Number(r?.date);
    if (!Number.isFinite(year)) continue;
    const raw = r?.value;
    const value = raw === null || raw === undefined ? null : Number(raw);
    const iso = new Date(year, 0, 1).toISOString();
    points.push({ year, value, t: year, v: value, date: iso });
  }

  points.sort((a, b) => a.year - b.year); // WB returns newest-first

  return {
    unit: undefined,                       // product config usually sets unitLabel
    series: [{ key: dataset, points }],
    source: { name: "World Bank", url },
    frequency: "A",
  };
}

/** Multi-indicator convenience (parallel) -> { indicatorId: points[] } */
export async function fetchWorldBankIndicators(
  indicators: string[],
  country: string
): Promise<Record<string, SeriesPoint[]>> {
  const out: Record<string, SeriesPoint[]> = {};
  await Promise.all(
    (indicators || []).map(async (id) => {
      const s = await fetchWorldBankSeries(id, country);
      out[id] = s.series[0]?.points ?? [];
    })
  );
  return out;
}

