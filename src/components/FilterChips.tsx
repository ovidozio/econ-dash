"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FilterChips({
  sources = [],
  countries = [],
  onClearAll,
}: {
  sources?: string[];
  countries?: string[];
  onClearAll: () => void;
}) {
  const hasAny = (sources.length > 0) || (countries.length > 0);
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {sources.map((s) => (
        <Badge key={`source-${s}`} variant="outline" className="flex items-center gap-1">
          {s}
          <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100" />
        </Badge>
      ))}

      {countries.map((c) => (
        <Badge key={`country-${c}`} variant="outline" className="flex items-center gap-1">
          {c}
          <X className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100" />
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  );
}

