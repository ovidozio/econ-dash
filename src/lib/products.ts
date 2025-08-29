import type { ProductMeta } from "@/lib/types";

export const CATALOG: ProductMeta[] = [
  {
    slug: "wb-gdp-real",
    name: "GDP (constant 2015 US$)",
    provider: "World Bank",
    dataset: "NY.GDP.MKTP.KD",
    tags: ["macro", "annual"],
    image: "/images/products/wb-gdp-real.jpg",
    summary: "Real GDP in constant 2015 USD — long-run output by country.",
    countrySource: "worldbank",
    defaultCountryCode: "USA",
  },

  // Examples of other providers (will wire their fetchers later)
  {
    slug: "fred-cpi-u",
    name: "CPI-U (All Urban Consumers)",
    provider: "FRED",
    dataset: "CPIAUCSL",
    tags: ["prices", "monthly"],
    image: "/images/products/fred-cpi-u.jpg",
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
    image: "/images/products/bls-unemp-u3.jpg",
    summary: "US unemployment rate (U-3) — % of the labor force unemployed.",
    countrySource: "static",
    staticCountries: [{ label: "United States", code: "USA" }],
    defaultCountryCode: "USA",
  },
];

