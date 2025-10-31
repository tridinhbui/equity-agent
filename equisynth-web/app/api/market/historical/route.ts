import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Use dynamic import for yahoo-finance2 to avoid bundling issues
async function getYahooFinance() {
	const yahooFinance = await import("yahoo-finance2");
	return yahooFinance.default;
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const ticker = searchParams.get("ticker");
		const period1 = searchParams.get("period1"); // start date (YYYY-MM-DD or timestamp)
		const period2 = searchParams.get("period2"); // end date
		const interval = searchParams.get("interval") || "1d"; // 1d, 1wk, 1mo

		if (!ticker) {
			return NextResponse.json({ error: "ticker required" }, { status: 400 });
		}

		const queryOptions: any = {
			period1: period1 || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 1 year ago
			period2: period2 || new Date().toISOString().split("T")[0], // today
			interval: interval as any,
		};

		const yahooFinance = await getYahooFinance();
		const historical = await yahooFinance.historical(ticker, queryOptions);

		return NextResponse.json({
			ticker,
			interval,
			count: historical.length,
			data: historical.map((h) => ({
				date: h.date,
				open: h.open,
				high: h.high,
				low: h.low,
				close: h.close,
				volume: h.volume,
				adjClose: h.adjClose,
			})),
		});
	} catch (err: any) {
		console.error("Yahoo Finance historical error:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to fetch historical data" },
			{ status: 500 }
		);
	}
}

