// SDMX-JSON fetcher for Eurostat.
// You MUST point EUROSTAT_SDMX_BASE to a valid SDMX-JSON endpoint in .env.local.
// Examples that work for SDMX-JSON v2.1:
//   https://ec.europa.eu/eurostat/api/discoveries/tgm/data   (new "Discoveries" infra; requires dataset pathing)
//   https://ec.europa.eu/eurostat/api/discoveries/tgm/data/nama_10_a64?time=2020  (pattern with dataset in path)
//
// If you have a proxy in front of Eurostat, set EUROSTAT_SDMX_BASE to that.
// If unset or wrong, we throw a helpful error and the service will fall back to World Bank.

const EUROSTAT_SDMX_BASE = (process.env.EUROSTAT_SDMX_BASE || "").replace(/\/+$/, "");

type Dict = Record<string, string | number | boolean | undefined>;

function toQuery(params: Dict): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export async function fetchSdmxJson(dataset: string, filter: Dict): Promise<any> {
  if (!EUROSTAT_SDMX_BASE) {
    throw new Error(
      "EUROSTAT_SDMX_BASE is not set. Set it in .env.local to a valid SDMX JSON endpoint (e.g., https://ec.europa.eu/eurostat/api/discoveries/tgm/data)."
    );
  }
  // dataset in path; filters as query
  const url = `${EUROSTAT_SDMX_BASE}/${encodeURIComponent(dataset)}${toQuery(filter)}`;

  const resp = await fetch(url, {
    headers: { "Accept": "application/vnd.sdmx.data+json; charset=utf-8" },
  } as RequestInit);

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Eurostat SDMX fetch failed (${resp.status}): ${text.slice(0, 400)}`);
  }

  // Attempt to parse JSON; if it's HTML or plain text, this will throw.
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Eurostat endpoint did not return JSON. URL: ${url}\nPayload (first 200 chars): ${text.slice(0, 200)}`);
  }
}

