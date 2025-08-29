export type ProviderName =
  | "World Bank"
  | "FRED"
  | "BLS"
  | "Eurostat"
  | "Our World in Data";

export type CountryOption = { label: string; code: string };

export type SeriesPoint = {
  time: string;            // e.g. "2010"
  value: number | null;
};

export type Series = {
  id: string;              // e.g. "worldbank:NY.GDP.MKTP.KD:USA"
  title: string;
  unit?: string;
  frequency?: "A" | "Q" | "M" | "D";
  points: SeriesPoint[];
  source: { name: string; url?: string; license?: string };
  meta?: Record<string, unknown>;
};

/**
 * Product metadata (what shows up in Browse).
 * Countries are NO LONGER hand-typed. The product just says how to fetch them.
 */
export type ProductMeta = {
  slug: string;
  name: string;
  provider: ProviderName;
  dataset?: string;                 // indicator/series id; required for WB products
  tags?: string[];

  // Browse card extras
  image?: string;                   // "/images/products/wb-gdp-real.jpg"
  summary?: string;                 // short description under the title

  // Dynamic country source
  countrySource?: "worldbank" | "static" | null;
  staticCountries?: CountryOption[];     // only if countrySource === "static"
  defaultCountryCode?: string;           // preferred initial country (e.g., "USA")
};

