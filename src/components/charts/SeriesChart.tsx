"use client";

import { useId, useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";
import UnitControls from "@/components/controls/UnitControls";
import { fmtNumber, fmtScientific, getScale } from "@/lib/format";
import type { Series } from "@/lib/types";

// -------- flexible point readers (works with {year,value} | {t,v} | {date} | {time}) -----
function getXMillis(p: any): number {
  if (p?.date) {
    const ms = Date.parse(p.date);
    if (!Number.isNaN(ms)) return ms;
  }
  if (p?.t && Number.isFinite(Number(p.t))) {
    const tnum = Number(p.t);
    if (tnum >= 1000 && tnum <= 9999) return new Date(tnum, 0, 1).getTime();
    return tnum;
  }
  if (p?.year && Number.isFinite(Number(p.year))) {
    return new Date(Number(p.year), 0, 1).getTime();
  }
  if (p?.time) {
    const t = String(p.time);
    if (/^\d{4}$/.test(t)) return new Date(Number(t), 0, 1).getTime();
    if (/^\d{4}-\d{2}$/.test(t)) return Date.UTC(Number(t.slice(0,4)), Number(t.slice(5,7))-1, 1);
    const q = t.match(/^(\d{4})Q([1-4])$/);
    if (q) return Date.UTC(Number(q[1]), (Number(q[2])-1)*3, 1);
    const ms = Date.parse(t);
    if (!Number.isNaN(ms)) return ms;
  }
  return NaN;
}
function getY(p: any): number | null {
  if (p?.v !== undefined) return p.v == null ? null : Number(p.v);
  if (p?.value !== undefined) return p.value == null ? null : Number(p.value);
  return null;
}
function formatX(ms: number, freq?: string) {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  if (freq === "M" || (m !== 1 && m >= 1 && m <= 12)) {
    return `${y}-${String(m).padStart(2, "0")}`;
  }
  return String(y);
}

// -------- detect dark mode (supports Tailwind 'dark' class & prefers-color-scheme) -------
function useIsDark(): boolean {
  const initial =
    typeof document !== "undefined" &&
    (document.documentElement.classList.contains("dark") ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches));

  const [isDark, setIsDark] = useState<boolean>(!!initial);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const update = () => {
      const byClass = document.documentElement.classList.contains("dark");
      const byMedia = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(Boolean(byClass || byMedia));
    };

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMedia = () => update();
    mq?.addEventListener?.("change", onMedia);

    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    update();
    return () => {
      mq?.removeEventListener?.("change", onMedia);
      mo.disconnect();
    };
  }, []);

  return isDark;
}

// -----------------------------------------------------------------------------------------

