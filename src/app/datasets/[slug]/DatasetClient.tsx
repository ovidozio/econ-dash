"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import SeriesChart from "@/components/SeriesChart";
import CountryCombobox from "@/components/CountryCombobox";
import VariantSelect from "@/components/VariantSelect";
import type { Series, CountryOption, ProductMeta } from "@/lib/types";
import { CATALOG } from "@/lib/products";

export default function DatasetClient({ slug }: { slug: string }) {
  const product = useMemo<ProductMeta | undefined>(() => CATALOG.find((p) => p.slug === slug), [slug]);
  const router = useRouter();
  const search = useSearchParams();

  const { data: wbCountries } = useQuery<CountryOption[]>({
    queryKey: ["countries", "worldbank"],
    enabled: product?.countrySource === "worldbank",
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
    if (product.countrySource === "worldbank") return wbCountries ?? [];
    if (product.countrySource === "static") return product.staticCountries ?? [];
    return [];
  }, [product, wbCountries]);

  const urlCountry = search.get("country")?.toUpperCase() || null;
  const urlVariant = search.get("variant") || null;

  const [country, setCountry] = useState<string>(
    urlCountry || product?.defaultCountryCode || (countriesForPicker[0]?.code ?? "USA"),
  );

  const initialVariantKey =
    urlVariant ||
    product?.defaultVariantKey ||
    (product?.variants?.[0]?.key ?? "default");

  const [variantKey, setVariantKey] = useState<string>(initialVariantKey);

  useEffect(() => {
    if (countriesForPicker.length === 0) return;
    const codes = new Set(countriesForPicker.map((c) => c.code.toUpperCase()));
    if (!codes.has(country.toUpperCase())) {
      const prefer =
        (urlCountry && codes.has(urlCountry) && urlCountry) ||
        (product?.defaultCountryCode && codes.has(product.defaultCountryCode.toUpperCase()) && product.defaultCountryCode.toUpperCase()) ||
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

  if (!product) return <main className="mx-auto max-w-3xl p-6">Unknown dataset: {slug}</main>;

  const activeVariant = useMemo(
    () => (product.variants?.find(v => v.key === variantKey)) ?? null,
    [product, variantKey]
  );

  const datasetToFetch = (activeVariant?.dataset) || product.dataset || "";

  const { data, isFetching, error } = useQuery<Series>({
    queryKey: ["series", product.provider, datasetToFetch, country, activeVariant?.key ?? "default"],
    enabled: !!datasetToFetch && (!!country || product.countrySource !== "worldbank"),
    staleTime: 60 * 60 * 1000,
    keepPreviousData: true,
    queryFn: async () => {
      if (product.provider === "World Bank") {
        const r = await fetch(
          `/api/series?provider=worldbank&dataset=${encodeURIComponent(datasetToFetch)}&country=${encodeURIComponent(country)}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        if (!j.series) throw new Error(j.error || "No series");
        return j.series as Series;
      }
      if (product.provider === "BLS") {
        const r = await fetch(
          `/api/series?provider=bls&dataset=${encodeURIComponent(datasetToFetch)}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        if (!j.series) throw new Error(j.error || "No series");
        return j.series as Series;
      }
      if (product.provider === "FRED") {
        const r = await fetch(
          `/api/series?provider=fred&dataset=${encodeURIComponent(datasetToFetch)}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        if (!j.series) throw new Error(j.error || "No series");
        return j.series as Series;
      }
      throw new Error(`Unsupported provider: ${product.provider}`);
    },
  });

  const viz = product.viz ?? {};
  const unitLabel = activeVariant?.unitLabel ?? viz.unitLabel ?? data?.unit ?? "Value";
  const yPrefix = activeVariant?.yPrefix ?? viz.yPrefix;
  const ySuffix = activeVariant?.ySuffix ?? viz.ySuffix;

  const chartProps = {
    metricName: viz.metricName ?? product.name,
    unitLabel,
    yPrefix,
    ySuffix,
    color: viz.color ?? "var(--chart-1)",
    showArea: viz.showArea ?? true,
    controls: viz.controls ?? { scale: true, digits: true },
    defaultScale: viz.defaultScale ?? "sci",
    defaultDigits: viz.defaultDigits ?? 2,
  } as const;

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <div className="text-sm text-muted-foreground">{product.provider}</div>
      </header>

      <section>
        {error && <div className="text-sm text-red-600">Error: {(error as Error).message}</div>}
        {data && <SeriesChart series={data} {...chartProps} />}
        {!data && !error && <div className="h-80 rounded-xl border animate-pulse bg-gray-50 dark:bg-gray-900/40" />}
        {isFetching && <div className="mt-2 text-xs text-muted-foreground">Updating…</div>}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-sm mb-1">Country</div>
          <CountryCombobox value={country} onChange={setCountryAndSync} options={countriesForPicker} />
        </div>
        {product.variants?.length ? (
          <div>
            <div className="text-sm mb-1">Measure</div>
            <VariantSelect
              value={activeVariant?.key ?? ""}
              onChange={setVariantAndSync}
              options={product.variants.map(v => ({ key: v.key, label: v.label }))}
            />
          </div>
        ) : null}
      </section>

      <section className="text-sm">
        {product.description ?? product.summary ?? "No description available."}
      </section>

      <section className="flex flex-wrap gap-2 text-sm">
        {data?.source?.url ? (
          <a href={data.source.url} target="_blank" rel="noreferrer" className="no-underline">
            <span className="chip btn-sweep">Source: {data.source.name}</span>
          </a>
        ) : (
          <span className="chip">Source: {data?.source?.name ?? product.provider}</span>
        )}
        {data?.frequency ? <span className="chip">Frequency: {data.frequency === "A" ? "Annual" : data.frequency}</span> : null}
        {unitLabel ? <span className="chip">Unit: {unitLabel}</span> : null}
        {activeVariant ? <span className="chip">Measure: {activeVariant.label}</span> : null}
      </section>
    </main>
  );
}

