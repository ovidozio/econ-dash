import { NextRequest, NextResponse } from "next/server";
import { fetchWorldBankSeries } from "@/lib/fetchers/worldbank";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") ?? "worldbank";
    const dataset  = url.searchParams.get("dataset")  ?? "NY.GDP.MKTP.KD";
    const country  = url.searchParams.get("country")  ?? "USA";

    if (provider !== "worldbank") {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    const series = await fetchWorldBankSeries({ indicator: dataset, country });
    return NextResponse.json({ series }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

