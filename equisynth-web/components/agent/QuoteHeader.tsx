"use client";

import StatusPill from "./StatusPill";

export default function QuoteHeader({
  name, ticker, last, changePct, marketCap, sector, industry, form, filed, url
}: {
  name?: string; ticker?: string; last?: number; changePct?: number;
  marketCap?: string; sector?: string; industry?: string;
  form?: string; filed?: string; url?: string;
}) {
  const up = (changePct ?? 0) >= 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{name || "—"}</h2>
            {ticker && <span className="px-2 py-0.5 rounded-md border text-xs text-gray-700 bg-gray-50">{ticker}</span>}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {[sector, industry, marketCap].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>

        {/* Center */}
        <div className="flex items-baseline gap-3">
          <div className="text-2xl font-bold text-gray-900 font-mono tabular-nums">
            {last != null ? `$${last.toFixed(2)}` : "—"}
          </div>
          {changePct != null && (
            <StatusPill tone={up ? "ok" : "error"}>
              <span className="font-mono tabular-nums">{up ? "▲" : "▼"} {changePct.toFixed(2)}%</span>
            </StatusPill>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {form && <span className="px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs">{form}</span>}
          {filed && <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700 text-xs">{filed}</span>}
          {url && (
            <a
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700"
              href={url} target="_blank" rel="noreferrer"
            >
              🔗 View on SEC.gov
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
