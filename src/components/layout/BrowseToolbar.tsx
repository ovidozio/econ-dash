"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type BrowseToolbarProps = {
  total: number;
  q: string;
  setQ: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  onOpenMobileFilters: () => void;
};

export default function BrowseToolbar(props: BrowseToolbarProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-y py-3 mb-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm">
          <span className="font-medium">{props.total}</span> results
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Input
            value={props.q}
            onChange={(e) => props.setQ(e.target.value)}
            placeholder="Search…"
            className="w-64"
          />

          <div className="text-sm text-muted-foreground">Sort</div>
          <Select value={props.sort} onValueChange={props.setSort}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Relevance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="alpha">Alphabetical</SelectItem>
              <SelectItem value="source">Source</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" className="sm:hidden" onClick={props.onOpenMobileFilters}>
          Filters
        </Button>
      </div>
    </div>
  );
}

