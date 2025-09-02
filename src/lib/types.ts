// ---- Common small types -----------------------------------------------------

export type CountryOption = {
  code: string;         // e.g. "USA", "FRA"
  label: string;        // e.g. "United States"
};

export type SeriesPoint = {
  year: number;                     // primary x
  value: number | null;             // y
  // lenient aliases some charts may read:
  t?: number;                       // = year
  v?: number | null;                // = value
  date?: string;                    // ISO date for tooltips if needed
};

export type LineSeries = {
  key: string;                      // legend label
  points: SeriesPoint[];
};

export type Series = {
  unit?: string;                    // "USD", "% of GDP", etc.
  series: LineSeries[];             // one or more lines
  source?: { name: string; url?: string };
  frequency?: "A" | "Q" | "M" | string;
};

// ---- Viz / units & controls -------------------------------------------------

export type ScaleMode =
  | "raw"
  | "thousand"
  | "million"
  | "billion"
  | "trillion"
  | "sci";

// Fine-grained, product-driven unit behavior.
export type UnitsConfig = {
  // What the data fundamentally is (helps future formatting decisions)
  kind: "percent" | "currency" | "index" | "count" | "other";

  // Which scale choices to show (if 0 or 1 → selector is hidden)
  // e.g., percent/index usually []
  scaleOptions?: ScaleMode[];

  // Default scale for this product (overrides viz.defaultScale)
  defaultScale?: ScaleMode;

  // Allowed rounding options (if omitted, [0,1,2,3])
  digitsOptions?: number[];

  // Default rounding digits (overrides viz.defaultDigits)
  defaultDigits?: number;

  // Optional label/prefix/suffix overrides (fallback to viz.* if set there)
  unitLabel?: string;
  yPrefix?: string;
  ySuffix?: string;
};

export type VizControls = {
  // Legacy toggles (still honored as a fallback)
  scale?: boolean;
  digits?: boolean;
};

export type VizMeta = {
  metricName?: string;
  unitLabel?: string;
  yPrefix?: string;
  ySuffix?: string;
  color?: string;
  showArea?: boolean;

  // Legacy controls (kept for back-compat)
  controls?: VizControls;

  // Defaults used by charts if units.default* not given
  defaultScale?: ScaleMode;
  defaultDigits?: number;

  // NEW: product-specific unit configuration
  units?: UnitsConfig;
};

// ---- Product metadata -------------------------------------------------------

export type ProviderName =
  | "World Bank"
  | "BLS"
  | "FRED"
  | "Industries"
  | (string & {});

// Country picker modes
export type CountriesConfig =
  | { mode: "worldbank"; default?: string }                      // dynamic WB list
  | { mode: "static"; list: CountryOption[]; default?: string }  // fixed set you supply
  | { mode: "none" };                                            // no picker at all

export type VariantMeta = {
  key: string;           // stable id, used in ?variant=
  label: string;         // human label
  dataset: string;       // dataset id to request when this variant is picked
  unitLabel?: string;
  yPrefix?: string;
  ySuffix?: string;
};

export type ProductMeta = {
  slug: string;
  name: string;
  provider: ProviderName;
  dataset: string;
  tags?: string[];
  image?: string;
  imageFit?: "cover" | "contain";
  logoScale?: number;
  summary?: string;
  description?: string;

  // Countries (expressive form)
  countries: CountriesConfig;

  // Variants (optional)
  variants?: VariantMeta[];
  defaultVariantKey?: string;

  // Visualization defaults + units config
  viz?: VizMeta;
};

