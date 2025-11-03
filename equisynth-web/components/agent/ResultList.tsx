"use client";

import StatusPill from "./StatusPill";

export default function ResultList({ results }:{ results: any[] }) {
  if (!results?.length) return null;
  
  // Check if this is an AI answer response
  const firstResult = results[0];
  if (firstResult.aiAnswer) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🤖</span>
            <h4 className="font-semibold text-gray-900">AI Answer</h4>
            {firstResult.sources > 0 && (
              <span className="ml-auto px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                Based on {firstResult.sources} sources
              </span>
            )}
          </div>
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {firstResult.aiAnswer}
          </div>
        </div>
      </div>
    );
  }
  
  // Original search results view (fallback)
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
