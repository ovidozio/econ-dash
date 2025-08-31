"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VariantSelect(props: {
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
  className?: string;
}) {
  return (
    <Select value={props.value} onValueChange={props.onChange}>
      <SelectTrigger className={props.className ?? "w-44"}>
        <SelectValue placeholder="Choose..." />
      </SelectTrigger>
      <SelectContent>
        {props.options.map(o => (
          <SelectItem key={o.key} value={o.key}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

