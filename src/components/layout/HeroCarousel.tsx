"use client";

import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Slide = {
  title: string;
  text: string;
  img: string; // e.g. "/images/slide1.jpg"
  cta?: { label: string; href: string };
  overlayClassName?: string; // optional extra overlay
};

type Props = {
  slides: Slide[];
  auto?: boolean;      // default: false (no timer)
  intervalMs?: number; // used when auto=true
  slideMs?: number;    // default: 500
  className?: string;
};

export default function HeroCarousel({
  slides,
  auto = false,
  intervalMs = 7000,
  slideMs = 500,
  className,
}: Props) {
  const [i, setI] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const count = slides.length;

  // Preload images (safe on client)
  useEffect(() => {
    if (typeof window === "undefined") return;
    slides.forEach((s) => {
      const img = new window.Image();
      img.src = s.img;
    });
  }, [slides]);

  // optional auto-advance
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!auto || count <= 1) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => go(1), intervalMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, count, intervalMs]);

  const go = (dir: -1 | 1) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setI((prev) => (prev + dir + count) % count);
    window.setTimeout(() => setIsAnimating(false), slideMs);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => go(1), intervalMs);
    }
  };

  // touch swipe
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 40) go(-1);
    if (dx < -40) go(1);
    touchStartX.current = null;
  };

  if (count === 0) return null;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-none md:rounded-xl",
        className
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Track */}
      <div
        className="flex"
        style={{
          transform: `translateX(-${i * 100}%)`,
          transition: `transform ${slideMs}ms ease-out`,
          willChange: "transform",
        }}
      >
        {slides.map((s, idx) => (
          <div
            key={idx}
            className="relative min-w-full flex-shrink-0"
            style={{ aspectRatio: "16 / 9" }}
          >
            <NextImage
              src={s.img}
              alt={s.title}
              fill
              priority={idx === 0}
              className="object-cover"
              sizes="100vw"
            />
            {/* darken enough for readability */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/20",
                s.overlayClassName
              )}
            />
            {/* Centered content */}
            <div className="absolute inset-0 grid place-items-center px-4">
              <div className="max-w-3xl text-center text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                  {s.title}
                </h1>
                <p className="mt-3 text-base md:text-lg opacity-95">
                  {s.text}
                </p>
                {s.cta && (
                  <a
                    href={s.cta.href}
                    className="mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white
                               bg-[hsl(var(--brand-600))] hover:bg-[hsl(var(--brand-500))] transition-colors"
                  >
                    {s.cta.label}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="appearance-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 md:p-3 text-white shadow
                       hover:bg-black/70 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(1)}
            className="appearance-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 md:p-3 text-white shadow
                       hover:bg-black/70 transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => !isAnimating && setI(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                idx === i ? "bg-white" : "bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

