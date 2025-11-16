"use client";

import AppShell from "@/components/AppShell";
import AnalyticsDecor from "@/components/AnalyticsDecor";
import { FinanceTechBackground } from "@/components/FinanceTechBackground";
import { LoginCard } from "@/components/LoginCard";

export default function Home() {
	return (
		<div style={{ position: "relative", width: "100%", minHeight: "100vh", overflow: "hidden" }}>
			{/* Finance Tech Background Component */}
			<FinanceTechBackground />
			
			{/* AppShell with content */}
			<AppShell showTabs={false} showHeaderActions={false}>
				<div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
					{/* Decor cards with parallax - z-index: 0 */}
					<AnalyticsDecor />
					
					{/* Login card - z-index: 1 (above all effects) */}
					<div style={{ display: "grid", placeItems: "center", minHeight: "70vh", position: "relative", zIndex: 1 }}>
						<LoginCard />
					</div>

					{/* Feature chips under the card */}
					<div style={{ display: "grid", placeItems: "center", marginTop: -50, position: "relative", zIndex: 2 }}>
						<div className="feature-belt">
							<span className="feature-chip">10-K / 10-Q Parsing</span>
							<span className="feature-chip">Earnings Calls</span>
							<span className="feature-chip">Valuation (DCF/Comps)</span>
							<span className="feature-chip">News & Alerts</span>
						</div>
					</div>

					{/* Live snapshot */}
					<div className="card live-snap" style={{ position: "relative", zIndex: 2 }}>
						<div className="row">
							<span className="pill">S&P 500 +0.7%</span>
							<span className="pill">Nasdaq +0.9%</span>
							<span className="pill">AAPL +1.4%</span>
							<span className="pill">TSLA -0.6%</span>
							<span className="pill">NVDA +2.1%</span>
						</div>
					</div>

					{/* Logos belt */}
					<div style={{ display: "grid", placeItems: "center", position: "relative", zIndex: 2 }}>
						<div className="logo-belt">
							<span>SEC EDGAR</span>
							<span>Yahoo Finance</span>
							<span>Alpha Vantage</span>
							<span>FRED</span>
						</div>
					</div>
				</div>
			</AppShell>
		</div>
	);
}
