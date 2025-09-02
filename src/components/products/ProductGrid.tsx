"use client";

import ProductCard from "./ProductCard";
import type { ProductMeta } from "@/lib/types";

export default function ProductGrid({ items }: { items: ProductMeta[] }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
			{items.map((it) => (
				<div key={it.slug} className="h-full">
					<ProductCard item={it} />
				</div>
			))}
		</div>
	);
}

