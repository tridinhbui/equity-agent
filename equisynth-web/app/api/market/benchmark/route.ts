import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Use dynamic import for yahoo-finance2 to avoid bundling issues
async function getYahooFinance() {
	const yahooFinance = await import("yahoo-finance2");
	return yahooFinance.default;
}

// Common benchmark indices
const BENCHMARKS = {
	"sp500": "^GSPC",
	"nasdaq": "^IXIC",
	"dow": "^DJI",
	"russell2000": "^RUT",
	"vix": "^VIX",
};

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const benchmark = searchParams.get("benchmark") || "sp500";

		const ticker = BENCHMARKS[benchmark as keyof typeof BENCHMARKS];
		if (!ticker) {
			return NextResponse.json(
				{ error: `Invalid benchmark. Available: ${Object.keys(BENCHMARKS).join(", ")}` },
				{ status: 400 }
			);
		}

		// Fetch quote for the benchmark
		const yahooFinance = await getYahooFinance();
		const result = await yahooFinance.quoteSummary(ticker, { modules: ["price", "summaryDetail"] });
		const priceData = result.price || {};
		const summaryData = result.summaryDetail || {};

		return NextResponse.json({
			benchmark,
			ticker,
			name: priceData.shortName,
			price: priceData.regularMarketPrice,
			change: priceData.regularMarketChange,
			changePercent: priceData.regularMarketChangePercent,
			dayHigh: priceData.regularMarketDayHigh,
			dayLow: priceData.regularMarketDayLow,
			fiftyTwoWeekHigh: summaryData.fiftyTwoWeekHigh,
			fiftyTwoWeekLow: summaryData.fiftyTwoWeekLow,
			timestamp: priceData.regularMarketTime,
		});
	} catch (err: any) {
		console.error("Benchmark data error:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to fetch benchmark data" },
			{ status: 500 }
		);
	}
}

