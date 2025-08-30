"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductMeta } from "@/lib/types";

export default function ProductCard({ item }: { item: ProductMeta }) {
  const isLogo =
    item.imageFit === "contain" ||
    (item.image && item.image.toLowerCase().endsWith(".svg"));

  const imgHeights = "h-36 sm:h-40 lg:h-44";
  const scale = isLogo ? item.logoScale ?? 1 : 1;

  return (
    <Link href={`/datasets/${item.slug}`} className="block" aria-label={item.name}>
      <Card className="group card-sweep h-[380px] sm:h-[400px] lg:h-[420px] flex flex-col overflow-hidden hover:shadow-md transition"
            style={{ ["--sweep-ms" as any]: "950ms", ["--ring-w" as any]: "2px" }}
            >
        {/* Image band — square corners (no radius inheritance, no negative margin) */}
        <div
          className={[
            "card-img",
            "relative w-full",
            imgHeights,
            "overflow-hidden",
            "border-b border-black/10 dark:border-white/10",
            isLogo ? "bg-white dark:bg-white" : "",
          ].join(" ")}
        >
          {item.image ? (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={
                isLogo
                  ? { transform: `scale(${scale})`, transformOrigin: "center" }
                  : undefined
              }
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                className={isLogo ? "object-contain" : "object-cover"}
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                priority={false}
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-700))] to-[hsl(var(--brand-500))]" />
          )}

          {!isLogo && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col gap-2">
          <h3
            className="font-semibold leading-tight"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.name}
          </h3>

          {item.summary ? (
            <p
              className="text-sm text-muted-foreground"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.summary}
            </p>
          ) : (
            <div className="h-5" />
          )}

          <div className="mt-auto flex items-center gap-2 text-xs">
            <Badge variant="secondary">{item.provider}</Badge>
            {item.tags?.slice(0, 2).map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}

