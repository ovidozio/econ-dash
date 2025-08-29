import type { CountryOption, Series } from "@/lib/types";

// GDP (constant 2015 US$) example indicator: NY.GDP.MKTP.KD
export async function fetchWorldBankSeries(params: {
  indicator: string;
  country: string; // ISO3
}): Promise<Series> {
  const { indicator, country } = params;
  const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=20000`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`World Bank error ${res.status}`);

  const json = await res.json();
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    throw new Error("Unexpected World Bank response");
  }
  const rows = json[1] as any[];

  const indTitle = rows?.[0]?.indicator?.value ?? indicator;
  const countryName = rows?.[0]?.country?.value ?? country;

  const points = rows
    .map((r) => ({
      time: String(r.date),
      value: r.value == null ? null : Number(r.value),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  return {
    id: `worldbank:${indicator}:${country}`,
    title: `${indTitle} — ${countryName}`,
    unit: "USD",
    frequency: "A",
    points,
    source: {
      name: "World Bank",
      url: `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}`,
    },
  };
}

// All WB countries (filter out aggregates)
export async function fetchWorldBankCountries(): Promise<CountryOption[]> {
  // includes territories; we’ll filter out aggregates (region.id === "NA")
  const url = `https://api.worldbank.org/v2/country?format=json&per_page=400`;
  const res = await fetch(url, { next: { revalidate: 86400 } }); // cache for 1 day
  if (!res.ok) throw new Error(`World Bank countries error ${res.status}`);

  const json = await res.json();
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    throw new Error("Unexpected World Bank country response");
  }

  const rows = json[1] as any[];
  const out: CountryOption[] = rows
    .filter((r) => r?.region?.id !== "NA") // "Aggregates"
    .map((r) => ({ code: String(r.id).toUpperCase(), label: String(r.name) }))
    .filter((c) => c.code.length === 3);

  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}

