import type { Series } from "@/lib/types";

const BLS_BASE = "https://api.bls.gov/publicAPI/v2/timeseries/data";

function coerceNumber(v: unknown): number | null {
  const s = String(v ?? "").trim();
  if (!s || s === "." || s.toUpperCase() === "NA" || s.toUpperCase() === "N/A") return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function fetchBlsSeries(params: {
  seriesId: string;
  startYear?: string;
  endYear?: string;
}): Promise<Series> {
  const { seriesId, startYear = "1960", endYear = new Date().getFullYear().toString() } = params;
  const key = process.env.BLS_API_KEY;

  const parse = (json: any): Series => {
    if (json?.status !== "REQUEST_SUCCEEDED") {
      const msg = json?.message?.[0] ?? "Unknown BLS error";
      throw new Error(`BLS: ${msg}`);
    }
    const s = json?.Results?.series?.[0];
    if (!s) throw new Error("BLS: no series returned");

    const rows = (s.data as any[]) ?? [];

    // Monthly rows M01..M12
    const monthly = rows
      .filter((d: any) => /^M(0[1-9]|1[0-2])$/.test(d.period))
      .map((d: any) => ({
        time: `${d.year}-${d.period.substring(1)}`, // YYYY-MM
        value: coerceNumber(d.value),
      }))
      .filter((p: any) => p.value !== null)
      .sort((a: any, b: any) => a.time.localeCompare(b.time));

    // If monthly is empty, include annual average M13 mapped to December
    const points = monthly.length > 0
      ? monthly
      : rows
          .filter((d: any) => d.period === "M13")
          .map((d: any) => ({
            time: `${d.year}-12`, // place the annual avg at year-end
            value: coerceNumber(d.value),
          }))
          .filter((p: any) => p.value !== null)
          .sort((a: any, b: any) => a.time.localeCompare(b.time));

    return {
      id: `bls:${seriesId}`,
      title: seriesId,
      unit: undefined,
      frequency: "M",
      points,
      source: {
        name: "Bureau of Labor Statistics",
        url: `${BLS_BASE}/${encodeURIComponent(seriesId)}`,
        license: "BLS API Terms",
      },
      meta: { seriesId },
    };
  };

  // GET first (more permissive)
  const qs = new URLSearchParams({
    startyear: startYear,
    endyear: endYear,
    ...(key ? { registrationkey: key } : {}),
  });
  const getUrl = `${BLS_BASE}/${encodeURIComponent(seriesId)}?${qs.toString()}`;
  try {
    const res = await fetch(getUrl, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`BLS GET ${res.status}`);
    const json = await res.json();
    return parse(json);
  } catch {
    // POST fallback
    const postUrl = `${BLS_BASE}/`;
    const body: Record<string, any> = {
      seriesid: [seriesId],
      startyear: startYear,
      endyear: endYear,
      ...(key ? { registrationkey: key } : {}),
    };
    const res = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`BLS POST ${res.status}`);
    const json = await res.json();
    return parse(json);
  }
}

