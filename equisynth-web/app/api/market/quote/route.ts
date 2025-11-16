import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Use dynamic import for yahoo-finance2 to avoid bundling issues
async function getYahooFinance() {
	const yahooFinance = await import("yahoo-finance2");
	return yahooFinance.default;
}

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
			// Try to get average volume as fallback from Finnhub metrics
			volume = metrics.metric?.["10DayAverageTradingVolume"] || 
			         metrics.metric?.avgVol || 
			         null;
		}

		// If still no volume, try Yahoo Finance as final fallback
		if (!volume || volume === 0) {
			try {
				const yahooFinance = await getYahooFinance();
				const yfQuote = await yahooFinance.quote(ticker);
				if (yfQuote?.regularMarketVolume) {
					volume = yfQuote.regularMarketVolume;
				} else if (yfQuote?.averageVolume) {
					volume = yfQuote.averageVolume;
				}
			} catch (yfErr) {
				console.warn("Yahoo Finance fallback failed:", yfErr);
				// Continue without volume
			}
		}

		// Normalize volume: if volume is a decimal number < 1000, it might be in millions already
		// Convert to actual shares (multiply by 1M)
		// This handles cases where APIs return volume normalized (e.g., 47.55 = 47.55M shares)
		if (volume && volume > 0 && volume < 1000 && volume % 1 !== 0) {
			// Check if it's a decimal number (has fractional part)
			volume = volume * 1_000_000;
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

