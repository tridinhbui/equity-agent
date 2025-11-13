"use client";

import React from "react";

/* ---------- Glass wrapper ---------- */
const Glass: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className="", children, ...rest }) => (
  <div
    {...rest}
    className={`decor-glass ${className}`}
    style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
  >
    {children}
  </div>
);

/* ---------- Market Movers ---------- */

type Mover = { t:string; px:number; chg:number }; // chg in %
const gainers: Mover[] = [
  { t:"NVDA", px: 128.42, chg: +2.1 },
  { t:"AAPL", px: 193.12, chg: +1.4 },
  { t:"MSFT", px: 428.09, chg: +0.9 },
];
const losers: Mover[] = [
  { t:"TSLA", px: 218.70, chg: -0.6 },
  { t:"PYPL", px: 62.84, chg: -0.5 },
  { t:"SNAP", px: 13.44, chg: -0.4 },
];

const MiniBarChart = () => {
  const bars = [18, 32, 24, 40, 28];
  return (
    <svg viewBox="0 0 120 60" width="100%" height="60" aria-hidden>
      {bars.map((h, i) => (
        <rect key={i} x={10 + i*20} y={60 - h} width="12" height={h} rx="2" fill="var(--brand-600)">
          <animate attributeName="height" from="0" to={h} dur="600ms" begin={`${i*80}ms`} fill="freeze" />
          <animate attributeName="y" from="60" to={60 - h} dur="600ms" begin={`${i*80}ms`} fill="freeze" />
        </rect>
      ))}
    </svg>
  );
};

function pctClass(p:number){ return p>=0 ? "pill pill--up" : "pill pill--down"; }

const MarketMoversCard = () => {
  const [ts, setTs] = React.useState<string>("");

  React.useEffect(() => {
    const update = () => {
      setTs(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    update();
  }, []);
  return (
    <>
      <div className="decor__title">Market Movers</div>
      <MiniBarChart />
      <div className="mm-grid" role="table" aria-label="Top movers">
        <div className="mm-col" role="rowgroup" aria-label="Gainers">
          {gainers.map(m=>(
            <div className="mm-row" role="row" key={m.t}>
              <div className="mm-ticker" role="cell">{m.t}</div>
              <div className="mm-px" role="cell">{m.px.toFixed(2)}</div>
              <div className={pctClass(m.chg)} role="cell">{m.chg>0 ? "▲" : "▼"} {m.chg.toFixed(1)}%</div>
            </div>
          ))}
        </div>
        <div className="mm-col" role="rowgroup" aria-label="Losers">
          {losers.map(m=>(
            <div className="mm-row" role="row" key={m.t}>
              <div className="mm-ticker" role="cell">{m.t}</div>
              <div className="mm-px" role="cell">{m.px.toFixed(2)}</div>
              <div className={pctClass(m.chg)} role="cell">{m.chg>0 ? "▲" : "▼"} {m.chg.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mm-foot muted">as of {ts || "--:--"}</div>
    </>
  );
};

/* ---------- AAPL 1Y ---------- */

const Sparkline = () => {
  const path = "M0,40 L15,38 L30,45 L45,30 L60,35 L75,22 L90,28 L105,18 L120,24";
  return (
    <svg viewBox="0 0 120 50" width="100%" height="50" aria-hidden>
      <path d={path} fill="none" stroke="var(--brand-700)" strokeWidth="2.5" strokeLinecap="round">
        <animate attributeName="stroke-dasharray" from="0,200" to="200,0" dur="900ms" fill="freeze"/>
      </path>
    </svg>
  );
};

function RangeMeter({min, max, now}:{min:number; max:number; now:number}) {
  const pct = Math.max(0, Math.min(100, ((now-min)/(max-min))*100));
  return (
    <div className="range">
      <div className="range__bar" />
      <div className="range__dot" style={{ left: `${pct}%` }} />
      <div className="range__labels">
        <span>{min.toFixed(2)}</span>
        <span>52W</span>
        <span>{max.toFixed(2)}</span>
      </div>
    </div>
  );
}

const AAPLCard = () => {
  const last = 193.12, day = +1.4, low52=164.12, high52=199.50;
  return (
    <>
      <div className="decor__row">
        <div className="decor__title">AAPL · 1Y</div>
        <span className={`badge ${day>=0 ? "badge--pos":"badge--neg"}`}>{day>=0?"▲":"▼"} {day.toFixed(1)}%</span>
      </div>
      <Sparkline />
      <div className="kv">
        <div>
          <div className="kv__label">Last</div>
          <div className="kv__value">${last.toFixed(2)}</div>
        </div>
        <div>
          <div className="kv__label">Change</div>
          <div className={`kv__value ${day>=0?"up":"down"}`}>{day>=0?"+":""}{day.toFixed(1)}%</div>
        </div>
        <div>
          <div className="kv__label">Volume</div>
          <div className="kv__value">58.2M</div>
        </div>
      </div>
      <RangeMeter min={low52} max={high52} now={last} />
    </>
  );
};

/* ---------- Donut & Ticker (unchanged) ---------- */

const Donut = () => {
  const total = 100; const a=45, b=30, c=25;
  const circ = 2*Math.PI*26;
  const seg = (v:number)=> (v/total)*circ;
  return (
    <svg viewBox="0 0 70 70" width="70" height="70" aria-hidden>
      <circle cx="35" cy="35" r="26" stroke="#e6eef7" strokeWidth="10" fill="none"/>
      <circle cx="35" cy="35" r="26" stroke="var(--brand-600)" strokeWidth="10" fill="none"
              strokeDasharray={`${seg(a)} ${circ}`} strokeDashoffset="0" transform="rotate(-90 35 35)"/>
      <circle cx="35" cy="35" r="26" stroke="#7dd3fc" strokeWidth="10" fill="none"
              strokeDasharray={`${seg(b)} ${circ}`} strokeDashoffset={-seg(a)} transform="rotate(-90 35 35)"/>
      <circle cx="35" cy="35" r="26" stroke="#bae6fd" strokeWidth="10" fill="none"
              strokeDasharray={`${seg(c)} ${circ}`} strokeDashoffset={-(seg(a)+seg(b))} transform="rotate(-90 35 35)"/>
    </svg>
  );
};

const Ticker = () => {
  const items = ["AAPL +1.4%", "MSFT +0.9%", "TSLA -0.6%", "NVDA +2.1%", "AMZN +0.7%"];
  return (
    <div className="ticker">
      <div className="ticker__track">
        {items.concat(items).map((t,i)=>(
          <span key={i} className="ticker__item">{t}</span>
        ))}
      </div>
    </div>
  );
};

/* ---------- Layout wrapper with four cards ---------- */

export default function AnalyticsDecor() {
  return (
    <div className="decor" aria-hidden>
      <Glass className="decor__card decor__tl">
        <MarketMoversCard />
      </Glass>

      <Glass className="decor__card decor__tr">
        <AAPLCard />
      </Glass>

      <Glass className="decor__card decor__bl">
        <div className="decor__title">Revenue Mix</div>
        <div className="decor__row" style={{alignItems:"center", gap:12}}>
          <Donut />
          <div className="decor__legend">
            <div><span className="dot dot--1" /> iPhone 45%</div>
            <div><span className="dot dot--2" /> Services 30%</div>
            <div><span className="dot dot--3" /> Other 25%</div>
          </div>
        </div>
      </Glass>

      <Glass className="decor__card decor__br">
        <div className="decor__title">Watchlist</div>
        <Ticker />
      </Glass>
    </div>
  );
}
