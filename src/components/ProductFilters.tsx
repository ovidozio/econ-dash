"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type CountryOption = { label: string; code: string };
export type FilterState = { sources: Set<string>; countries: Set<string> };

export default function ProductFilters({
  filter, setFilter, allSources, allCountries,
}: {
  filter: FilterState;
  setFilter: (next: FilterState) => void;
  allSources: string[];
  allCountries: CountryOption[];
}) {
  const srcList = useMemo(() => [...allSources].sort(), [allSources]);
  const ctyList = useMemo(
    () => [...allCountries].sort((a, b) => a.label.localeCompare(b.label)),
    [allCountries]
  );

  const toggle = (group: "sources" | "countries", value: string) => {
    const next = new Set(filter[group]);
    next.has(value) ? next.delete(value) : next.add(value);
    setFilter({ ...filter, [group]: next });
  };

  return (
    <aside className="space-y-4">
      <div className="rounded-lg border p-3">
        <div className="text-sm font-medium mb-2">Source</div>
        <div className="space-y-2">
          {srcList.map((s) => {
            const id = `src-${s}`;
            const checked = filter.sources.has(s);
            return (
              <label key={s} className="flex items-center gap-2 text-sm">
                <Checkbox id={id} checked={checked} onCheckedChange={() => toggle("sources", s)} />
                <Label htmlFor={id} className="cursor-pointer">{s}</Label>
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <div className="text-sm font-medium mb-2">Country</div>
        <div className="max-h-56 overflow-auto pr-1 space-y-2">
          {ctyList.map((c) => {
            const id = `cty-${c.code}`;
            const checked = filter.countries.has(c.code);
            return (
              <label key={c.code} className="flex items-center gap-2 text-sm">
                <Checkbox id={id} checked={checked} onCheckedChange={() => toggle("countries", c.code)} />
                <Label htmlFor={id} className="cursor-pointer">{c.label}</Label>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

