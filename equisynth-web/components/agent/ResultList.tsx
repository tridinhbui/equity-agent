"use client";

import StatusPill from "./StatusPill";

export default function ResultList({ results }:{ results: any[] }) {
  if (!results?.length) return null;
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          {r.error ? (
            <p className="text-red-600 font-medium">{r.error}</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <StatusPill tone="info">Relevance {(r.score * 100).toFixed(1)}%</StatusPill>
                {r?.metadata?.section && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs">
                    {r.metadata.section}
                  </span>
                )}
              </div>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{r.text}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
