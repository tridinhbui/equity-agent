import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Use Finnhub API for fundamentals
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const ticker = searchParams.get("ticker");

		if (!ticker) {
			return NextResponse.json({ error: "ticker required" }, { status: 400 });
		}

		const apiKey = process.env.FINNHUB_API_KEY || "demo";

		// Fetch metrics from Finnhub
		const metricsUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${apiKey}`;
		const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${apiKey}`;

		const [metricsRes, profileRes] = await Promise.all([
			fetch(metricsUrl),
			fetch(profileUrl),
		]);

		if (!metricsRes.ok) {
			throw new Error(`Finnhub API returned ${metricsRes.status}`);
		}

		const metrics = await metricsRes.json();
		const profile = await profileRes.json();

		const m = metrics.metric || {};

		// Extract key metrics from Finnhub
		const fundamentals = {
			// Valuation metrics
			marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1000000 : null,
			enterpriseValue: null, // Not in free tier
			trailingPE: m.peExclExtraTTM || m.peTTM || null,
			forwardPE: null, // Not in free tier
			priceToBook: m.pbAnnual || m.pbQuarterly || null,
			priceToSales: m.psAnnual || m.psTTM || null,
			evToRevenue: null,
			evToEbitda: null,

			// Profitability
			profitMargins: m.netProfitMarginTTM || m.netProfitMarginAnnual || null,
			operatingMargins: m.operatingMarginTTM || m.operatingMarginAnnual || null,
			grossMargins: m.grossMarginTTM || m.grossMarginAnnual || null,
			returnOnAssets: m.roaTTM || m.roaRfy || null,
			returnOnEquity: m.roeTTM || m.roeRfy || null,

			// Growth  
			revenueGrowth: m.revenueGrowthTTMYoy || null,
			earningsGrowth: m.epsGrowthTTMYoy || null,

			// Financial health
			currentRatio: m.currentRatioAnnual || m.currentRatioQuarterly || null,
			quickRatio: m.quickRatioAnnual || m.quickRatioQuarterly || null,
			debtToEquity: m.totalDebtToEquityAnnual || m.totalDebtToEquityQuarterly || null,
			totalCash: null,
			totalDebt: null,
			freeCashflow: null,
			operatingCashflow: null,

			// Per share metrics
			revenuePerShare: m.revenuePerShareTTM || m.revenuePerShareAnnual || null,
			bookValue: m.bookValuePerShareAnnual || m.bookValuePerShareQuarterly || null,

			// Other
			beta: m.beta || null,
			sharesOutstanding: profile.shareOutstanding ? profile.shareOutstanding * 1000000 : null,
			floatShares: null,
			heldPercentInsiders: null,
			heldPercentInstitutions: null,
		};

		return NextResponse.json(fundamentals);
	} catch (err: any) {
		console.error("Yahoo Finance fundamentals error:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to fetch fundamentals" },
			{ status: 500 }
		);
	}
}

