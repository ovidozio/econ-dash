import { getWorldBankSectorOptions, fetchWorldBankSectorSeries } from "./worldbank";

export async function getIndustryOptions(params: {
  provider?: string;
  country: string;
  level: "sections" | "detail";
}) {
  const provider = (params.provider || "wb").toLowerCase();

  if (provider === "wb") {
    return {
      ok: true,
      provider: "World Bank",
      options: getWorldBankSectorOptions(), // AGR / IND / SRV
      level: params.level,
    };
  }

  // Placeholder for Eurostat wiring later
  return {
    ok: false,
    provider: "Eurostat",
    error: "Eurostat options not configured yet.",
  };
}

export async function getIndustrySeries(params: {
  provider?: string;
  country: string;
  price?: "CP_MEUR" | "CLV15_MEUR";
  codes?: string[]; // e.g. ["AGR","IND"]
  n?: number;       // top-N (WB only makes sense up to 3)
}) {
  const provider = (params.provider || "wb").toLowerCase();

  if (provider === "wb") {
    const pick = (params.codes && params.codes.length
      ? (params.codes.filter(c => ["AGR","IND","SRV"].includes(c)) as Array<"AGR"|"IND"|"SRV">)
      : (["AGR","IND","SRV"] as const)
    );
    const out = await fetchWorldBankSectorSeries({ country: params.country, pick });
    return { ok: true, ...out };
  }

  // Placeholder for Eurostat wiring later
  return {
    ok: false,
    provider: "Eurostat",
    error: "Eurostat series not configured yet.",
  };
}

