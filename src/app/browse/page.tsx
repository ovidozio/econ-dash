"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import BrowseToolbar from "@/components/BrowseToolbar";
import ProductFilters, { type FilterState, type CountryOption } from "@/components/ProductFilters";
import ProductGrid from "@/components/ProductGrid";
import { Button } from "@/components/ui/button";
import { CATALOG } from "@/lib/products";

export default function BrowsePage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("relevance");
  const [filter, setFilter] = useState<FilterState>({
    sources: new Set<string>(),
    countries: new Set<string>(),
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // runtime World Bank countries (only if needed)
  const hasWB = CATALOG.some(p => p.provider === "World Bank");
  const { data: wbCountries } = useQuery<CountryOption[]>({
    queryKey: ["countries", "worldbank"],
    enabled: hasWB,
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const r = await fetch("/api/countries?provider=worldbank", { cache: "no-store" });
      const j = await r.json();
      if (!j.countries) throw new Error(j.error || "No countries");
      return j.countries as CountryOption[];
    },
  });

  // Facets
  const allSources = useMemo(
    () => Array.from(new Set(CATALOG.map((p) => p.provider))).sort(),
    []
  );

  // Combine static + WB countries into a single pick list
  const allCountries = useMemo<CountryOption[]>(() => {
    const map = new Map<string, CountryOption>();
    // static lists defined on some products
    for (const p of CATALOG) {
      const list = p.staticCountries ?? [];
      for (const c of list) if (!map.has(c.code)) map.set(c.code, c);
    }
    // WB countries if present
    if (wbCountries) for (const c of wbCountries) if (!map.has(c.code)) map.set(c.code, c);
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [wbCountries]);

  // Helper: does a product support a given country code?
  function supportsCountry(prod: (typeof CATALOG)[number], code: string) {
    if (prod.countrySource === "static") {
      return !!prod.staticCountries?.some((c) => c.code.toUpperCase() === code.toUpperCase());
    }
    if (prod.countrySource === "worldbank") {
      // Treat as broadly supported; (exact availability is dataset-specific)
      return true;
    }
    return false;
  }

  // Filter/search/sort
  const visible = useMemo(() => {
    let list = CATALOG.filter((i) => {
      const matchQ =
        q.trim() === "" ||
        i.name.toLowerCase().includes(q.toLowerCase()) ||
        i.summary?.toLowerCase().includes(q.toLowerCase());
      const matchSrc =
        filter.sources.size === 0 || filter.sources.has(i.provider);

      const matchCty =
        filter.countries.size === 0 ||
        Array.from(filter.countries).some((code) => supportsCountry(i, code));

      return matchQ && matchSrc && matchCty;
    });

    if (sort === "alpha")
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "source")
      list = [...list].sort((a, b) => a.provider.localeCompare(b.provider));
    return list;
  }, [q, sort, filter]);

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-3 text-sm text-muted-foreground">Home › Datasets</div>
      <h1 className="text-2xl font-semibold mb-2">Datasets</h1>

      {/* Mobile toolbar (opens sheet) */}
      <div className="sm:hidden">
        <BrowseToolbar
          total={visible.length}
          q={q}
          setQ={setQ}
          sort={sort}
          setSort={setSort}
          onOpenMobileFilters={() => setMobileOpen(true)}
        />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[85vw] sm:w-[360px]">
          <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
          <div className="mt-4">
            <ProductFilters
              filter={filter}
              setFilter={setFilter}
              allSources={allSources}
              allCountries={allCountries}
            />
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setFilter({ sources: new Set(), countries: new Set() })}
            >
              Clear filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop toolbar */}
      <div className="hidden sm:block">
        <BrowseToolbar
          total={visible.length}
          q={q}
          setQ={setQ}
          sort={sort}
          setSort={setSort}
          onOpenMobileFilters={() => {}}
        />
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 sm:grid-cols-[260px_minmax(0,1fr)] gap-6">
        <div className="hidden sm:block">
          <div className="sticky top-4">
            <ProductFilters
              filter={filter}
              setFilter={setFilter}
              allSources={allSources}
              allCountries={allCountries}
            />
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setFilter({ sources: new Set(), countries: new Set() })}
            >
              Clear filters
            </Button>
          </div>
        </div>

        <div>
          <ProductGrid items={visible} />
          {/* pagination parody */}
          {/* <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            Page 1 of 5
          </div> */}
        </div>
      </div>
    </main>
  );
}

