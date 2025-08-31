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
    logoScale: 0.7,
    summary: "Real GDP in constant 2015 USD — long-run output by country.",
    description:
      "Gross Domestic Product in constant 2015 US dollars. Measures total output adjusted for inflation, annual frequency by country from the World Bank.",
    countrySource: "worldbank",
    defaultCountryCode: "USA",
    variants: [
      { key: "gross",     label: "Gross",      dataset: "NY.GDP.MKTP.KD",  unitLabel: "USD (2015, constant)", yPrefix: "$" },
      { key: "perCapita", label: "Per capita", dataset: "NY.GDP.PCAP.KD",  unitLabel: "USD per person (2015, constant)", yPrefix: "$" }
    ],
    defaultVariantKey: "gross",
    viz: {
      metricName: "GDP",
      color: "var(--chart-1)",
      showArea: true,
      controls: { scale: true, digits: true }
    }
  },

  {
    slug: "fred-cpi-u",
    name: "CPI-U (All Urban Consumers)",
    provider: "FRED",
    dataset: "CPIAUCSL",
    tags: ["prices", "monthly"],
    image: "/images/vendor-logos/fred.svg",
    imageFit: "contain",
    logoScale: 1.0,
    summary: "US headline CPI — monthly consumer price index.",
    countrySource: "static",
    staticCountries: [{ label: "United States", code: "USA" }],
    defaultCountryCode: "USA",
    viz: {
      metricName: "CPI-U",
      unitLabel: "Index (1982–84=100)",
      showArea: true,
      controls: { scale: false, digits: true }
    }
  },

  {
    slug: "bls-unemp-u3",
    name: "Unemployment Rate (U-3)",
    provider: "BLS",
    dataset: "LNS14000000",
    tags: ["labor", "monthly"],
    image: "/images/vendor-logos/bls.svg",
    imageFit: "contain",
    logoScale: 0.7,
    summary: "US unemployment rate (U-3) — % of the labor force unemployed.",
    countrySource: "static",
    staticCountries: [{ label: "United States", code: "USA" }],
    defaultCountryCode: "USA",
    viz: {
      metricName: "Unemployment rate",
      unitLabel: "%",
      ySuffix: "%",
      showArea: true,
      controls: { scale: false, digits: true }
    }
  },

  // Updated CO₂ indicators (new WDI GHGi series; EDGAR, AR5)
  {
    slug: "wb-co2",
    name: "CO₂ Emissions",
    provider: "World Bank",
    dataset: "EN.GHG.CO2.MT.CE.AR5",
    tags: ["environment", "annual"],
    image: "/images/vendor-logos/worldbank.svg",
    imageFit: "contain",
    logoScale: 0.7,
    summary: "World & country CO₂ emissions over time (EDGAR, AR5).",
    description:
      "New WDI greenhouse-gas indicators (EDGAR, AR5). Total CO₂ excludes LULUCF. Per-capita measured in t CO₂e per person.",
    countrySource: "worldbank",
    defaultCountryCode: "USA",
    variants: [
      { key: "gross",     label: "Gross (Mt CO₂e)",              dataset: "EN.GHG.CO2.MT.CE.AR5", unitLabel: "Mt CO₂e" },
      { key: "perCapita", label: "Per capita (t CO₂e/person)",   dataset: "EN.GHG.CO2.PC.CE.AR5", unitLabel: "t CO₂e/person" }
    ],
    defaultVariantKey: "gross",
    viz: {
      metricName: "CO₂",
      color: "var(--chart-1)",
      showArea: true,
      controls: { scale: true, digits: true }
    }
  },

  {
    slug: "bls-ahe-total-private",
    name: "Avg Hourly Earnings — Total Private",
    provider: "BLS",
    dataset: "CES0500000003",
    tags: ["wages", "earnings", "monthly", "US"],
    image: "/images/vendor-logos/bls.svg",
    imageFit: "contain",
    logoScale: 0.7,
    summary: "Average hourly earnings of all employees, USD/hour.",
    description: "BLS CES series CES0500000003.",
    countrySource: "static",
    staticCountries: [{ label: "United States", code: "USA" }],
    defaultCountryCode: "USA",
    viz: {
      metricName: "Avg Hourly Earnings",
      unitLabel: "USD/hour",
      yPrefix: "$",
      color: "var(--chart-3)",
      showArea: true,
      controls: { scale: false, digits: true }
    }
  }
];

