"use client";

export default function StatusPill({
  tone = "info",
  children,
}: { tone?: "info" | "ok" | "warn" | "error"; children: React.ReactNode }) {
  const m = {
    info:  "bg-blue-50 text-blue-800 border-blue-200",
    ok:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn:  "bg-amber-50 text-amber-800 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${m[tone]}`}>
      {children}
    </span>
  );
}
