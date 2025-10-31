import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALPHA_VANTAGE_KEY = process.env.ALPHAVANTAGE_API_KEY || "demo";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const maturity = searchParams.get("maturity") || "10year"; // 3month, 2year, 5year, 10year, 30year

		// AlphaVantage Treasury Yield endpoints
		const url = `https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=monthly&maturity=${maturity}&apikey=${ALPHA_VANTAGE_KEY}`;
		
		const response = await fetch(url);
		const data = await response.json();

		if (data["Error Message"]) {
			return NextResponse.json({ error: data["Error Message"] }, { status: 400 });
		}

		if (data["Note"]) {
			return NextResponse.json({ error: "API rate limit reached. Please try again later." }, { status: 429 });
		}

		return NextResponse.json({
			maturity,
			name: data.name,
			interval: data.interval,
			unit: data.unit,
			data: data.data?.slice(0, 50) || [],
		});
	} catch (err: any) {
		console.error("AlphaVantage treasury error:", err);
		return NextResponse.json(
			{ error: err?.message || "Failed to fetch treasury data" },
			{ status: 500 }
		);
	}
}

