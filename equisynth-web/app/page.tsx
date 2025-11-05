"use client";

import { signIn } from "next-auth/react";
import AppShell from "@/components/AppShell";
import AnalyticsDecor from "@/components/AnalyticsDecor";

export default function Home() {
	return (
		<AppShell showTabs={false} showHeaderActions={false}>
			<div style={{ position: "relative", minHeight: "70vh" }} className="bg-grid">
				<div className="login-halo" />
				<AnalyticsDecor />
				<div style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
					<div className="card" style={{ maxWidth: 520, position: "relative", zIndex: 1 }}>
						<h1 style={{ textAlign: "center", marginTop: 4, marginBottom: 8 }}>
							Welcome to EquiSynth
						</h1>
						<p className="muted" style={{ textAlign: "center" }}>
							Deep Equity Agent automates equity research: reads documents, connects real-time data, analyzes sentiment, and performs valuations to generate traceable reports.
						</p>

						<ul style={{ marginTop: 12, marginBottom: 16, color: "var(--muted)" }}>
							<li>• Read 10‑K/10‑Q, transcripts, investor decks</li>
							<li>• Real-time data: price, fundamentals, macro</li>
							<li>• Sentiment & Tone: FinBERT & embeddings</li>
							<li>• Automatic valuation: DCF, EV/EBITDA, multiples</li>
						</ul>

						<div className="badges">
							<div className="badge-item">🔒 Read-only OAuth</div>
							<div className="badge-item">🧾 SEC-first data</div>
							<div className="badge-item">🗄️ You own your data</div>
						</div>

						<button 
							className="btn btn-primary" 
							style={{ width: "100%", marginTop: 20 }}
							onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
						>
							Sign in with Google
						</button>

						<div className="muted" style={{ marginTop: 10, fontSize: 12, textAlign: "center" }}>
							By continuing, you agree to EquiSynth's terms of service.
						</div>
					</div>
				</div>

				{/* Feature chips under the card */}
				<div style={{ display: "grid", placeItems: "center", marginTop: -50, position: "relative", zIndex: 1 }}>
					<div className="feature-belt">
						<span className="feature-chip">10-K / 10-Q Parsing</span>
						<span className="feature-chip">Earnings Calls</span>
						<span className="feature-chip">Valuation (DCF/Comps)</span>
						<span className="feature-chip">News & Alerts</span>
					</div>
				</div>

				{/* Live snapshot */}
				<div className="card live-snap" style={{ position: "relative", zIndex: 1 }}>
					<div className="row">
						<span className="pill">S&P 500 +0.7%</span>
						<span className="pill">Nasdaq +0.9%</span>
						<span className="pill">AAPL +1.4%</span>
						<span className="pill">TSLA -0.6%</span>
						<span className="pill">NVDA +2.1%</span>
					</div>
				</div>

				{/* Logos belt */}
				<div style={{ display: "grid", placeItems: "center", position: "relative", zIndex: 1 }}>
					<div className="logo-belt">
						<span>SEC EDGAR</span>
						<span>Yahoo Finance</span>
						<span>Alpha Vantage</span>
						<span>FRED</span>
					</div>
				</div>
			</div>
		</AppShell>
	);
}
