import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALPHA_VANTAGE_KEY = process.env.ALPHAVANTAGE_API_KEY || "demo";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const indicator = searchParams.get("indicator"); // REAL_GDP, INFLATION, UNEMPLOYMENT, FEDERAL_FUNDS_RATE, etc.

		if (!indicator) {
			return NextResponse.json({ error: "indicator required" }, { status: 400 });
		}

		const url = `https://www.alphavantage.co/query?function=${indicator}&apikey=${ALPHA_VANTAGE_KEY}`;
		
		const response = await fetch(url);
		const data = await response.json();

		if (data["Error Message"]) {
			return NextResponse.json({ error: data["Error Message"] }, { status: 400 });
		}

		if (data["Note"]) {
			// Rate limit hit
			return NextResponse.json({ error: "API rate limit reached. Please try again later." }, { status: 429 });
		}

		// Parse the response based on the indicator type
		// Most economic indicators return data in this format
		const indicatorData = data.data || [];

		return NextResponse.json({
			indicator,
			name: data.name,
			interval: data.interval,
			unit: data.unit,
			data: indicatorData.slice(0, 50), // Return last 50 data points
		});
	} catch (err: any) {
		console.error("AlphaVantage macro error:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to fetch macro data" },
			{ status: 500 }
		);
	}
}

