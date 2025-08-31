"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";
import type { Series } from "@/lib/types";
import { getScale, fmtNumber, fmtScientific, type ScaleMode } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function parseTimeToNumber(t: string): number {
  if (/^\d{4}$/.test(t)) return Number(t);
  if (/^\d{4}-\d{2}$/.test(t)) return Date.UTC(Number(t.slice(0, 4)), Number(t.slice(5, 7)) - 1, 1);
  const q = t.match(/^(\d{4})Q([1-4])$/);
  if (q) return Date.UTC(Number(q[1]), (Number(q[2]) - 1) * 3, 1);
  const d = Date.parse(t);
  return Number.isFinite(d) ? d : Number(t);
}

function defaultXTickFormatter(n: number): string {
  if (n > 1800 && n < 2200) return String(n);
  const d = new Date(n);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return m === 1 ? String(y) : `${y}-${String(m).padStart(2, "0")}`;
}

type Props = {
  series: Series;
  color?: string;
  height?: number;
  showArea?: boolean;
  metricName?: string;
  unitLabel?: string;
  yPrefix?: string;
  ySuffix?: string;
  valueFormatter?: (v: number, sc: ReturnType<typeof getScale>, digits: number) => string;
  xParse?: (time: string) => number;
  xTickFormatter?: (x: number) => string;
  tooltipLabelFormatter?: (x: number | string) => string;
  controls?: { scale?: boolean; digits?: boolean };
  defaultScale?: ScaleMode;
  defaultDigits?: number;
};

