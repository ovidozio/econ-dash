import type { ProductMeta } from "@/lib/types";

export const CATALOG: ProductMeta[] = [
	{
		slug: "wb-gdp-real",
		name: "GDP (constant 2015 US$)",
		provider: "World Bank",
		dataset: "NY.GDP.MKTP.KD",
		tags: ["macro", "annual"],
		image: "/images/vendor-logos/worldbank.svg",
		imageFit: "contain",
		logoScale: 0.7, // World Bank ~20% size
		summary: "Real GDP in constant 2015 USD — long-run output by country.",
		countrySource: "worldbank",
		defaultCountryCode: "USA",
		viz: {
			metricName: "GDP",
			unitLabel: "USD",
			yPrefix: "$",
			color: "var(--chart-1)",
			showArea: true,
			controls: { scale: true, digits: true },
		},
	},
	{
		slug: "fred-cpi-u",
		name: "CPI-U (All Urban Consumers)",
		provider: "FRED",
		dataset: "CPIAUCSL",
		tags: ["prices", "monthly"],
		image: "/images/vendor-logos/fred.svg",
		imageFit: "contain",
		logoScale: 1.0, // FRED stays large
		summary: "US headline CPI — monthly consumer price index.",
		countrySource: "static",
		staticCountries: [{ label: "United States", code: "USA" }],
		defaultCountryCode: "USA",
	},
	{
		slug: "bls-unemp-u3",
		name: "Unemployment Rate (U-3)",
		provider: "BLS",
		dataset: "LNS14000000",
		tags: ["labor", "monthly"],
		image: "/images/vendor-logos/bls.svg",
		imageFit: "contain",
		logoScale: 0.7, // BLS a little smaller
		summary: "US unemployment rate (U-3) — % of the labor force unemployed.",
		countrySource: "static",
		staticCountries: [{ label: "United States", code: "USA" }],
		defaultCountryCode: "USA",
	},
];

