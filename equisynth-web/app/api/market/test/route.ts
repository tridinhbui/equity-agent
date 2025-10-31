import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
	try {
		const yf = await import("yahoo-finance2");
		
		// Check if functions are on the module directly
		const hasQuoteSummaryDirect = typeof (yf as any).quoteSummary === 'function';
		const hasQuoteDirect = typeof (yf as any).quote === 'function';
		
		return NextResponse.json({
			hasDefault: !!yf.default,
			hasQuoteSummary: !!(yf.default as any)?.quoteSummary,
			hasQuote: !!(yf.default as any)?.quote,
			hasQuoteSummaryDirect,
			hasQuoteDirect,
			keys: Object.keys(yf).slice(0, 20), // First 20 keys
			defaultKeys: yf.default ? Object.keys(yf.default).slice(0, 20) : [],
		});
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

