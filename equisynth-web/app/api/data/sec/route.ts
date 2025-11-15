import { NextRequest, NextResponse } from "next/server";
import {
	resolveTickerToCik,
	fetchCompanySubmissions,
	findLatestFiling,
	buildDocumentUrl,
	jsonError,
	getSecUserAgent,
} from "@/app/lib/sec";

/**
 * POST /api/data/sec
 * Fetch SEC filing metadata for a ticker
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { ticker, formType, year } = body;

		if (!ticker) {
			return jsonError("ticker is required", 400);
		}

		// Resolve ticker to CIK
		const cik = await resolveTickerToCik(ticker);
		if (!cik) {
			return jsonError(`Could not resolve ticker ${ticker} to CIK`, 404);
		}

		// Fetch company submissions
		const submissions = await fetchCompanySubmissions(cik);

		// Find the latest filing matching the form type and optional year
		const form = formType || "10-K";
		const filing = findLatestFiling(submissions, form, year);

		if (!filing) {
			return jsonError(
				`No ${form} filing found${year ? ` for year ${year}` : ""} for ${ticker}`,
				404
			);
		}

		// Build document URL
		const url = buildDocumentUrl(filing);

		return NextResponse.json({
			ticker: ticker.toUpperCase(),
			cik: filing.cik,
			companyName: filing.companyName,
			form: filing.form,
			filed: filing.filed,
			reportDate: filing.reportDate,
			accessionNumber: filing.accessionNumber,
			url,
		});
	} catch (error: any) {
		console.error("SEC fetch error:", error);
		return jsonError(error?.message || "Failed to fetch SEC filing", 500);
	}
}

/**
 * GET /api/data/sec
 * Fetch SEC filing metadata via query params
 */
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const ticker = searchParams.get("ticker");
		const formType = searchParams.get("formType") || "10-K";
		const year = searchParams.get("year");

		if (!ticker) {
			return jsonError("ticker parameter is required", 400);
		}

		// Reuse POST logic
		const response = await POST(
			new Request(req.url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ticker, formType, year }),
			})
		);

		return response;
	} catch (error: any) {
		console.error("SEC fetch error:", error);
		return jsonError(error?.message || "Failed to fetch SEC filing", 500);
	}
}

