"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import SeriesChart from "@/components/SeriesChart";
import CountryCombobox from "@/components/CountryCombobox";
import { Badge } from "@/components/ui/badge";
import type { Series, CountryOption } from "@/lib/types";
import { CATALOG } from "@/lib/products";

export default function DatasetClient({ slug }: { slug: string }) {
  const product = useMemo(() => CATALOG.find((p) => p.slug === slug), [slug]);
  const router = useRouter();
  const search = useSearchParams();

  // Load countries based on product.countrySource
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

  // pick initial country (URL → product.defaultCountryCode → first in list → "USA")
  const urlCountry = search.get("country")?.toUpperCase() || null;
  const [country, setCountry] = useState<string>(
    urlCountry ||
      product?.defaultCountryCode ||
      (countriesForPicker[0]?.code ?? "USA")
  );

  // when options arrive, ensure selected is valid; if not, select best fallback
  useEffect(() => {
    if (countriesForPicker.length === 0) return;
    const codes = new Set(countriesForPicker.map((c) => c.code.toUpperCase()));
    if (!codes.has(country.toUpperCase())) {
      const prefer =
        (urlCountry && codes.has(urlCountry) && urlCountry) ||
        (product?.defaultCountryCode &&
          codes.has(product.defaultCountryCode.toUpperCase()) &&
          product.defaultCountryCode.toUpperCase()) ||
        countriesForPicker[0].code;
      setCountry(prefer);
      const u = new URL(window.location.href);
      u.searchParams.set("country", prefer);
      router.replace(u.pathname + "?" + u.searchParams.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesForPicker]);

  // keep URL in sync when user changes country
  function setCountryAndSync(c: string) {
    setCountry(c.toUpperCase());
    const u = new URL(window.location.href);
    u.searchParams.set("country", c.toUpperCase());
    router.replace(u.pathname + "?" + u.searchParams.toString());
  }

  // Series query (WB example; others can branch here later)
  const { data, isFetching, error } = useQuery<Series>({
    queryKey: ["series", product?.provider, product?.dataset, country],
    enabled: !!product?.dataset && !!country && product?.provider === "World Bank",
    staleTime: 60 * 60 * 1000,
    keepPreviousData: true,
    queryFn: async () => {
      const r = await fetch(
        `/api/series?provider=worldbank&dataset=${product!.dataset}&country=${country}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      if (!j.series) throw new Error(j.error || "No series");
      return j.series as Series;
    },
  });

  if (!product)
    return (
      <main className="mx-auto max-w-3xl p-6">Unknown dataset: {slug}</main>
    );

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      {/* Title */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <div className="text-sm text-muted-foreground">{product.provider}</div>
      </header>

      {/* Chart (top) */}
      <section>
        {error && (
          <div className="text-sm text-red-600">
            Error: {(error as Error).message}
          </div>
        )}
        {data && <SeriesChart series={data} />}
        {!data && !error && (
          <div className="h-80 rounded-xl border animate-pulse bg-gray-50 dark:bg-gray-900/40" />
        )}
        {isFetching && (
          <div className="mt-2 text-xs text-muted-foreground">Updating…</div>
        )}
      </section>

      {/* Options */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-sm mb-1">Country</div>
          <CountryCombobox
            value={country}
            onChange={setCountryAndSync}
            options={countriesForPicker}
          />
        </div>
      </section>

      {/* Description */}
      <section className="text-sm">
        Real GDP in constant 2015 US dollars. Annual values.
      </section>

      {/* Source badges / buttons */}
      <section className="flex flex-wrap gap-2 text-sm">
        {data?.source.url ? (
          <a href={data.source.url} target="_blank" rel="noreferrer">
            <span className="btn-sweep inline-flex h-8 items-center rounded-md bg-[hsl(var(--brand-600))] px-3 text-white hover:bg-[hsl(var(--brand-500))]">
              Source: World Bank API
            </span>
          </a>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md bg-secondary px-3">
            Source: World Bank
          </span>
        )}
        <span className="inline-flex h-8 items-center rounded-md bg-secondary px-3">
          Frequency: Annual
        </span>
        {data?.unit ? (
          <span className="inline-flex h-8 items-center rounded-md bg-secondary px-3">
            Unit: {data.unit}
          </span>
        ) : null}
      </section>
    </main>
  );
}

