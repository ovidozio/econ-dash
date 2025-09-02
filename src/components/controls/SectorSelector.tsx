"use client";
type Option = { code: string; label: string };

export default function SectorSelector(props: {
  options: Option[];
  selected: string[];
  onAdd: (code: string) => void;
  onRemove: (code: string) => void;
  onClear?: () => void;
  placeholder?: string;
}) {
  const { options, selected, onAdd, onRemove, onClear, placeholder="Add sector…" } = props;
  const candidates = options.filter(o => !selected.includes(o.code));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="border rounded px-2 py-1"
        onChange={(e) => { const c = e.target.value; if (c) onAdd(c); e.currentTarget.value=""; }}
        value=""
      >
        <option value="" disabled>{placeholder}</option>
        {candidates.map(o => <option key={o.code} value={o.code}>{o.code} — {o.label}</option>)}
      </select>

      {selected.map(code => (
        <button
          key={code}
          className="px-2 py-1 rounded-2xl border text-sm hover:bg-gray-50 flex items-center gap-1"
          onClick={() => onRemove(code)}
          title="Remove"
        >
          <span>{code}</span>
          <span aria-hidden>×</span>
        </button>
      ))}

      {selected.length > 0 && (
        <button className="px-2 py-1 text-sm underline" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  );
}

