import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import {
	getFilingDirectory,
	getFilingPath,
	ensureDirectory,
	writeTextFile,
	writeJSONFile,
} from "@/app/lib/dataStorage";
import { getSecUserAgent } from "@/app/lib/sec";
import { parseAllFinancialTables } from "@/app/lib/financialTableParser";

export const runtime = "nodejs";

/**
 * POST /api/data/ingest
 * Download and parse SEC filing HTML
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { url, ticker, cik, form, filed } = body;

		if (!url || !ticker || !form || !filed) {
			return NextResponse.json(
				{ error: "url, ticker, form, and filed are required" },
				{ status: 400 }
			);
		}

		const dir = getFilingDirectory(ticker, form, filed);
		await ensureDirectory(dir);

		// Download HTML
		const htmlRes = await fetch(url, {
			headers: {
				"User-Agent": getSecUserAgent(),
				Accept: "text/html,application/xhtml+xml",
			},
		});

		if (!htmlRes.ok) {
			throw new Error(`Failed to download filing: ${htmlRes.status} ${htmlRes.statusText}`);
		}

		const html = await htmlRes.text();
		const htmlPath = getFilingPath(ticker, form, filed, "raw.html");
		await writeTextFile(htmlPath, html);

		// Parse HTML with cheerio
		const $ = cheerio.load(html);

		// Extract text content (remove scripts, styles, etc.)
		$("script, style, noscript").remove();
		const text = $("body").text().replace(/\s+/g, " ").trim();
		const textPath = getFilingPath(ticker, form, filed, "text.txt");
		await writeTextFile(textPath, text);

		// Extract tables
		const tables: string[][][] = [];
		$("table").each((_, table) => {
			const tableData: string[][] = [];
			$(table)
				.find("tr")
				.each((_, row) => {
					const rowData: string[] = [];
					$(row)
						.find("td, th")
						.each((_, cell) => {
							rowData.push($(cell).text().trim());
						});
					if (rowData.length > 0) {
						tableData.push(rowData);
					}
				});
			if (tableData.length > 0) {
				tables.push(tableData);
			}
		});

		// Parse financial tables
		const parsedTables = parseAllFinancialTables(tables);

		// Save tables
		const tablesPath = getFilingPath(ticker, form, filed, "tables.json");
		await writeJSONFile(tablesPath, {
			raw: tables,
			parsed: parsedTables,
			count: tables.length,
		});

		return NextResponse.json({
			success: true,
			ticker: ticker.toUpperCase(),
			form,
			filed,
			tables: tables.length,
			parsedTables: parsedTables.length,
			textLength: text.length,
		});
	} catch (error: any) {
		console.error("Ingest error:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to ingest filing" },
			{ status: 500 }
		);
	}
}

