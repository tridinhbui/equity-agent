import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Use Finnhub API (free tier: 60 calls/minute)
// Get your free API key at: https://finnhub.io/register
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const ticker = searchParams.get("ticker");

		if (!ticker) {
			return NextResponse.json({ error: "ticker required" }, { status: 400 });
		}

		const apiKey = process.env.FINNHUB_API_KEY || "demo";

		// Fetch quote from Finnhub
		const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`;
		const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${apiKey}`;
		const metricsUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${apiKey}`;

		const [quoteRes, profileRes, metricsRes] = await Promise.all([
			fetch(quoteUrl),
			fetch(profileUrl),
			fetch(metricsUrl),
		]);

		if (!quoteRes.ok) {
			throw new Error(`Finnhub API returned ${quoteRes.status}`);
		}

			const quote = await quoteRes.json();
		const profile = await profileRes.json();
		const metrics = await metricsRes.json();

		const currentPrice = quote.c || 0;
		const previousClose = quote.pc || currentPrice;
		const change = currentPrice - previousClose;
		const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

		// Try to get volume from quote, if not available try average volume from metrics
		let volume = quote.v || null;
		if (!volume || volume === 0) {
			// Try to get average volume as fallback
			volume = metrics.metric?.["10DayAverageTradingVolume"] || 
			         metrics.metric?.avgVol || 
			         null;
		}

		return NextResponse.json({
			symbol: ticker,
			shortName: profile.name || ticker,
			longName: profile.name || ticker,
			price: currentPrice,
			change: change,
			changePercent: changePercent,
			volume: volume,
			marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1000000 : null,
			fiftyTwoWeekHigh: metrics.metric?.["52WeekHigh"] || quote.h,
			fiftyTwoWeekLow: metrics.metric?.["52WeekLow"] || quote.l,
			trailingPE: metrics.metric?.peExclExtraTTM || null,
			forwardPE: null, // Not available in free tier
			dividendYield: profile.dividendYield || null,
			beta: metrics.metric?.beta || null,
			timestamp: quote.t || Date.now() / 1000,
		});
	} catch (err: any) {
		console.error("Finnhub quote error:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to fetch quote" },
			{ status: 500 }
		);
	}
}

