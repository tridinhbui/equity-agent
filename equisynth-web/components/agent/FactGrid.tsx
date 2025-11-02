"use client";

export function Fact({ label, value }:{label:string; value?:React.ReactNode}) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-gray-900">{value ?? "—"}</div>
    </div>
  );
}

export default function FactGrid({ items }:{ items: {label:string; value?:React.ReactNode}[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it,i)=> <Fact key={i} label={it.label} value={it.value} />)}
    </div>
  );
}
