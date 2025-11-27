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

		/**
		 * Format number with thousand separators
		 */
		const formatNumber = (num: number): string => {
			if (Number.isInteger(num)) {
				return num.toLocaleString("en-US");
			}
			return num.toLocaleString("en-US", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			});
		};

		/**
		 * Format number for balance sheet (negative numbers with minus sign)
		 */
		const formatBalanceSheetNumber = (num: number): string => {
			const formatted = formatNumber(Math.abs(num));
			// If negative, prefix with minus sign
			if (num < 0) {
				return `-${formatted}`;
			}
			return formatted;
		};

		/**
		 * Special formatting for income statement:
		 * - Merge "$" with following number (e.g., "$", 294866 -> "$294,866")
		 * - Group columns with same index together (remove nulls between values)
		 */
		const formatIncomeStatementValues = (
			values: (string | number | null)[]
		): string[] => {
			const formatted: string[] = [];
			let i = 0;

			while (i < values.length) {
				// If we encounter "$"
				if (values[i] === "$") {
					// Check if next value is a number
					if (
						i + 1 < values.length &&
						typeof values[i + 1] === "number"
					) {
						const num = values[i + 1] as number;
						formatted.push(`$${formatNumber(num)}`);
						i += 2; // Skip both "$" and the number
					} else {
						formatted.push("$");
						i += 1;
					}
				}
				// If we encounter a number (without "$" before it)
				else if (typeof values[i] === "number") {
					formatted.push(formatNumber(values[i] as number));
					i += 1;
				}
				// Skip null values
				else if (values[i] === null || values[i] === undefined) {
					i += 1;
				}
				// Other values (strings)
				else {
					formatted.push(String(values[i]));
					i += 1;
				}
			}

			return formatted;
		};

		/**
		 * Special formatting for balance sheet:
		 * - Merge "$" with following number (e.g., "$", 294866 -> "$294,866")
		 * - Format negative numbers with minus sign (e.g., -1234 -> "-1,234")
		 * - Group columns with same index together (remove nulls between values)
		 */
		const formatBalanceSheetValues = (
			values: (string | number | null)[]
		): string[] => {
			const formatted: string[] = [];
			let i = 0;

			while (i < values.length) {
				// If we encounter "$"
				if (values[i] === "$") {
					// Check if next value is a number
					if (
						i + 1 < values.length &&
						typeof values[i + 1] === "number"
					) {
						const num = values[i + 1] as number;
						// Format number (with parentheses if negative)
						const formattedNum = formatBalanceSheetNumber(num);
						formatted.push(`$${formattedNum}`);
						i += 2; // Skip both "$" and the number
					} else {
						formatted.push("$");
						i += 1;
					}
				}
				// If we encounter a number (without "$" before it)
				else if (typeof values[i] === "number") {
					const num = values[i] as number;
					formatted.push(formatBalanceSheetNumber(num));
					i += 1;
				}
				// Skip null values
				else if (values[i] === null || values[i] === undefined) {
					i += 1;
				}
				// Other values (strings)
				else {
					formatted.push(String(values[i]));
					i += 1;
				}
			}

			return formatted;
		};

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

				// Special formatting for income statement
				if (t.type === "income_statement") {
					const formattedValues = formatIncomeStatementValues(
						row.values
					);
					dataRow.push(...formattedValues);
				}
				// Special formatting for balance sheet (handles parentheses for negative numbers)
				else if (t.type === "balance_sheet") {
					const formattedValues = formatBalanceSheetValues(
						row.values
					);
					dataRow.push(...formattedValues);
				} else {
					// Default formatting for other table types
					for (const value of row.values) {
						if (value === null || value === undefined) {
							dataRow.push("");
						} else if (typeof value === "number") {
							// Format numbers with thousand separators
							dataRow.push(formatNumber(value));
						} else {
							dataRow.push(String(value));
						}
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

