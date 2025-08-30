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
 * Countries are NOT hand-typed. The product just says how to fetch them.
 */
export type ChartVizConfig = {
	metricName?: string;              // e.g. "GDP", "CPI", "Unemployment rate"
	unitLabel?: string;               // y-axis label override, e.g. "USD", "Index (2015=100)"
	yPrefix?: string;                 // "$"
	ySuffix?: string;                 // "%", " pts"
	color?: string;                   // CSS color, default uses var(--chart-1)
	showArea?: boolean;               // default true
	controls?: { scale?: boolean; digits?: boolean }; // show/hide top controls
};

export type ProductMeta = {
	slug: string;
	name: string;
	provider: ProviderName;
	dataset?: string;
	tags?: string[];

	/** Card image. Logos are usually SVGs. */
	image?: string;
	/** Force fit mode for the image band. Defaults: SVG→"contain", others→"cover". */
	imageFit?: "cover" | "contain";
	/** Optional scale for logos (1 = 100%). Lets you make FRED big, WB small, etc. */
	logoScale?: number;

	summary?: string;
	description?: string;

	/** How to get country options for the product. */
	countrySource?: "worldbank" | "static" | null;
	staticCountries?: CountryOption[];
	defaultCountryCode?: string;

	viz?: ChartVizConfig;
};

