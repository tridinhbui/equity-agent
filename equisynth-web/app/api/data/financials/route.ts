import { NextRequest, NextResponse } from "next/server";
import {
	getFilingPath,
	readJSONFile,
	fileExists,
} from "@/app/lib/dataStorage";
import { extractKeyMetrics, FinancialTable } from "@/app/lib/financialTableParser";

export const runtime = "nodejs";

/**
 * GET /api/data/financials
 * Get financial metrics from parsed tables
 */
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const ticker = searchParams.get("ticker");
		const form = searchParams.get("form");
		const filed = searchParams.get("filed");

		if (!ticker || !form || !filed) {
			return NextResponse.json(
				{ error: "ticker, form, and filed are required" },
				{ status: 400 }
			);
		}

		const tablesPath = getFilingPath(ticker, form, filed, "tables.json");
		const tablesExist = await fileExists(tablesPath);

		if (!tablesExist) {
			return NextResponse.json(
				{ error: "tables.json not found. Please run ingest first." },
				{ status: 404 }
			);
		}

		const tablesData = await readJSONFile<{
			raw: string[][][];
			parsed: FinancialTable[];
			count: number;
		}>(tablesPath);

		if (!tablesData || !tablesData.parsed) {
			return NextResponse.json(
				{ error: "No parsed tables found. Please run ingest first." },
				{ status: 404 }
			);
		}

		// Extract key metrics
		const keyMetrics = extractKeyMetrics(tablesData.parsed);

		// Convert parsed tables to format expected by FinancialStatementsViewer
		// Component expects: table.data = string[][] (2D array with headers in first row)
		const tables = tablesData.parsed.map((t) => {
			// Build 2D array: first row is headers, subsequent rows are data
			const data: string[][] = [];
			
			// Add header row
			data.push(t.headers);
			
			// Add data rows
			for (const row of t.rows) {
				const dataRow: string[] = [row.label]; // First column is label
				// Add values (convert to string, handle null/undefined)
				for (const value of row.values) {
					if (value === null || value === undefined) {
						dataRow.push("");
					} else if (typeof value === "number") {
						// Format numbers with thousand separators
						dataRow.push(value.toLocaleString("en-US"));
					} else {
						dataRow.push(String(value));
					}
				}
				data.push(dataRow);
			}
			
			return {
				type: t.type,
				title: t.title,
				data: data,
			};
		});

		return NextResponse.json({
			ticker: ticker.toUpperCase(),
			form,
			filed,
			keyMetrics,
			tables: tables,
			tablesCount: tables.length,
		});
	} catch (error: any) {
		console.error("Financials error:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to get financials" },
			{ status: 500 }
		);
	}
}

