"use client";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import UnitControls from "@/components/controls/UnitControls";
import { getScale, fmtNumber, fmtScientific, type ScaleMode } from "@/lib/format";

type Pt = { time: string; value: number | null };
type LineSeries = { key: string; points: Pt[] };

// Palette is driven by CSS variables so theme controls colors
const SERIES_VARS = [
  "--series-1", "--series-2", "--series-3", "--series-4",
  "--series-5", "--series-6", "--series-7", "--series-8",
];

export default function MultiSeriesChart(props: {
  series: { unit?: string; series: LineSeries[] };
  metricName?: string;
  unitLabel?: string;
  // NEW: product-driven units/options
  allowedScales?: ScaleMode[];
  digitsOptions?: number[];
  defaultScale?: ScaleMode;
  defaultDigits?: number;

  height?: number;
}) {
  const {
    series,
    unitLabel,
    allowedScales,
    digitsOptions,
    defaultScale = "sci",
    defaultDigits = 2,
    height = 320,
  } = props;

  const [scale, setScale] = useState<ScaleMode>(defaultScale);
  const [digits, setDigits] = useState<number>(defaultDigits);

  const lines = series.series ?? [];
  const allPoints = lines.flatMap(s => s.points).filter(p => p.value !== null) as {time:string,value:number}[];
  const year = (t: string) => parseInt(String(t).slice(0,4), 10);
  const maxVal = allPoints.length ? Math.max(...allPoints.map(p => Math.abs(Number(p.value)))) : 0;
  const sc = getScale(scale, maxVal);

  // Sort lines by latest value desc → consistent order & tooltip
  const linesSorted = useMemo(() => {
    const lastVal = (s: LineSeries) => {
      for (let i = s.points.length - 1; i >= 0; i--) {
        const v = s.points[i]?.value;
        if (v !== null && v !== undefined) return Number(v);
      }
      return -Infinity;
    };
    return [...lines].sort((a, b) => lastVal(b) - lastVal(a));
  }, [lines]);

  const keys = linesSorted.map(s => s.key);
  const colorMap = useMemo(() => {
    const m: Record<string, string> = {};
    keys.forEach((k, i) => { m[k] = `var(${SERIES_VARS[i % SERIES_VARS.length]})`; });
    return m;
  }, [keys]);

  // { x: 1960, "Agriculture": 12.3, "Industry": 28.1, ... }
  const dataWide = useMemo(() => {
    const byYear = new Map<number, any>();
    for (const s of linesSorted) {
      const key = s.key;
      for (const p of s.points) {
        if (p.value == null) continue;
        const y = year(p.time);
        if (!Number.isFinite(y)) continue;
        const row = byYear.get(y) || { x: y };
        row[key] = (scale === "sci") ? Number(p.value) : Number(p.value) / sc.div;
        byYear.set(y, row);
      }
    }
    return Array.from(byYear.values()).sort((a,b)=>a.x-b.x);
  }, [linesSorted, scale, sc]);

  const vf = (v: number) => scale === "sci" ? fmtScientific(v, digits) : fmtNumber(v, digits) + sc.suffix;
  const yLabel = unitLabel || series.unit || "";

  const CustomTooltip = ({ active, label, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const sorted = [...payload].sort((a, b) => Number(b.value ?? -Infinity) - Number(a.value ?? -Infinity));
    return (
      <div className="rounded-lg border bg-background/95 p-3 shadow-md text-sm">
        <div className="mb-1 text-xs opacity-80">{label}</div>
        {sorted.map((it: any) => (
          <div key={it.name} style={{ color: colorMap[it.name] }}>
            <span className="font-medium">{it.name}</span>
            <span>{` : ${vf(Number(it.value))}`}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      <UnitControls
        className="mb-2"
        allowedScales={allowedScales}
        digitsOptions={digitsOptions}
        scale={scale}
        digits={digits}
        onScale={setScale}
        onDigits={setDigits}
      />

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dataWide} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(x)=>String(x)} tick={{ fontSize: 12 }} tickMargin={8} />
            <YAxis
              yAxisId="left"
              tickFormatter={(v)=>vf(Number(v))}
              tick={{ fontSize: 12 }}
              width={72}
              label={{ value: yLabel, position: "insideLeft", angle: -90, offset: 10, style: { fontSize: 11, opacity: 0.85 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            {keys.map((k) => (
              <Line
                key={k}
                yAxisId="left"
                type="monotone"
                dataKey={k}
                stroke={colorMap[k]}
                dot={false}
                strokeWidth={1.9}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[11px] text-muted-foreground">Tip: drag to zoom (release to apply), double-click to reset.</div>
    </div>
  );
}

