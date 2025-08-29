"use client";

import { useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import type { Series } from "@/lib/types";
import {
  getScale,
  fmtNumber,
  fmtScientific,
  type ScaleMode,
} from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CurveKind = "monotone" | "linear";

export default function SeriesChart({ series }: { series: Series }) {
  const [scale, setScale] = useState<ScaleMode>("auto");
  const [digits, setDigits] = useState(2);
  const [curve, setCurve] = useState<CurveKind>("monotone");

  // ---- data
  const data = useMemo(
    () =>
      (series.points ?? [])
        .filter((p) => p.value !== null)
        .map((p) => ({ xLabel: p.time, x: Number(p.time), y: p.value as number })),
    [series]
  );

  const dataMax = useMemo(() => Math.max(0, ...data.map((d) => d.y)), [data]);
  const scaleInfo = useMemo(() => getScale(scale, dataMax), [scale, dataMax]);

  const scaled = useMemo(() => {
    if (scaleInfo.mode === "sci") return data.map((d) => ({ ...d, valueScaled: d.y }));
    return data.map((d) => ({ ...d, valueScaled: d.y / scaleInfo.div }));
  }, [data, scaleInfo]);

  // ---- zoom state (x domain in year numbers)
  const [xDomain, setXDomain] = useState<[number, number] | undefined>(undefined);
  const [refLeft, setRefLeft] = useState<number | null>(null);
  const [refRight, setRefRight] = useState<number | null>(null);
  const dragging = refLeft !== null && refRight !== null;

  const resetZoom = () => {
    setXDomain(undefined);
    setRefLeft(null);
    setRefRight(null);
  };

  const onDown = (e: any) => {
    if (e?.activeLabel == null) return;
    setRefLeft(Number(e.activeLabel));
    setRefRight(Number(e.activeLabel));
  };
  const onMove = (e: any) => {
    if (refLeft === null) return;
    if (e?.activeLabel == null) return;
    setRefRight(Number(e.activeLabel));
  };
  const onUp = () => {
    if (refLeft === null || refRight === null) return;
    const [a, b] = [refLeft, refRight].sort((m, n) => m - n);
    if (Math.abs(a - b) < 1) {
      // tiny drag → treat as click, do nothing
      setRefLeft(null);
      setRefRight(null);
      return;
    }
    setXDomain([a, b]);
    setRefLeft(null);
    setRefRight(null);
  };

  // recompute yDomain for current xDomain for nicer scaling
  const yDomain = useMemo(() => {
    const slice = xDomain
      ? scaled.filter((d) => d.x >= xDomain[0] && d.x <= xDomain[1])
      : scaled;
    const vals = slice.map((d) => d.valueScaled);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (!isFinite(min) || !isFinite(max)) return undefined as any;
    const pad = (max - min) * 0.08;
    return [min - pad, max + pad] as [number, number];
  }, [scaled, xDomain]);

  const tickFormatter = (v: number) =>
    scaleInfo.mode === "sci"
      ? `$${fmtScientific(v, digits)}`
      : `$${fmtNumber(v, digits)}${scaleInfo.suffix}`;

  const yAxisLabel =
    scaleInfo.mode === "sci"
      ? "USD (scientific)"
      : scaleInfo.suffix
      ? `USD (${scaleInfo.suffix})`
      : "USD";

  return (
    <div className="space-y-3">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <Select value={curve} onValueChange={(v: CurveKind) => setCurve(v)}>
          <SelectTrigger className="w-36 h-8"><SelectValue placeholder="Curve" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monotone">Curve: Smooth</SelectItem>
            <SelectItem value="linear">Curve: Linear</SelectItem>
          </SelectContent>
        </Select>

        <Select value={scale} onValueChange={(v: ScaleMode) => setScale(v)}>
          <SelectTrigger className="w-44 h-8"><SelectValue placeholder="Scale" /></SelectTrigger>
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

        <Select value={String(digits)} onValueChange={(v) => setDigits(Number(v))}>
          <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Digits" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0 digits</SelectItem>
            <SelectItem value="1">1 digit</SelectItem>
            <SelectItem value="2">2 digits</SelectItem>
            <SelectItem value="3">3 digits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* chart */}
      <div className="h-80 w-full rounded-xl border">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={scaled}
            key={series.id + scale + curve}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onDoubleClick={resetZoom}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              domain={xDomain ?? ["dataMin", "dataMax"]}
              tick={{ fontSize: 12 }}
              tickFormatter={(n) => String(n)}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={yDomain ?? ["auto", "auto"]}
              tickFormatter={tickFormatter}
              width={90}
              label={{ value: yAxisLabel, position: "insideLeft", angle: -90, offset: 10 }}
            />
            <Tooltip
              formatter={(val) => {
                const v = Number(val);
                const out =
                  scaleInfo.mode === "sci"
                    ? `$${fmtScientific(v, digits)}`
                    : `$${fmtNumber(v, digits)}${scaleInfo.suffix}`;
                return [out, "GDP"];
              }}
              labelFormatter={(l) => `Year: ${String(l)}`}
            />
            <Line
              name="GDP"
              type={curve}
              dataKey="valueScaled"
              stroke={`hsl(var(--chart-1))`}
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={400}
            />
            {dragging && refLeft !== null && refRight !== null ? (
              <ReferenceArea
                x1={Math.min(refLeft, refRight)}
                x2={Math.max(refLeft, refRight)}
                strokeOpacity={0.2}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-muted-foreground">
        Tip: drag to zoom, double-click to reset. Curve “Smooth” uses a monotone cubic spline; “Linear” draws straight segments.
      </div>
    </div>
  );
}

