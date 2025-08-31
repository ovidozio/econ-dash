"use client";
import { X } from "lucide-react";

export default function FilterChips({
	sources, countries, onRemoveSource, onRemoveCountry, onClearAll,
}: {
	sources: string[];
	countries: { code: string; label: string }[];
	onRemoveSource: (s: string) => void;
	onRemoveCountry: (c: string) => void;
	onClearAll: () => void;
}) {
	const hasAny = sources.length > 0 || countries.length > 0;
	if (!hasAny) return null;

	return (
		<div className="flex flex-wrap items-center gap-2">
			{sources.map((s) => (
				<span key={`src-${s}`} className="chip">
					{s}
					<button className="ml-2 opacity-70 hover:opacity-100" onClick={() => onRemoveSource(s)} aria-label={`Remove ${s}`}>
						<X size={14} />
					</button>
				</span>
			))}
			{countries.map((c) => (
				<span key={`cty-${c.code}`} className="chip">
					{c.label}
					<button className="ml-2 opacity-70 hover:opacity-100" onClick={() => onRemoveCountry(c.code)} aria-label={`Remove ${c.label}`}>
						<X size={14} />
					</button>
				</span>
			))}
			<button onClick={onClearAll} className="chip btn-sweep">Clear all</button>
		</div>
	);
}

