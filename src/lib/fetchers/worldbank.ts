import type { CountryOption, Series } from "@/lib/types";

const WB_BASE = "https://api.worldbank.org/v2";

function wbUrl(
  path: string,
  params: Record<string, string | number> = {}
): string {
  const usp = new URLSearchParams({
    format: "json",
    per_page: "20000",
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ),
  });
  return `${WB_BASE}${path}?${usp.toString()}`;
}

export async function fetchWorldBankSeries(params: {
  indicator: string;
  country: string;
}): Promise<Series> {
  const { indicator, country } = params;
  const url = wbUrl(
    `/country/${encodeURIComponent(country)}/indicator/${encodeURIComponent(
      indicator
    )}`
  );

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `World Bank: indicator "${indicator}" not found (HTTP 404).`
      );
    }
    throw new Error(`World Bank error ${res.status}`);
  }

  const json = await res.json();
  if (Array.isArray(json) && json[0]?.message) {
    const msg = json[0].message?.[0]?.value ?? "Unknown World Bank error";
    throw new Error(
      `World Bank: ${msg} (indicator="${indicator}", country="${country}")`
    );
  }
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    throw new Error("Unexpected World Bank response");
  }

  const rows = json[1] as any[];
  const points = rows
    .map((r) => ({
      time: String(r.date),
      value: r.value == null ? null : Number(r.value),
    }))
    .filter((p) => p.time)
    .sort((a, b) => a.time.localeCompare(b.time));

  const title = rows?.[0]?.indicator?.value || indicator;
  const unit = rows?.[0]?.unit || undefined;

  return {
    id: `worldbank:${indicator}:${country}`,
    title,
    unit,
    frequency: "A",
    points,
    source: {
      name: "World Bank",
      url: wbUrl(
        `/country/${encodeURIComponent(country)}/indicator/${encodeURIComponent(
          indicator
        )}`,
        { per_page: 50 }
      ),
      license: "World Bank Terms of Use",
    },
    meta: { indicator, country },
  };
}

export async function fetchWorldBankCountries(): Promise<CountryOption[]> {
  const url = wbUrl(`/country`, { per_page: 400 });

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`World Bank error ${res.status}`);

  const json = await res.json();
  if (Array.isArray(json) && json[0]?.message) {
    const msg = json[0].message?.[0]?.value ?? "Unknown World Bank error";
    throw new Error(`World Bank: ${msg}`);
  }
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    throw new Error("Unexpected World Bank country response");
  }

  const rows = json[1] as any[];
  const out: CountryOption[] = rows
    .filter((r) => r?.region?.id !== "NA") // drops aggregates
    .map((r) => ({ code: String(r.id).toUpperCase(), label: String(r.name) }))
    .filter((c) => c.code.length === 3);

  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}

