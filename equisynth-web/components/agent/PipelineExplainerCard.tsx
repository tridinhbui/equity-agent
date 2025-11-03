"use client";
import React from "react";

const steps = [
  {
    icon: "📥",
    title: "Download & Parse",
    blurb: "Fetch the filing from SEC and convert it into clean text & tables.",
    bg: "from-emerald-50 to-emerald-100/60",
    ring: "ring-emerald-200",
  },
  {
    icon: "✂️",
    title: "Section & Chunk",
    blurb: "Detect sections (10-K/10-Q) and split into semantic chunks.",
    bg: "from-violet-50 to-violet-100/60",
    ring: "ring-violet-200",
  },
  {
    icon: "🧠",
    title: "Generate Embeddings",
    blurb: "Create vector embeddings so the agent can search & reason.",
    bg: "from-amber-50 to-amber-100/60",
    ring: "ring-amber-200",
  },
];

export default function PipelineExplainerCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💡</span>
        <h3 className="text-lg font-semibold text-gray-900">
          What happens in each step?
        </h3>
      </div>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`group rounded-lg ring-1 ${s.ring} bg-gradient-to-br ${s.bg} p-4 transition-transform duration-200 hover:-translate-y-0.5`}
          >
            <div className="flex items-start gap-3">
              <div className="text-xl leading-none">{s.icon}</div>
              <div>
                <div className="font-medium text-gray-900">{s.title}</div>
                <p className="mt-0.5 text-sm text-gray-700">{s.blurb}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span>
          Tip: run steps in order for best results, then use <b>Ask Questions</b>.
        </span>
      </div>

      <div className="mt-3">
        <a
          href="https://www.sec.gov/edgar/searchedgar/companysearch.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-700 hover:text-blue-800 underline underline-offset-2"
          title="Learn more about SEC filings"
        >
          Learn more about SEC filings
        </a>
      </div>
    </div>
  );
}
