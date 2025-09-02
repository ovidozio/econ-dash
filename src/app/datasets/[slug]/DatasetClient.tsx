"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import SeriesChart from "@/components/charts/SeriesChart";
import MultiSeriesChart from "@/components/charts/MultiSeriesChart";
import CountryCombobox from "@/components/controls/CountryCombobox";
import VariantSelect from "@/components/VariantSelect";
import SectorSelector from "@/components/controls/SectorSelector";
import type { Series, CountryOption, ProductMeta, ScaleMode } from "@/lib/types";
import { CATALOG } from "@/lib/products";

type IndustriesApiResp = {
  ok: boolean;
  provider: string;
  unit?: string;
  series?: Array<{
    key: string;
    code?: string;
    points: Array<{ year: number; value: number | null }>;
  }>;
  error?: string;
  meta?: any;
};

export default function DatasetClient({ slug }: { slug: string }) {
  const product = useMemo<ProductMeta | undefined>(
    () => CATALOG.find((p) => p.slug === slug),
    [slug]
  );
  const router = useRouter();
  const search = useSearchParams();

  // ------------------------------- Countries ---------------------------------
  const { data: wbCountries } = useQuery<CountryOption[]>({
    queryKey: ["countries", "worldbank"],
    enabled: product?.countries.mode === "worldbank",
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const r = await fetch("/api/countries?provider=worldbank", { cache: "no-store" });
      const j = await r.json();
      if (!j.countries) throw new Error(j.error || "No countries");
      return j.countries as CountryOption[];
    },
  });

  const countriesForPicker: CountryOption[] = useMemo(() => {
    if (!product) return [];
    if (product.countries.mode === "worldbank") return wbCountries ?? [];
    if (product.countries.mode === "static") return product.countries.list;
    return [];
  }, [product, wbCountries]);

  const urlCountry = search.get("country")?.toUpperCase() || null;
  const urlVariant = search.get("variant") || null;

  const [country, setCountry] = useState<string>(
    urlCountry ||
      product?.countries.default ||
      countriesForPicker[0]?.code ||
      "USA"
  );

  const initialVariantKey =
    urlVariant ||
    product?.defaultVariantKey ||
    product?.variants?.[0]?.key ||
    "default";

  const [variantKey, setVariantKey] = useState<string>(initialVariantKey);

  useEffect(() => {
    if (!product || countriesForPicker.length === 0) return;
    const codes = new Set(
      countriesForPicker.map((c) => c.code.toUpperCase())
    );
    if (!codes.has(country.toUpperCase())) {
      const prefer =
        (urlCountry && codes.has(urlCountry) && urlCountry) ||
        (product?.countries.default &&
          codes.has(product.countries.default.toUpperCase()) &&
          product.countries.default.toUpperCase()) ||
        countriesForPicker[0].code;
      setCountry(prefer);
      const u = new URL(window.location.href);
      u.searchParams.set("country", prefer);
      router.replace(u.pathname + "?" + u.searchParams.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesForPicker]);

  useEffect(() => {
    if (!product) return;
    const u = new URL(window.location.href);
    if (product.variants?.length) u.searchParams.set("variant", variantKey);
    else u.searchParams.delete("variant");
    router.replace(u.pathname + "?" + u.searchParams.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantKey, product?.slug]);

  const setCountryAndSync = (c: string) => {
    const next = c.toUpperCase();
    setCountry(next);
    const u = new URL(window.location.href);
    u.searchParams.set("country", next);
    router.replace(u.pathname + "?" + u.searchParams.toString());
  };

  const setVariantAndSync = (v: string) => {
    setVariantKey(v);
    const u = new URL(window.location.href);
    u.searchParams.set("variant", v);
    router.replace(u.pathname + "?" + u.searchParams.toString());
  };

  if (!product)
    return <main className="mx-auto max-w-3xl p-6">Unknown dataset: {slug}</main>;

  // Convenience: product units (for both charts)
  const unitsCfg = product.viz?.units;
  const allowedScales = (unitsCfg?.scaleOptions as ScaleMode[] | undefined) ?? undefined;
  const digitsOptions = unitsCfg?.digitsOptions ?? undefined;
  const defaultScale = unitsCfg?.defaultScale ?? product.viz?.defaultScale ?? "sci";
  const defaultDigits = unitsCfg?.defaultDigits ?? product.viz?.defaultDigits ?? 2;

  // ------------------------------ Industries page ----------------------------
  if (product.slug === "industries-multiline") {
    // Default: NO LINES when clear (selected = [])
    // Optional: support ?random=1 to pre-pick one random sector as if clicked.
    const urlCodes = search.get("codes") || "";
    const initialCodes = urlCodes ? urlCodes.split(";").filter(Boolean) : [];
    const wantRandom = search.get("random") === "1";

    const [level, setLevel] = useState<"sections" | "detail">("sections");
    const [price, setPrice] = useState<"CP_MEUR" | "CLV15_MEUR">("CP_MEUR");
    const [selected, setSelected] = useState<string[]>(initialCodes);

    // Options
    const { data: optionsResp } = useQuery({
      queryKey: ["industries-options", country, level],
      queryFn: async () => {
        const r = await fetch(
          `/api/industries/options?country=${country}&level=${level}&provider=wb`,
          { cache: "no-store" }
        );
        return r.json();
      },
      staleTime: 60 * 60 * 1000,
    });
    const options = (optionsResp?.options as Array<{ code: string; label: string }>) ?? [];

    // If ?random=1 and nothing selected, auto-pick one at first options load
    useEffect(() => {
      if (!wantRandom) return;
      if (selected.length > 0) return;
      if (options.length === 0) return;
      const pick = options[Math.floor(Math.random() * options.length)]!.code;
      setSelected([pick]);
      const u = new URL(window.location.href);
      u.searchParams.set("codes", pick);
      router.replace(u.pathname + "?" + u.searchParams.toString());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wantRandom, options.length]);

    // Series request ONLY when at least one sector is selected
    const { data: rawResp, isFetching } = useQuery<IndustriesApiResp>({
      queryKey: ["industries-series", country, price, selected.join(";") || "none"],
      enabled: selected.length > 0, // <- key change: do not fetch by default
      queryFn: async () => {
        const base = `/api/industries/series?country=${country}&price=${price}&provider=wb`;
        const url = `${base}&codes=${encodeURIComponent(selected.join(";"))}`;
        const r = await fetch(url, { cache: "no-store" });
        return r.json();
      },
      staleTime: 60 * 60 * 1000,
      keepPreviousData: true,
    });

    const multiSeries = useMemo(() => {
      if (!rawResp?.series || !Array.isArray(rawResp.series) || rawResp.series.length === 0) return null;
      return {
        unit: unitsCfg?.unitLabel || rawResp.unit || "% of GDP",
        series: rawResp.series.map((s) => ({
          key: s.key,
          points: (s.points || []).map((p) => ({
            time: String(p.year),
            value: p.value,
          })),
        })),
      };
    }, [rawResp, unitsCfg?.unitLabel]);

    // Sync codes & country to URL
    useEffect(() => {
      const u = new URL(window.location.href);
      if (selected.length) u.searchParams.set("codes", selected.join(";"));
      else u.searchParams.delete("codes");
      u.searchParams.set("country", country);
      router.replace(u.pathname + "?" + u.searchParams.toString());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, country]);

    return (
      <main className="mx-auto max-w-3xl p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <div className="text-sm text-muted-foreground">{rawResp?.provider ?? "Industries"}</div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {product.countries.mode !== "none" && (
            <div>
              <div className="text-sm mb-1">Country</div>
              <CountryCombobox value={country} onChange={setCountryAndSync} options={countriesForPicker} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm mb-1">Prices</div>
              <select className="border rounded px-2 py-1 w-full" value={price} onChange={(e) => setPrice(e.target.value as any)}>
                <option value="CP_MEUR">Current prices (nominal)</option>
                <option value="CLV15_MEUR">Constant prices (real)</option>
              </select>
            </div>
            <div>
              <div className="text-sm mb-1">Level</div>
              <select className="border rounded px-2 py-1 w-full" value={level} onChange={(e) => setLevel(e.target.value as any)}>
                <option value="sections">Sections (A–U)</option>
                <option value="detail">Detail (selected groups)</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-sm">Sectors</div>
          <SectorSelector
            options={options}
            selected={selected}
            onAdd={(c) => setSelected((prev) => (prev.includes(c) ? prev : [...prev, c]))}
            onRemove={(c) => setSelected((prev) => prev.filter((x) => x !== c))}
            onClear={() => setSelected([])}
          />
        </section>

        <section>
          {selected.length === 0 ? (
            <div className="h-80 rounded-xl border grid place-items-center text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900/40">
              Pick one or more sectors above to start.
            </div>
          ) : multiSeries ? (
            <MultiSeriesChart
              series={multiSeries}
              unitLabel={multiSeries.unit}
              allowedScales={allowedScales}
              digitsOptions={digitsOptions}
              defaultScale={defaultScale}
              defaultDigits={defaultDigits}
            />
          ) : (
            <div className="h-80 rounded-xl border animate-pulse bg-gray-50 dark:bg-gray-900/40" />
          )}
          {isFetching && selected.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">Updating…</div>
          )}
        </section>

        <section className="text-sm">
          {product.description ?? product.summary ?? "No description available."}
        </section>
      </main>
    );
  }

  // --------------------------- Default (WB / FRED / BLS) ---------------------
  const activeVariant = useMemo(
    () => product?.variants?.find((v) => v.key === variantKey) ?? null,
    [product, variantKey]
  );

  const datasetToFetch = activeVariant?.dataset || product.dataset || "";

  const { data, isFetching, error } = useQuery<Series>({
    queryKey: ["series", product?.provider, datasetToFetch, country, activeVariant?.key ?? "default"],
    enabled: !!datasetToFetch && (!!country || product?.countries.mode !== "worldbank"),
    staleTime: 60 * 60 * 1000,
    keepPreviousData: true,
    queryFn: async () => {
      if (product?.provider === "World Bank") {
        const r = await fetch(
          `/api/series?provider=worldbank&dataset=${encodeURIComponent(datasetToFetch)}&country=${encodeURIComponent(country)}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        if (!j.series) throw new Error(j.error || "No series");
        return j.series as Series;
      }
      if (product?.provider === "BLS") {
        const r = await fetch(`/api/series?provider=bls&dataset=${encodeURIComponent(datasetToFetch)}`, { cache: "no-store" });
        const j = await r.json();
        if (!j.series) throw new Error(j.error || "No series");
        return j.series as Series;
      }
      if (product?.provider === "FRED") {
        const r = await fetch(`/api/series?provider=fred&dataset=${encodeURIComponent(datasetToFetch)}`, { cache: "no-store" });
        const j = await r.json();
        if (!j.series) throw new Error(j.error || "No series");
        return j.series as Series;
      }
      throw new Error(`Unsupported provider: ${product?.provider}`);
    },
  });

  const viz = product.viz ?? {};
  const unitLabel =
    unitsCfg?.unitLabel ??
    activeVariant?.unitLabel ??
    viz.unitLabel ??
    data?.unit ??
    "Value";
  const yPrefix = unitsCfg?.yPrefix ?? activeVariant?.yPrefix ?? viz.yPrefix;
  const ySuffix = unitsCfg?.ySuffix ?? activeVariant?.ySuffix ?? viz.ySuffix;

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{product?.name}</h1>
        <div className="text-sm text-muted-foreground">{product?.provider}</div>
      </header>

      <section>
        {error && <div className="text-sm text-red-600">Error: {(error as Error).message}</div>}
        {data && (
          <SeriesChart
            series={data}
            metricName={viz.metricName ?? product?.name}
            unitLabel={unitLabel}
            yPrefix={yPrefix}
            ySuffix={ySuffix}
            color={"var(--series-1)"}          // theme-driven primary
            showArea={viz.showArea ?? true}
            allowedScales={allowedScales}
            digitsOptions={digitsOptions}
            defaultScale={defaultScale}
            defaultDigits={defaultDigits}
          />
        )}
        {!data && !error && <div className="h-80 rounded-xl border animate-pulse bg-gray-50 dark:bg-gray-900/40" />}
        {isFetching && <div className="mt-2 text-xs text-muted-foreground">Updating…</div>}
      </section>

      {product.countries.mode !== "none" && (
        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm mb-1">Country</div>
            <CountryCombobox value={country} onChange={setCountryAndSync} options={countriesForPicker} />
          </div>
          {product?.variants?.length ? (
            <div>
              <div className="text-sm mb-1">Measure</div>
              <VariantSelect
                value={activeVariant?.key ?? ""}
                onChange={setVariantAndSync}
                options={product.variants.map((v) => ({ key: v.key, label: v.label }))}
              />
            </div>
          ) : null}
        </section>
      )}

      <section className="text-sm">
        {product?.description ?? product?.summary ?? "No description available."}
      </section>
    </main>
  );
}

