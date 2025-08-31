export type ProviderName =
  | "World Bank"
  | "FRED"
  | "BLS"
  | "Eurostat"
  | "ILOSTAT"
  | "UN Comtrade"
  | "UNESCO"
  | "UNDESA"
  | "OWID";

export type CountryOption = { label: string; code: string };

export type SeriesPoint = {
  time: string;
  value: number | null;
};

export type Series = {
  id: string;
  title: string;
  unit?: string;
  frequency?: "A" | "Q" | "M" | "D";
  points: SeriesPoint[];
  source: { name: string; url?: string; license?: string };
  meta?: Record<string, unknown>;
};

export type ChartVizConfig = {
  metricName?: string;
  unitLabel?: string;
  yPrefix?: string;
  ySuffix?: string;
  color?: string;
  showArea?: boolean;
  controls?: { scale?: boolean; digits?: boolean };
  defaultScale?:
    | "auto"
    | "raw"
    | "thousand"
    | "million"
    | "billion"
    | "trillion"
    | "sci";
  defaultDigits?: number;
};

export type ProductVariant = {
  key: string;
  label: string;
  dataset: string;
  unitLabel?: string;
  yPrefix?: string;
  ySuffix?: string;
};

export type ProductMeta = {
  slug: string;
  name: string;
  provider: ProviderName;
  dataset?: string;
  tags?: string[];
  image?: string;
  imageFit?: "cover" | "contain";
  logoScale?: number;
  summary?: string;
  description?: string;
  countrySource?: "worldbank" | "static" | null;
  staticCountries?: { label: string; code: string }[];
  defaultCountryCode?: string;
  variants?: ProductVariant[];
  defaultVariantKey?: string;
  viz?: ChartVizConfig;
};

