import { NextRequest, NextResponse } from "next/server";
import { fetchWorldBankCountries } from "@/lib/fetchers/worldbank";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") ?? "worldbank";

    if (provider !== "worldbank") {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    const countries = await fetchWorldBankCountries();
    return NextResponse.json({ countries }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

