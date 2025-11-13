import { NextResponse } from "next/server";

const SEC_TICKER_URL = "https://www.sec.gov/include/ticker.txt";
const SEC_SUBMISSIONS_URL = "https://data.sec.gov/submissions";

type SubmissionsResponse = {
	cik: string;
	name: string;
	ticker?: string;
	filings?: {
		recent?: {
			accessionNumber: string[];
			filingDate: string[];
			reportDate: string[];
			acceptanceDateTime: string[];
			act: string[];
			form: string[];
			fileNumber: string[];
			filmNumber: string[];
			items: (string | null)[];
			size: number[];
			isXBRL: number[];
			isInlineXBRL: number[];
			primaryDocument: string[];
			primaryDocDescription: (string | null)[];
		};
	};
};

type TickerRecord = {
	ticker: string;
	cik: string;
};

let tickerCache: Map<string, string> | null = null;
let tickerCacheFetchedAt: number | null = null;

/**
 * SEC requests require a descriptive User-Agent header.
 * Fallback to a sensible default if missing.
 */
export function getSecUserAgent(): string {
	return process.env.SEC_USER_AGENT || "EquiSynth/1.0 (contact@equisynth.local)";
}

/**
 * Fetch the SEC ticker mapping (ticker -> CIK). Cached in memory for 6 hours.
 */
export async function getTickerMappings(): Promise<Map<string, string>> {
	const now = Date.now();
	if (tickerCache && tickerCacheFetchedAt && now - tickerCacheFetchedAt < 6 * 60 * 60 * 1000) {
		return tickerCache;
	}

	const res = await fetch(SEC_TICKER_URL, {
		method: "GET",
		headers: {
			"User-Agent": getSecUserAgent(),
			Accept: "text/plain",
		},
	});

	if (!res.ok) {
		throw new Error(`Failed to fetch SEC ticker mappings (${res.status} ${res.statusText})`);
	}

	const text = await res.text();
	const map = new Map<string, string>();

	text.split(/\r?\n/).forEach((line) => {
		if (!line) return;
		let ticker: string | undefined;
		let cik: string | undefined;

		if (line.includes("|")) {
			[ticker, cik] = line.split("|");
		} else {
			const parts = line.trim().split(/\s+/);
			if (parts.length >= 2) {
				[ticker, cik] = [parts[0], parts[1]];
			}
		}

		if (ticker && cik) {
			map.set(ticker.trim().toLowerCase(), cik.trim());
		}
	});

	tickerCache = map;
	tickerCacheFetchedAt = now;
	return map;
}

/**
 * Resolve a ticker to its CIK string (zero padded) using SEC mapping.
 */
export async function resolveTickerToCik(ticker: string): Promise<string | null> {
	if (!ticker) return null;
	const map = await getTickerMappings();
	const cik = map.get(ticker.trim().toLowerCase());
	if (!cik) return null;
	return cik.padStart(10, "0");
}

/**
 * Fetch the submissions JSON for a company by CIK.
 */
export async function fetchCompanySubmissions(cik: string): Promise<SubmissionsResponse> {
	const padded = cik.padStart(10, "0");
	const url = `${SEC_SUBMISSIONS_URL}/CIK${padded}.json`;
	const res = await fetch(url, {
		headers: {
			"User-Agent": getSecUserAgent(),
			Accept: "application/json",
		},
	});

	if (!res.ok) {
		throw new Error(`Failed to fetch SEC submissions (${res.status} ${res.statusText})`);
	}

	return (await res.json()) as SubmissionsResponse;
}

export type FilingMatch = {
	cik: string;
	companyName: string;
	form: string;
	filed: string;
	reportDate?: string | null;
	accessionNumber: string;
	primaryDocument: string;
};

/**
 * Find the latest filing that matches the given form type and optional year.
 */
export function findLatestFiling(submissions: SubmissionsResponse, formType: string, year?: string): FilingMatch | null {
	const recent = submissions.filings?.recent;
	if (!recent || !recent.form || !recent.filingDate) return null;

	const cleanedForm = formType.toUpperCase();
	const targetYear = year ? year.trim() : undefined;

	for (let i = 0; i < recent.form.length; i++) {
		if (recent.form[i]?.toUpperCase() !== cleanedForm) continue;
		const filed = recent.filingDate[i];
		if (!filed) continue;
		if (targetYear && !filed.startsWith(targetYear)) continue;

		return {
			cik: submissions.cik,
			companyName: submissions.name,
			form: recent.form[i],
			filed,
			reportDate: recent.reportDate?.[i],
			accessionNumber: recent.accessionNumber?.[i],
			primaryDocument: recent.primaryDocument?.[i],
		};
	}

	// If no filing matches the requested year, return the most recent match by form.
	for (let i = 0; i < recent.form.length; i++) {
		if (recent.form[i]?.toUpperCase() !== cleanedForm) continue;
		const filed = recent.filingDate[i];
		if (!filed) continue;

		return {
			cik: submissions.cik,
			companyName: submissions.name,
			form: recent.form[i],
			filed,
			reportDate: recent.reportDate?.[i],
			accessionNumber: recent.accessionNumber?.[i],
			primaryDocument: recent.primaryDocument?.[i],
		};
	}

	return null;
}

/**
 * Build the SEC document URL from a filing match.
 */
export function buildDocumentUrl(match: FilingMatch): string {
	const bareAccession = (match.accessionNumber || "").replace(/-/g, "");
	return `https://www.sec.gov/Archives/edgar/data/${Number(match.cik)}/${bareAccession}/${match.primaryDocument}`;
}

/**
 * Helper to build a simple error response for API routes.
 */
export function jsonError(message: string, status = 400) {
	return NextResponse.json({ error: message }, { status });
}