export default function SeriesChart({
  series,
  color = "var(--chart-1)",
  height = 256,
  showArea = true,
  metricName,
  unitLabel,
  yPrefix,
  ySuffix,
  valueFormatter,
  xParse = parseTimeToNumber,
  xTickFormatter = defaultXTickFormatter,
  tooltipLabelFormatter,
  controls = { scale: true, digits: true },
  defaultScale = "sci",
  defaultDigits = 2,
}: Props) {
  const [scale, setScale] = useState<ScaleMode>(defaultScale);
  const [digits, setDigits] = useState(defaultDigits);

  useEffect(() => setScale(defaultScale), [defaultScale]);
  useEffect(() => setDigits(defaultDigits), [defaultDigits]);

  const raw = useMemo(
    () =>
      (series.points ?? [])
        .filter((p) => p.value !== null)
        .map((p) => ({ xLabel: p.time, x: xParse(p.time), y: p.value as number })),
    [series, xParse],
  );

  const dataMax = useMemo(() => Math.max(0, ...raw.map((d) => d.y)), [raw]);
  const sc = useMemo(() => getScale(scale, dataMax), [scale, dataMax]);

  const data = useMemo(() => {
    if (sc.mode === "sci") return raw.map((d) => ({ ...d, valueScaled: d.y }));
    return raw.map((d) => ({ ...d, valueScaled: d.y / sc.div }));
  }, [raw, sc]);

  const [xDomain, setXDomain] = useState<[number, number] | undefined>();
  const [refLeft, setRefLeft] = useState<number | null>(null);
  const [refRight, setRefRight] = useState<number | null>(null);
  const dragging = refLeft !== null && refRight !== null;

  useEffect(() => {
    if (!dragging) return;
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    const onUp = () => {
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
    window.addEventListener("mouseup", onUp, { once: true });
    return () => {
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

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

  const yDomain = useMemo(() => {
    const slice = xDomain ? data.filter((d) => d.x >= xDomain[0] && d.x <= xDomain[1]) : data;
    const vals = slice.map((d) => d.valueScaled);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (!isFinite(min) || !isFinite(max)) return undefined as any;
    const pad = (max - min) * 0.08;
    return [min - pad, max + pad] as [number, number];
  }, [data, xDomain]);

  const defaultValueFmt = (v: number) =>
    sc.mode === "sci"
      ? `${yPrefix ?? ""}${fmtScientific(v, digits)}${ySuffix ?? ""}`
      : `${yPrefix ?? ""}${fmtNumber(v, digits)}${sc.suffix}${ySuffix ?? ""}`;

  const vf = valueFormatter ?? defaultValueFmt;
  const yAxisLabel =
    unitLabel ??
    (sc.mode === "sci"
      ? `${series.unit ?? "Value"} (scientific)`
      : sc.suffix
      ? `${series.unit ?? "Value"} (${sc.suffix})`
      : series.unit ?? "Value");

  const metric = metricName ?? "Value";
  const labelFmt =
    tooltipLabelFormatter ??
    ((l: any) => (typeof l === "number" ? defaultXTickFormatter(l) : String(l)));

  const showControls = (controls.scale ?? true) || (controls.digits ?? true);

  const renderTooltip = (props: any) => {
    const { active, label, payload } = props ?? {};
    if (!active || !payload?.length) return null;
    const val = Number(payload[0].value);
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto",
            gap: "4px 10px",
            alignItems: "center",
          }}
        >
          <div style={{ opacity: 0.7 }}>Year</div>
          <div style={{ fontWeight: 600 }}>{labelFmt(label)}</div>
          <div style={{ opacity: 0.7 }}>{metric}</div>
          <div style={{ fontWeight: 600 }}>{vf(val)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {showControls && (
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {(controls.scale ?? true) && (
            <Select value={scale} onValueChange={(v: ScaleMode) => setScale(v)}>
              <SelectTrigger className="w-44 h-8">
                <SelectValue placeholder="Scale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Scale: Auto</SelectItem>
                <SelectItem value="raw">Raw</SelectItem>
                <SelectItem value="thousand">Thousands (K)</SelectItem>
                <SelectItem value="million">Millions (M)</SelectItem>
                <SelectItem value="billion">Billions (B)</SelectItem>
                <SelectItem value="trillion">Trillions (T)</SelectItem>
                <SelectItem value="sci">Scientific</SelectItem>
              </SelectContent>
            </Select>
          )}
          {(controls.digits ?? true) && (
            <Select value={String(digits)} onValueChange={(v) => setDigits(Number(v))}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Digits" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 digits</SelectItem>
                <SelectItem value="1">1 digit</SelectItem>
                <SelectItem value="2">2 digits</SelectItem>
                <SelectItem value="3">3 digits</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <div
        className={`w-full rounded-2xl border ${dragging ? "select-none cursor-col-resize" : ""}`}
        style={{ height }}
        onDoubleClick={resetZoom}
        onMouseDown={(e) => e.preventDefault()}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            key={series.id + scale}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onDoubleClick={resetZoom}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color as string} stopOpacity={0.16} />
                <stop offset="100%" stopColor={color as string} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.18} strokeDasharray="2 8" />

            <XAxis
              type="number"
              dataKey="x"
              domain={xDomain ?? ["dataMin", "dataMax"]}
              tick={{ fontSize: 11, opacity: 0.9 }}
              tickMargin={6}
              axisLine={false}
              tickLine={false}
              tickFormatter={xTickFormatter}
              allowDataOverflow
            />
            <YAxis
              tick={{ fontSize: 11, opacity: 0.9 }}
              tickMargin={6}
              axisLine={false}
              tickLine={false}
              width={72}
              domain={yDomain ?? ["auto", "auto"]}
              tickFormatter={(v) => vf(Number(v))}
              label={{
                value: yAxisLabel,
                position: "insideLeft",
                angle: -90,
                offset: 10,
                style: { fontSize: 11, opacity: 0.85 },
              }}
              allowDataOverflow
            />

            <Tooltip
              cursor={{ stroke: "currentColor", strokeOpacity: 0.25, strokeDasharray: "2 4" }}
              content={renderTooltip}
            />

            {showArea && (
              <Area
                type="monotone"
                dataKey="valueScaled"
                stroke="transparent"
                fill="url(#areaFill)"
                isAnimationActive
                animationDuration={380}
              />
            )}

            <Line
              type="monotone"
              dataKey="valueScaled"
              stroke={color as string}
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{
                r: 3,
                stroke: "white",
                strokeWidth: 2,
                fill: color as string,
                filter: "url(#chartGlow)",
              }}
              isAnimationActive
              animationDuration={400}
              filter="url(#chartGlow)"
            />

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

      <div className="text-[11px] text-muted-foreground">Tip: drag to zoom (release to apply), double-click to reset.</div>
    </div>
  );
}

