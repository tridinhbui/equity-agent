"use client";
import React from "react";

export default function WeeklyFilingsCard({
  data = [0, 0, 0, 0, 0, 0, 0], // Mon..Sun (default to zeros)
  title = "Your filings this week",
}: {
  data?: number[];
  title?: string;
}) {
  const days = ["M","T","W","T","F","S","S"];
  const total = data.reduce((a,b)=>a+b,0);
  const avg = (total / (data.length || 1)).toFixed(1);
  const max = Math.max(1, ...data);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur p-4 shadow-sm">
      <div className="text-sm font-semibold text-gray-900">{title}</div>

      {/* Bars */}
      <div className="mt-3 flex items-end justify-between gap-2" role="img" aria-label="SEC filings per day, Monday through Sunday">
        {data.map((v, i) => {
          const h = Math.round((v / max) * 56); // 56px max height
          return (
            <div key={i} className="flex flex-col items-center w-[18px]">
              <div
                className="w-2.5 rounded bg-blue-600"
                style={{ height: Math.max(4, h) }}
                title={`${days[i]}: ${v}`}
              />
              <div className="mt-1 text-[10px] text-gray-500">{days[i]}</div>
            </div>
          );
        })}
      </div>

      {/* Explanation + stats */}
      <p className="mt-2 text-[11px] leading-snug text-gray-500">
        Track your filing extraction activity. Each bar shows how many filings you've fetched per day (Mon–Sun).
      </p>
      <div className="mt-1 text-[11px] text-gray-600">
        Total: <span className="font-semibold">{total}</span> · Avg/day: <span className="font-semibold">{avg}</span>
      </div>
    </div>
  );
}
