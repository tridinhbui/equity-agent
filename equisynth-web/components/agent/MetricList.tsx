"use client";

export default function MetricList({ items }:{
  items: { label: string; value?: string | number | null }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((m,i)=>(
        <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
          <span className="text-sm text-gray-600">{m.label}</span>
          <span className="text-sm font-semibold text-gray-900 font-mono tabular-nums">
            {m.value == null || Number.isNaN(m.value) ? "—" : typeof m.value === "number" ? m.value.toLocaleString() : m.value}
          </span>
        </div>
      ))}
    </div>
  );
}
