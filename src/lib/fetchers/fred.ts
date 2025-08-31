import type { Series } from "@/lib/types";

const FRED_BASE = "https://api.stlouisfed.org/fred";
const KEY = process.env.FRED_API_KEY ?? "";

async function fred(endpoint: string, params: Record<string, string>) {
  const usp = new URLSearchParams({ file_type: "json", ...params });
  if (KEY) usp.set("api_key", KEY);
  const url = `${FRED_BASE}${endpoint}?${usp.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`FRED error ${res.status}`);
  const j = await res.json();
  if (j?.error_message) throw new Error(`FRED: ${j.error_message}`);
  return j;
}

export async function fetchFredSeries(params: { seriesId: string }): Promise<Series> {
  const { seriesId } = params;

  // metadata
  const meta = await fred("/series", { series_id: seriesId });
  const info = meta?.seriess?.[0];
  const title = info?.title ?? seriesId;
  const unit = info?.units ?? undefined;
  const freqShort = (info?.frequency_short as "A" | "Q" | "M" | "D") ?? undefined;

  // observations
  const obs = await fred("/series/observations", {
    series_id: seriesId,
    observation_start: "1950-01-01",
  });

  const points = (obs?.observations ?? [])
    .map((o: any) => ({
      time: String(o.date).slice(0, 7), // "YYYY-MM" works well with your axis formatter
      value: o.value === "." ? null : Number(o.value),
    }))
    .filter((p: any) => p.time && Number.isFinite(p.value))
    .sort((a: any, b: any) => a.time.localeCompare(b.time));

  return {
    id: `fred:${seriesId}`,
    title,
    unit,
    frequency: freqShort,
    points,
    source: {
      name: "FRED, St. Louis Fed",
      url: `${FRED_BASE}/series/observations?series_id=${encodeURIComponent(seriesId)}`,
      license: "FRED Terms of Use",
    },
    meta: { seriesId },
  };
}

