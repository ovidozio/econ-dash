"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type FilterState = {
	sources: Set<string>;
	countries: Set<string>; // ISO3
};

export type CountryOption = { code: string; label: string };

export default function ProductFilters({
	filter,
	setFilter,
	allSources,
	allCountries,
}: {
	filter: FilterState;
	setFilter: (f: FilterState) => void;
	allSources: string[];
	allCountries: CountryOption[];
}) {
	/* ---------- SOURCE facet (simple checkboxes) ---------- */
	function toggleSource(s: string) {
		const next = new Set(filter.sources);
		next.has(s) ? next.delete(s) : next.add(s);
		setFilter({ ...filter, sources: next });
	}

	/* ---------- COUNTRY facet (combobox → selected list) ---------- */
	const byCode = useMemo(() => {
		const m = new Map<string, CountryOption>();
		for (const c of allCountries) m.set(c.code.toUpperCase(), c);
		return m;
	}, [allCountries]);

	const selected = useMemo(() => {
		const arr = Array.from(filter.countries).map((code) => byCode.get(code) ?? { code, label: code });
		return arr.sort((a, b) => a.label.localeCompare(b.label));
	}, [filter.countries, byCode]);

	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const inputRef = useRef<HTMLInputElement | null>(null);

	const choices = useMemo(() => {
		const ql = q.trim().toLowerCase();
		return allCountries
			.filter((c) => !filter.countries.has(c.code))
			.filter((c) => {
				if (!ql) return true;
				return c.label.toLowerCase().includes(ql) || c.code.toLowerCase().includes(ql);
			})
			.slice(0, 200);
	}, [allCountries, filter.countries, q]);

	function addCountry(code: string) {
		const next = new Set(filter.countries);
		next.add(code.toUpperCase());
		setFilter({ ...filter, countries: next });
		setQ("");
		setOpen(false);
	}
	function removeCountry(code: string) {
		const next = new Set(filter.countries);
		next.delete(code.toUpperCase());
		setFilter({ ...filter, countries: next });
	}
	function clearCountries() {
		setFilter({ ...filter, countries: new Set() });
	}

	// Enter picks first match; Esc closes
	useEffect(() => {
		const el = inputRef.current;
		if (!el) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Enter" && choices.length > 0) {
				e.preventDefault();
				addCountry(choices[0].code);
			}
			if (e.key === "Escape") setOpen(false);
		};
		el.addEventListener("keydown", onKey);
		return () => el.removeEventListener("keydown", onKey);
	}, [choices]);

	return (
		<div className="space-y-6">
			{/* SOURCE facet */}
			<div>
				<h3 className="text-sm font-medium mb-2">Source</h3>
				<div className="space-y-1">
					{allSources.map((s) => {
						const checked = filter.sources.has(s);
						return (
							<label key={s} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer">
								<input
									type="checkbox"
									checked={checked}
									onChange={() => toggleSource(s)}
									className="h-4 w-4 rounded border-muted-foreground/30"
								/>
								<span className="text-sm">{s}</span>
							</label>
						);
					})}
				</div>
			</div>

			{/* COUNTRY facet */}
			<div>
				<h3 className="text-sm font-medium mb-2">Country</h3>

				{/* Input-styled trigger */}
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							aria-label="Select country"
							className="w-full h-9 rounded-md border bg-muted/40 px-2 text-left text-sm hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onClick={() => setOpen(true)}
						>
							<span className={selected.length ? "text-foreground/80" : "text-muted-foreground"}>
								{selected.length ? "Add another country…" : "Select country…"}
							</span>
						</button>
					</PopoverTrigger>
					<PopoverContent
						className="p-2 w-[320px] sm:w-[360px] z-50"
						side="bottom"
						align="start"
						sideOffset={6}
						/* keep it from flipping up */
						avoidCollisions={false}
					>
						<Input
							ref={inputRef}
							value={q}
							onChange={(e) => setQ(e.target.value)}
							autoFocus
							placeholder="Search by name or ISO code…"
							className="h-8 mb-2"
						/>
						<div className="max-h-64 overflow-auto rounded-md border bg-popover">
							<ul className="divide-y">
								{choices.map((c) => (
									<li key={c.code}>
										<button
											className="w-full px-2 py-1.5 text-left hover:bg-accent text-sm"
											onClick={() => addCountry(c.code)}
										>
											<span className="font-medium">{c.label}</span>
											<span className="ml-2 text-xs text-muted-foreground">{c.code}</span>
										</button>
									</li>
								))}
								{choices.length === 0 && (
									<li className="px-2 py-2 text-sm text-muted-foreground">No matches.</li>
								)}
							</ul>
						</div>
					</PopoverContent>
				</Popover>

				{/* Selected list appears only after first selection */}
				{selected.length > 0 && (
					<div className="mt-3">
						<div className="mb-1 flex items-center justify-between">
							<span className="text-xs uppercase tracking-wide text-muted-foreground">Selected</span>
							<button
								onClick={clearCountries}
								className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
								disabled={selected.length === 0}
							>
								Clear
							</button>
						</div>
						<div className="max-h-40 overflow-auto rounded-md border">
							<ul className="divide-y">
								{selected.map((c) => (
									<li key={c.code} className="px-2 py-1.5">
										<label className="flex items-center gap-2">
											<input
												type="checkbox"
												checked
												onChange={() => removeCountry(c.code)}
												className="h-4 w-4 rounded border-muted-foreground/30"
											/>
											<span className="text-sm">{c.label}</span>
											<span className="ml-auto text-xs text-muted-foreground">{c.code}</span>
										</label>
									</li>
								))}
							</ul>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

