"use client";

import Link from "next/link";
import NextImage from "next/image";
import { Card } from "@/components/ui/card";
import type { ProductMeta } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function ProductCard({ item }: { item: ProductMeta }) {
  const hasImg = !!item.image;

  return (
    <Link href={`/datasets/${item.slug}`} className="block">
      <Card className="hover:shadow-md transition overflow-hidden">
        {/* IMAGE */}
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
          {hasImg ? (
            <NextImage
              src={item.image as string}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-700))] to-[hsl(var(--brand-500))]">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/85 text-sm font-medium px-3 text-center">
                  {item.provider}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* TEXT */}
        <div className="p-4">
          <h3 className="font-semibold leading-tight">{item.name}</h3>
          {item.summary ? (
            <p
              className="mt-1 text-sm text-muted-foreground"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.summary}
            </p>
          ) : null}

          {/* Optional meta row */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <Badge variant="secondary">{item.provider}</Badge>
            {item.tags?.slice(0, 2).map((t) => (
              <Badge key={t} variant="outline">{t}</Badge>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}

