import { NextRequest, NextResponse } from "next/server";
import { fetchWorldBankSeries } from "@/lib/fetchers/worldbank";
import { fetchBlsSeries } from "@/lib/fetchers/bls";
import { fetchFredSeries } from "@/lib/fetchers/fred";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const provider = (url.searchParams.get("provider") || "").toLowerCase();
    const dataset = url.searchParams.get("dataset") || "";
    const country = (url.searchParams.get("country") || "").toUpperCase();

    if (!dataset) {
      return NextResponse.json({ ok: false, error: "Missing dataset" }, { status: 400 });
    }

    if (provider === "worldbank") {
      if (!country) {
        return NextResponse.json({ ok: false, error: "Missing country for World Bank" }, { status: 400 });
      }
      const series = await fetchWorldBankSeries(dataset, country);
      return NextResponse.json({ ok: true, series });
    }

    if (provider === "bls") {
      const series = await fetchBlsSeries(dataset);
      return NextResponse.json({ ok: true, series });
    }

    if (provider === "fred") {
      const series = await fetchFredSeries(dataset);
      return NextResponse.json({ ok: true, series });
    }

    return NextResponse.json({ ok: false, error: `Unsupported provider: ${provider}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}

