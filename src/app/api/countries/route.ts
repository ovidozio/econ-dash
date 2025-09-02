import { NextRequest, NextResponse } from "next/server";
import { fetchWorldBankCountries } from "@/lib/fetchers/worldbank";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const provider = (url.searchParams.get("provider") || "worldbank").toLowerCase();

    if (provider !== "worldbank") {
      return NextResponse.json({ ok: false, error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

    const countries = await fetchWorldBankCountries();
    return NextResponse.json({ ok: true, countries });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}

