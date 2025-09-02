"use client";

import * as React from "react";
import type { ScaleMode } from "@/lib/types";

type Props = {
  allowedScales?: ScaleMode[];   // hide scale selector if 0 or 1
  digitsOptions?: number[];      // hide digits selector if 0 or 1
  scale: ScaleMode;
  digits: number;
  onScale: (s: ScaleMode) => void;
  onDigits: (d: number) => void;
  className?: string;
};

const DEFAULT_DIGITS = [0, 1, 2, 3];

export default function UnitControls({
  allowedScales,
  digitsOptions,
  scale,
  digits,
  onScale,
  onDigits,
  className,
}: Props) {
  const showScale = (allowedScales?.length ?? 0) > 1;
  const showDigits = (digitsOptions?.length ?? DEFAULT_DIGITS.length) > 1;

  const digitsChoices = digitsOptions && digitsOptions.length
    ? digitsOptions
    : DEFAULT_DIGITS;

  return (
    <div className={`flex items-center justify-end gap-3 ${className ?? ""}`}>
      {showScale && (
        <select
          className="border rounded px-2 py-1 text-sm"
          value={scale}
          onChange={(e) => onScale(e.target.value as ScaleMode)}
        >
          {allowedScales!.map((s) => (
            <option key={s} value={s}>
              {labelForScale(s)}
            </option>
          ))}
        </select>
      )}

      {showDigits && (
        <select
          className="border rounded px-2 py-1 text-sm"
          value={digits}
          onChange={(e) => onDigits(Number(e.target.value))}
        >
          {digitsChoices.map((d) => (
            <option key={d} value={d}>
              {d} digits
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function labelForScale(s: ScaleMode): string {
  switch (s) {
    case "sci": return "Scientific";
    case "raw": return "Raw";
    case "thousand": return "Thousand";
    case "million": return "Million";
    case "billion": return "Billion";
    case "trillion": return "Trillion";
    default: return s;
  }
}

