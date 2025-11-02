"use client";
import React from "react";

/** ----- Types for real data (optional) ----- */
export type ExtractorDecorProps = {
  filingsPerDay?: number[];      // length 7 (Mon..Sun)
  indexLabel?: string;           // e.g., "S&P 500 (mock)"
  coveragePct?: number;          // 0..100
  candles?: { o:number; h:number; l:number; c:number }[]; // recent OHLC
};

const Glass: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className="", children, ...rest }) => (
  <div
    {...rest}
    className={`pointer-events-none select-none rounded-2xl border border-gray-200/70 bg-white/90 shadow-lg backdrop-blur-md ${className}`}
  >
    {children}
  </div>
);

/* =============== Filings/week (bars) =============== */
function WeeklyBars({ data }: { data: number[] }) {
  const days = ["M","T","W","T","F","S","S"];
  const max = Math.max(...data, 1);
  return (
    <div aria-label="Filings this week" className="pointer-events-auto">
      <div className="text-xs font-medium text-gray-700">Filings this week</div>
      <div className="mt-1 flex items-end gap-2" role="img" aria-describedby="filings-desc">
        {data.map((v, i) => {
          const h = Math.round((v / max) * 40) || 2;
          return (
            <div key={i} className="flex flex-col items-center">
              <div
                className="w-2.5 rounded bg-blue-500"
                style={{ height: h }}
                title={`${days[i]}: ${v}`}
              />
              <div className="mt-1 text-[10px] text-gray-500">{days[i]}</div>
            </div>
          );
        })}
      </div>
      <p id="filings-desc" className="mt-1 text-[11px] leading-snug text-gray-500">
        Bars show the **count of SEC filings** received each day (Mon–Sun). Higher bar = more filings.
      </p>
      <div className="mt-1 text-[11px] text-gray-600">
        Total: <span className="font-semibold">{data.reduce((a,b)=>a+b,0)}</span> · Avg/day: <span className="font-semibold">
          {(data.reduce((a,b)=>a+b,0)/data.length).toFixed(1)}
        </span>
      </div>
    </div>
  );
}

/* =============== Index trend (area spark) =============== */
function AreaSpark({ label }: { label: string }) {
  const path = "M0,36 L10,34 L20,40 L30,28 L40,30 L50,22 L60,25 L70,18 L80,23 L90,20 L90,50 L0,50 Z";
  return (
    <div aria-label="Index trend" className="pointer-events-auto">
      <div className="text-xs font-medium text-gray-700">{label}</div>
      <svg viewBox="0 0 90 50" width="100%" height="60" role="img" aria-describedby="trend-desc">
        <path d={path} fill="url(#g)" opacity="0.7" />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        <path
          d="M0,36 L10,34 L20,40 L30,28 L40,30 L50,22 L60,25 L70,18 L80,23 L90,20"
          fill="none" stroke="rgb(37 99 235)" strokeWidth="2.2" strokeLinecap="round"
        />
      </svg>
      <p id="trend-desc" className="text-[11px] leading-snug text-gray-500">
        Line shows **relative price trend**; the shaded area highlights the movement range over the period.
      </p>
      <div className="mt-1 text-[11px] text-gray-600"><span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-1" /> Price</div>
    </div>
  );
}

/* =============== Coverage ring =============== */
function CoverageRing({ pct=62 }: { pct: number }) {
  const v = Math.max(0, Math.min(100, pct));
  const r = 18, c = 2 * Math.PI * r;
  return (
    <div aria-label="Sectioning coverage progress" className="pointer-events-auto">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 50 50" width="58" height="58" role="img" aria-describedby="coverage-desc">
          <circle cx="25" cy="25" r={r} stroke="#e2e8f0" strokeWidth="6" fill="none"/>
          <circle cx="25" cy="25" r={r}
            stroke="rgb(59 130 246)" strokeWidth="6" fill="none"
            strokeDasharray={`${(v/100)*c} ${c}`} strokeDashoffset="0"
            transform="rotate(-90 25 25)" strokeLinecap="round"
          />
          <text x="25" y="27" textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="700">{v}%</text>
        </svg>
        <div>
          <div className="text-xs font-medium text-gray-700">Sectioning coverage</div>
          <div className="text-[11.5px] text-gray-600">{v}% complete</div>
        </div>
      </div>
      <p id="coverage-desc" className="mt-1 text-[11px] leading-snug text-gray-500">
        Percent of the filing that has been **downloaded, sectioned, and embedded** for semantic search.
      </p>
    </div>
  );
}

/* =============== Mini Candlesticks (volatility) =============== */
function MiniCandles({ data }: { data: {o:number;h:number;l:number;c:number}[] }) {
  const up = (d:any) => d.c >= d.o;
  return (
    <div aria-label="Volatility micro-candles" className="pointer-events-auto">
      <div className="text-xs font-medium text-gray-700">Volatility</div>
      <svg viewBox="0 0 90 50" width="100%" height="60" role="img" aria-describedby="vol-desc">
        {data.map((d,i)=>(
          <g key={i}>
            <line x1={8+i*16} x2={8+i*16} y1={50-d.h} y2={50-d.l} stroke="#94a3b8" strokeWidth="1.2" />
            <rect
              x={8+i*16-3} width="6"
              y={50-Math.max(d.o,d.c)}
              height={Math.max(2, Math.abs(d.c-d.o))}
              rx="1.2"
              fill={up(d)? "rgb(16 185 129)" : "rgb(239 68 68)"}
            />
          </g>
        ))}
      </svg>
      <p id="vol-desc" className="text-[11px] leading-snug text-gray-500">
        **Green** candle = close ≥ open (up day). **Red** = close &lt; open (down day). Wick shows intraday high/low.
      </p>
      <div className="mt-1 text-[11px] text-gray-600">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" /> Up ·
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mx-1" /> Down
      </div>
    </div>
  );
}

/* =============== Wrapper positions 4 chips around the hero card =============== */
export default function ExtractorDecor({
  filingsPerDay = [6,12,9,14,18,11,7],
  indexLabel = "Index trend (mock)",
  coveragePct = 62,
  candles = [
    {o:26,h:32,l:22,c:30},{o:30,h:36,l:25,c:27},
    {o:27,h:34,l:24,c:33},{o:33,h:38,l:29,c:35},
    {o:35,h:40,l:31,c:34},
  ],
}: ExtractorDecorProps) {
  return (
    <div className="relative hidden lg:block">
      {/* TL: Filings/week */}
      <Glass className="absolute -top-3 -left-3 w-[210px] p-3">
        <WeeklyBars data={filingsPerDay} />
      </Glass>

      {/* TR: Index trend */}
      <Glass className="absolute -top-6 right-0 w-[220px] p-3">
        <AreaSpark label={indexLabel} />
      </Glass>

      {/* BL: Coverage ring */}
      <Glass className="absolute bottom-0 -left-2 w-[230px] p-3">
        <CoverageRing pct={coveragePct} />
      </Glass>

      {/* BR: Volatility */}
      <Glass className="absolute -bottom-4 right-8 w-[220px] p-3">
        <MiniCandles data={candles} />
      </Glass>
    </div>
  );
}
