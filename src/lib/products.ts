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
    countries: { mode: "worldbank", default: "USA" },
    variants: [
      { key: "gross",     label: "Gross",      dataset: "NY.GDP.MKTP.KD", unitLabel: "USD (2015, constant)", yPrefix: "$" },
      { key: "perCapita", label: "Per capita", dataset: "NY.GDP.PCAP.KD", unitLabel: "USD per person (2015, constant)", yPrefix: "$" }
    ],
    defaultVariantKey: "gross",
    viz: {
      metricName: "GDP",
      showArea: true,
      units: {
        kind: "currency",
        unitLabel: "USD",
        yPrefix: "$",
        scaleOptions: ["raw","thousand","million","billion","trillion","sci"],
        defaultScale: "sci",
        digitsOptions: [0,1,2,3],
        defaultDigits: 2,
      },
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
    logoScale: 1.0,
    summary: "US headline CPI — monthly consumer price index.",
    countries: { mode: "none" },
    viz: {
      metricName: "CPI-U",
      unitLabel: "Index (1982–84=100)",
      showArea: true,
      units: {
        kind: "index",
        // Only Raw & Scientific make sense for an index
        scaleOptions: ["raw","sci"],
        defaultScale: "raw",
        digitsOptions: [0,1,2],
        defaultDigits: 2,
      },
    },
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
    countries: { mode: "none" },
    viz: {
      metricName: "Unemployment rate",
      unitLabel: "%",
      ySuffix: "%",
      showArea: true,
      units: {
        kind: "percent",
        scaleOptions: [],           // no scaling for %
        digitsOptions: [0,1,2],
        defaultDigits: 1,
      },
    },
  },

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
    countries: { mode: "worldbank", default: "USA" },
    variants: [
      { key: "gross",     label: "Gross (Mt CO₂e)",            dataset: "EN.GHG.CO2.MT.CE.AR5", unitLabel: "Mt CO₂e" },
      { key: "perCapita", label: "Per capita (t CO₂e/person)", dataset: "EN.GHG.CO2.PC.CE.AR5", unitLabel: "t CO₂e/person" }
    ],
    defaultVariantKey: "gross",
    viz: {
      metricName: "CO₂",
      units: {
        kind: "count",
        scaleOptions: ["raw","thousand","million","billion","trillion","sci"],
        defaultScale: "sci",
        digitsOptions: [0,1,2,3],
        defaultDigits: 2,
      },
    },
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
    countries: { mode: "none" },
    viz: {
      metricName: "Avg Hourly Earnings",
      unitLabel: "USD/hour",
      yPrefix: "$",
      showArea: true,
      units: {
        kind: "currency",
        unitLabel: "USD/hour",
        yPrefix: "$",
        // wages are already “per hour”, so no scaling menu
        scaleOptions: [],
        digitsOptions: [0,1,2],
        defaultDigits: 2,
      },
    },
  },

  {
    slug: "industries-multiline",
    name: "Industries — Multi-line",
    provider: "Industries",
    dataset: "industries",
    tags: ["structure", "industry", "annual"],
    image: "/images/vendor-logos/eurostat.svg",
    imageFit: "contain",
    logoScale: 0.9,
    summary: "Pick sectors and compare their evolution (nominal or real).",
    description:
      "EU: detailed industries via Eurostat (A*64). Others: World Bank (Agriculture/Industry/Services). Use the selector to add/remove sectors and switch between current and constant prices.",
    countries: { mode: "worldbank", default: "FRA" },
    viz: {
      metricName: "Value added",
      units: {
        kind: "percent",
        unitLabel: "% of GDP",
        scaleOptions: [],
        digitsOptions: [0,1,2],
        defaultDigits: 2,
      },
    },
  },
];

