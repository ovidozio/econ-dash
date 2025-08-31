import { NextRequest, NextResponse } from "next/server";
import { fetchWorldBankSeries } from "@/lib/fetchers/worldbank";
import { fetchBlsSeries } from "@/lib/fetchers/bls";
import { fetchFredSeries } from "@/lib/fetchers/fred";
import type { Series, SeriesPoint } from "@/lib/types";

function applyTransform(series: Series, transform?: string): Series {
  if (!transform) return series;
  const pts = [...series.points].sort((a, b) => a.time.localeCompare(b.time));
  let out: SeriesPoint[] = pts;
  if (transform === "diff1") {
    out = pts.map((p, i) =>
      i === 0 || pts[i - 1].value == null || p.value == null
        ? { time: p.time, value: null }
        : { time: p.time, value: (p.value as number) - (pts[i - 1].value as number) }
    );
  }
  return { ...series, points: out };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const provider = (url.searchParams.get("provider") ?? "worldbank").toLowerCase();
    const dataset  = url.searchParams.get("dataset") ?? "";
    const country  = url.searchParams.get("country") ?? "USA";
    const transform = url.searchParams.get("transform") ?? undefined;

    if (!dataset) return NextResponse.json({ error: "Missing dataset" }, { status: 400 });

    let series: Series;

    if (provider === "worldbank") {
      series = await fetchWorldBankSeries({ indicator: dataset, country });
    } else if (provider === "bls") {
      try {
        series = await fetchBlsSeries({ seriesId: dataset });
        if (!series.points || series.points.length === 0) {
          // Empty monthly data → try FRED mirror
          series = await fetchFredSeries({ seriesId: dataset });
        }
      } catch {
        // Network/parse error → fall back to FRED
        series = await fetchFredSeries({ seriesId: dataset });
      }
    } else if (provider === "fred") {
      series = await fetchFredSeries({ seriesId: dataset });
    } else {
      return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

    return NextResponse.json({ series: applyTransform(series, transform) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

