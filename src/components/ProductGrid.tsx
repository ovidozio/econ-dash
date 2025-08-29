import ProductCard from "./ProductCard";
import type { ProductMeta } from "@/lib/types";

export default function ProductGrid({ items }: { items: ProductMeta[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <ProductCard key={i.slug} item={i} />
      ))}
    </div>
  );
}