export default function SeriesChart(props: {
  series: Series;
  metricName?: string;
  unitLabel?: string;
  yPrefix?: string;
  ySuffix?: string;
  color?: string;            // line color (theme var ok)
  showArea?: boolean;        // show under-fill (glow in dark; solid in light)
  allowedScales?: Array<"raw" | "thousand" | "million" | "billion" | "trillion" | "sci">;
  digitsOptions?: number[];
  defaultScale?: "raw" | "thousand" | "million" | "billion" | "trillion" | "sci";
  defaultDigits?: number;
  height?: number;
}) {
  const {
    series,
    unitLabel,
    yPrefix,
    ySuffix,
    color = "var(--series-1)",
    showArea = true,
    allowedScales,
    digitsOptions,
    defaultScale = "sci",
    defaultDigits = 2,
    height = 360,
  } = props;

  const isDark = useIsDark();
  const uid = useId();
  const gradId = `areaFill-${uid}`;
  const blurId = `chartGlow-${uid}`;

  const line = series?.series?.[0] ?? { key: "Value", points: [] };
  const freq = series?.frequency;

  // ------------------------------- controls ----------------------------------
  const [scale, setScale] = useState(defaultScale);
  const [digits, setDigits] = useState(defaultDigits);
  useEffect(() => setScale(defaultScale), [defaultScale]);
  useEffect(() => setDigits(defaultDigits), [defaultDigits]);

  // ------------------------------- data prep ---------------------------------
  const raw = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (const p of line.points || []) {
      const x = getXMillis(p);
      const y = getY(p);
      if (!Number.isNaN(x) && y != null) out.push({ x, y });
    }
    out.sort((a, b) => a.x - b.x);
    return out;
  }, [line.points]);

  const maxAbs = useMemo(
    () => (raw.length ? Math.max(...raw.map((d) => Math.abs(d.y))) : 0),
    [raw]
  );
  const sc = getScale(scale, maxAbs);

  const data = useMemo(
    () =>
      raw.map((d) => ({
        x: d.x,
        valueScaled: scale === "sci" ? d.y : d.y / sc.div,
      })),
    [raw, scale, sc]
  );

  const yLabel =
    unitLabel ??
    (sc.mode === "sci"
      ? `${series.unit ?? "Value"} (scientific)`
      : sc.suffix
      ? `${series.unit ?? "Value"} (${sc.suffix})`
      : series.unit ?? "Value");

  const vf = (v?: number | null) =>
    v == null
      ? "—"
      : scale === "sci"
      ? `${yPrefix ?? ""}${fmtScientific(v, digits)}${ySuffix ?? ""}`
      : `${yPrefix ?? ""}${fmtNumber(v, digits)}${sc.suffix || ""}${ySuffix ?? ""}`;

  // ------------------------------- zoom band ---------------------------------
  const [xDomain, setXDomain] = useState<[number, number] | undefined>(undefined);
  const [refLeft, setRefLeft] = useState<number | null>(null);
  const [refRight, setRefRight] = useState<number | null>(null);
  const dragging = refLeft !== null && refRight !== null;

  const onDown = (e: any) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (e?.activeLabel == null) return;
    const n = Number(e.activeLabel);
    setRefLeft(n);
    setRefRight(n);
  };
  const onMove = (e: any) => {
    if (refLeft === null) return;
    if (e?.activeLabel == null) return;
    setRefRight(Number(e.activeLabel));
  };
  const resetZoom = () => {
    setXDomain(undefined);
    setRefLeft(null);
    setRefRight(null);
  };

  useEffect(() => {
    const onUp = () => {
      if (refLeft === null || refRight === null) return;
      const [a, b] = [refLeft, refRight].sort((m, n) => m - n);
      if (Math.abs(a - b) >= 1) setXDomain([a, b]);
      setRefLeft(null);
      setRefRight(null);
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [refLeft, refRight]);

  useEffect(() => {
    if (!dragging) return;
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    const cleanup = () => {
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
    window.addEventListener("mouseup", cleanup, { once: true });
    return () => cleanup();
  }, [dragging]);

  const yDomain = useMemo(() => {
    const slice = xDomain
      ? data.filter((d) => d.x >= xDomain[0] && d.x <= xDomain[1])
      : data;
    const vals = slice.map((d) => d.valueScaled);
    if (!vals.length) return undefined as any;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min || Math.abs(max) || 1) * 0.08;
    return [min - pad, max + pad] as [number, number];
  }, [data, xDomain]);

  // ---------------------------------- tooltip --------------------------------
  const CustomTooltip = ({ active, label, payload }: any) => {
    if (!active || !payload?.length) return null;
    const v = Number(payload[0]?.value);
    return (
      <div
        style={{
          background: "var(--popover)",
          color: "var(--popover-foreground)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "8px 10px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          fontSize: 12,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "4px 10px" }}>
          <div style={{ opacity: 0.7 }}>Period</div>
          <div style={{ fontWeight: 600 }}>{typeof label === "number" ? formatX(label, freq) : String(label)}</div>
          <div style={{ opacity: 0.7 }}>{line.key}</div>
          <div style={{ fontWeight: 600 }}>{vf(v)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-3">
      <UnitControls
        className="mb-1 flex justify-end"
        allowedScales={allowedScales}
        digitsOptions={digitsOptions}
        scale={scale}
        digits={digits}
        onScale={setScale}
        onDigits={setDigits}
      />

      <div
        className={`w-full rounded-2xl border ${dragging ? "select-none cursor-col-resize" : ""}`}
        style={{ height }}
        onDoubleClick={resetZoom}
        onMouseDown={(e) => e.preventDefault()}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onDoubleClick={resetZoom}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            {/* --- theme-aware under-fill defs --- */}
            <defs>
              {/* Dark: gradient that fades downward + soft blur */}
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={color as string} stopOpacity={0.18} />
                <stop offset="55%" stopColor={color as string} stopOpacity={0.08} />
                <stop offset="100%" stopColor={color as string} stopOpacity={0} />
              </linearGradient>
              <filter id={blurId} x="-10%" y="-10%" width="120%" height="140%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>

            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.18} strokeDasharray="2 8" />

            <XAxis
              dataKey="x"
              type="number"
              domain={xDomain ?? ["dataMin", "dataMax"]}
              tickFormatter={(ms) => formatX(Number(ms), freq)}
              tick={{ fontSize: 11, opacity: 0.9 }}
              tickMargin={6}
              axisLine={false}
              tickLine={false}
              allowDataOverflow
            />
            <YAxis
              tick={{ fontSize: 11, opacity: 0.9 }}
              tickMargin={6}
              axisLine={false}
              tickLine={false}
              width={84}
              domain={yDomain ?? ["auto", "auto"]}
              tickFormatter={(v) => vf(Number(v))}
              label={{
                value: yLabel,
                position: "insideLeft",
                angle: -90,
                offset: 10,
                style: { fontSize: 11, opacity: 0.85 },
              }}
              allowDataOverflow
            />
            <Tooltip
              cursor={{ stroke: "currentColor", strokeOpacity: 0.25, strokeDasharray: "2 4" }}
              content={<CustomTooltip />}
            />

            {/* Under-fill: glow in dark, solid crisp in light */}
            {showArea && (
              <Area
                type="monotone"
                dataKey="valueScaled"
                stroke="transparent"
                fill={isDark ? `url(#${gradId})` : (color as string)}
                fillOpacity={isDark ? 1 : 0.12}
                filter={isDark ? `url(#${blurId})` : undefined}
                isAnimationActive
                animationDuration={360}
                dot={false}
              />
            )}

            {/* crisp line */}
            <Line
              type="monotone"
              dataKey="valueScaled"
              stroke={color as string}
              strokeWidth={isDark ? 1.8 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              isAnimationActive
              animationDuration={380}
            />

            {/* drag-to-zoom band */}
            {dragging && refLeft !== null && refRight !== null ? (
              <ReferenceArea
                x1={Math.min(refLeft, refRight)}
                x2={Math.max(refLeft, refRight)}
                stroke={color as string}
                strokeOpacity={0.25}
                fill={color as string}
                fillOpacity={0.08}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-muted-foreground">
        Tip: drag to zoom (release to apply), double-click to reset.
      </div>
    </div>
  );
}

