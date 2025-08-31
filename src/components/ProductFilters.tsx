"use client";

import * as React from "react";
import CountryCombobox from "@/components/CountryCombobox";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CountryOption } from "@/lib/types";

type VariantOption = { value: string; label: string };

type Props = {
  className?: string;

  /** COUNTRY (optional) */
  countryOptions?: CountryOption[];
  country?: string | null;
  onCountryChange?: (code: string) => void;

  /** VARIANT (optional), e.g. "gross" | "perCapita" */
  variantOptions?: VariantOption[];
  variant?: string | null;
  onVariantChange?: (value: string) => void;
};

export default function ProductFilters({
  className,
  countryOptions,
  country,
  onCountryChange,
  variantOptions,
  variant,
  onVariantChange,
}: Props) {
  const hasCountry = Array.isArray(countryOptions) && countryOptions.length > 0 && !!onCountryChange;
  const hasVariant = Array.isArray(variantOptions) && variantOptions.length > 0 && !!onVariantChange;

  // If neither control is present, render nothing
  if (!hasCountry && !hasVariant) return null;

  return (
    <section className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {hasCountry && (
        <div className="min-w-0">
          <div className="text-sm mb-1">Country</div>
          <CountryCombobox
            value={country ?? ""}
            onChange={(c) => onCountryChange?.(c)}
            options={countryOptions!}
          />
        </div>
      )}

      {hasVariant && (
        <div className="min-w-0">
          <div className="text-sm mb-1">Variant</div>
          <Select
            value={variant ?? undefined}
            onValueChange={(v) => onVariantChange?.(v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Choose variant" />
            </SelectTrigger>
            <SelectContent>
              {variantOptions!.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </section>
  );
}

