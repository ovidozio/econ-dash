# Econ Dashboard

A “shopping-style” interface for exploring economic data.
Datasets are displayed like products with preview cards, filters, and detail pages.
Clicking a card opens a product page with a chart, clear axis descriptions, and source attribution.
Options (like sizes on a store) map to things like country, frequency, and units.

## Project Goals

- Present datasets as **product cards** with title, source tag, and a small preview (sparkline).
- Provide **product pages** with charts, axis explanations, methodology notes, and licensing.
- Support **options/variants** (e.g., Country, Frequency, Units, Seasonal Adjustment).
- Build **modular fetchers** per provider that normalize to a common time-series shape.
- Enable **fast prototyping**: wire a fetcher → card → detail page and verify the UI quickly.
- Keep the stack **simple now**, with room to add a typed or high-performance backend later.

## Current Planned Datasets

- **World Bank — GDP (constant 2015 US$)**
  Real GDP by country, annual.

- **FRED — CPI-U (All Urban Consumers)**
  US consumer price index, monthly.

- **BLS — Unemployment Rate (U-3)**
  Headline unemployment percentage, monthly.

- **Eurostat — HICP**
  Harmonised Index of Consumer Prices, EU countries, monthly.

- **ILOSTAT — Employment / Unemployment**
  Labour indicators by country, mixed frequencies.

- **UN Comtrade — Trade Flows**
  Imports/exports by reporter, partner, and commodity (HS), monthly/annual.

- **UNESCO — Education Indicators**
  Enrollment, literacy, expenditure, annual.

- **UNDESA — Population**
  Population totals and demographics, annual.

- **Our World in Data — Curated Indicators**
  Selected macro/energy/health series, mixed frequencies.

## Technologies In Use (Right Now)

**Frontend**
- **Next.js (React + TypeScript, App Router)**
  Pages for catalog (`/browse`) and dataset detail (`/datasets/[slug]`).
- **Tailwind CSS**
  Utility-first styling for a fast “storefront” layout.
- **(Optional) shadcn/ui**
  Prebuilt, unstyled components for ecommerce-like cards, filters, drawers, and dialogs.
- **Recharts**
  Declarative charts for previews and detail pages.
- **TanStack Query (React Query)**
  Client-side data fetching, caching, and request state management.

**Backend (Phase 1)**
- **Next.js Route Handlers (`/api/*`)**
  Simple proxy and normalization layer in the same app.
  No separate server needed during prototyping.

**Testing (initial)**
- **Vitest + React Testing Library (planned)**
  Unit tests for fetchers and components, plus basic API tests.

**Data Fetchers (to be implemented in `src/lib/fetchers/`)**
- `bls.ts`, `comtrade.ts`, `eurostat.ts`, `fred.ts`,
  `ilostat.ts`, `owid.ts`, `undesa.ts`, `unesco.ts`, `worldbank.ts`.

**Data Shapes (normalized)**
- Common **Series** type: `{ id, title, unit, frequency, points: [{ time, value }], source }`.
- Ensures charts and UI can remain provider-agnostic.

## Near-Term Tasks

- Implement `worldbank.ts` as the first fetcher.
- Add `/api/series` route that dispatches to a provider fetcher.
- Build `ProductCard` and `SeriesChart` components.
- Render a minimal catalog at `/browse` with mock data, then live data.
- Write unit tests for the first fetcher and API route.

## Future (Optional) Backend

- **OCaml (Dream/Opium)** for strong typing and robust transforms, or
- **C++ (Drogon)** for maximum performance, or
- **Optimized Python (FastAPI + Polars)** for rapid data plumbing.
- Add a DB (SQLite/Postgres) for caching, product registry, and saved views.

