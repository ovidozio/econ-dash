import type { NextApiRequest, NextApiResponse } from "next";
import { getIndustrySeries } from "@/lib/products/industries";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const country = (req.query.country as string) || "USA";
    const codes = (req.query.codes as string | undefined)?.split(";").filter(Boolean);
    const n = req.query.n ? Number(req.query.n) : undefined;
    const price = (req.query.price as any) || "CP_MEUR";
    const s_adj = (req.query.s_adj as any) || "NSA";
    const provider = (req.query.provider as "eurostat"|"wb" | undefined);

    const payload = await getIndustrySeries({ country, codes, n, price, s_adj, forcedProvider: provider });
    res.status(200).json({ ok: true, country, ...payload });
  } catch (e: any) {
    res.status(200).json({ ok: false, error: String(e?.message || e) });
  }
}

