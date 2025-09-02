import type { NextApiRequest, NextApiResponse } from "next";
import { getIndustryOptions } from "@/lib/products/industries/service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = new URL(req.url || "", "http://localhost");
    const provider = url.searchParams.get("provider") || undefined;
    const country = url.searchParams.get("country") || "USA";
    const level = (url.searchParams.get("level") as "sections" | "detail") || "sections";

    const payload = await getIndustryOptions({ provider, country, level });
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(payload));
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Unknown error" });
  }
}

