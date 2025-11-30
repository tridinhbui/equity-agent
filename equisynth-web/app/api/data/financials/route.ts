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
		 * - Handle positive numbers followed by ")" -> wrap in parentheses (e.g., 4738, ")" -> "(4,738)")
		 * - Group columns with same index together (remove nulls between values)
		 */
		const formatIncomeStatementValues = (
			values: (string | number | null)[]
		): string[] => {
			const formatted: string[] = [];
			let i = 0;

			// Helper function to find next non-null value
			const findNextNonNull = (startIdx: number): {
				value: string | number | null;
				index: number;
			} => {
				for (let j = startIdx; j < values.length; j++) {
					if (values[j] !== null && values[j] !== undefined) {
						return { value: values[j], index: j };
					}
				}
				return { value: null, index: values.length };
			};

			while (i < values.length) {
				// If we encounter "$"
				if (values[i] === "$") {
					const nextNonNull = findNextNonNull(i + 1);
					// Check if next non-null value is a number
					if (
						nextNonNull.value !== null &&
						typeof nextNonNull.value === "number"
					) {
						const num = nextNonNull.value as number;
						const afterNum = findNextNonNull(nextNonNull.index + 1);
						
						// Check if number is followed by ")"
						if (afterNum.value === ")") {
							// Format as (number) with $ prefix
							const formattedNum = formatNumber(Math.abs(num));
							formatted.push(`$(${formattedNum})`);
							i = afterNum.index + 1; // Skip "$", number, nulls, and ")"
						} else {
							// Normal format
							formatted.push(`$${formatNumber(num)}`);
							i = nextNonNull.index + 1; // Skip "$" and number
						}
					} else {
						formatted.push("$");
						i += 1;
					}
				}
				// If we encounter a number (without "$" before it)
				else if (typeof values[i] === "number") {
					const num = values[i] as number;
					const nextNonNull = findNextNonNull(i + 1);
					
					// Check if number is followed by ")"
					if (nextNonNull.value === ")") {
						// Format as (number)
						const formattedNum = formatNumber(Math.abs(num));
						formatted.push(`(${formattedNum})`);
						i = nextNonNull.index + 1; // Skip number, nulls, and ")"
					}
					// Check if number is followed by "%"
					else if (nextNonNull.value === "%") {
						// Format as number%
						const formattedNum = formatNumber(Math.abs(num));
						formatted.push(`${formattedNum}%`);
						i = nextNonNull.index + 1; // Skip number, nulls, and "%"
					} else {
						// Normal format
						formatted.push(formatNumber(num));
						i += 1;
					}
				}
				// Skip null values
				else if (values[i] === null || values[i] === undefined) {
					i += 1;
				}
				// Skip ")" if we've already processed it
				else if (values[i] === ")") {
					i += 1;
				}
				// Keep "%" as is if it's standalone (not merged with number)
				// This handles cases like "$", null, "%" where "%" is separate
				else if (values[i] === "%") {
					formatted.push("%");
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
		 * - Handle positive numbers followed by ")" -> wrap in parentheses (e.g., 4738, ")" -> "(4,738)")
		 * - Group columns with same index together (remove nulls between values)
		 */
		const formatBalanceSheetValues = (
			values: (string | number | null)[]
		): string[] => {
			const formatted: string[] = [];
			let i = 0;

			// Helper function to find next non-null value
			const findNextNonNull = (startIdx: number): {
				value: string | number | null;
				index: number;
			} => {
				for (let j = startIdx; j < values.length; j++) {
					if (values[j] !== null && values[j] !== undefined) {
						return { value: values[j], index: j };
					}
				}
				return { value: null, index: values.length };
			};

			while (i < values.length) {
				// If we encounter "$"
				if (values[i] === "$") {
					const nextNonNull = findNextNonNull(i + 1);
					// Check if next non-null value is a number
					if (
						nextNonNull.value !== null &&
						typeof nextNonNull.value === "number"
					) {
						const num = nextNonNull.value as number;
						const afterNum = findNextNonNull(nextNonNull.index + 1);
						
						// Check if number is followed by ")"
						if (afterNum.value === ")") {
							// Format as (number) with $ prefix
							const formattedNum = formatNumber(Math.abs(num));
							formatted.push(`$(${formattedNum})`);
							i = afterNum.index + 1; // Skip "$", number, nulls, and ")"
						} else {
							// Normal format
							const formattedNum = formatBalanceSheetNumber(num);
							formatted.push(`$${formattedNum}`);
							i = nextNonNull.index + 1; // Skip "$" and number
						}
					} else {
						formatted.push("$");
						i += 1;
					}
				}
				// If we encounter a number (without "$" before it)
				else if (typeof values[i] === "number") {
					const num = values[i] as number;
					const nextNonNull = findNextNonNull(i + 1);
					
					// Check if number is followed by ")"
					if (nextNonNull.value === ")") {
						// Format as (number)
						const formattedNum = formatNumber(Math.abs(num));
						formatted.push(`(${formattedNum})`);
						i = nextNonNull.index + 1; // Skip number, nulls, and ")"
					} else {
						// Normal format
						formatted.push(formatBalanceSheetNumber(num));
						i += 1;
					}
				}
				// Skip null values
				else if (values[i] === null || values[i] === undefined) {
					i += 1;
				}
				// Skip ")" if we've already processed it
				else if (values[i] === ")") {
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
		 * Check if a string contains a year (4-digit number like 2024, 2023, etc.)
		 */
		const containsYear = (text: string): boolean => {
			if (!text || !text.trim()) return false;
			// Check for 4-digit years (1900-2099)
			return /\b(19|20)\d{2}\b/.test(text);
		};

		/**
		 * Format balance sheet headers: headers with years align with value columns
		 */
		const formatBalanceSheetHeaders = (
			headers: string[],
			allRowValues: (string | number | null)[][]
		): string[] => {
			// Find headers that contain years
			const yearHeaders: { header: string; index: number }[] = [];
			for (let i = 0; i < headers.length; i++) {
				if (headers[i] && containsYear(headers[i])) {
					yearHeaders.push({ header: headers[i].trim(), index: i });
				}
			}

			if (yearHeaders.length === 0) {
				return [];
			}

			// Find a representative row to determine number of formatted columns
			let representativeRow: (string | number | null)[] | null = null;
			for (const rowValues of allRowValues) {
				if (rowValues && rowValues.length > 0) {
					const hasData = rowValues.some(
						(v) =>
							v !== null &&
							v !== undefined &&
							(typeof v === "number" || v === "$" || v !== "")
					);
					if (hasData) {
						representativeRow = rowValues;
						break;
					}
				}
			}

			if (!representativeRow) {
				return yearHeaders.map((h) => h.header);
			}

			// Format the representative row to get the number of columns
			const formattedRepRow = formatBalanceSheetValues(representativeRow);

			// Map year headers to formatted columns
			const formattedHeaders: string[] = [];
			for (let i = 0; i < formattedRepRow.length; i++) {
				if (i < yearHeaders.length) {
					formattedHeaders.push(yearHeaders[i].header);
				} else {
					formattedHeaders.push("");
				}
			}

			return formattedHeaders;
		};

		// Convert parsed tables to format expected by FinancialStatementsViewer
		// Component expects: table.data = string[][] (2D array with headers in first row)
		const tables = tablesData.parsed.map((t) => {
			// Build 2D array: first row is headers, subsequent rows are data
			const data: string[][] = [];

			// Handle headers differently for balance sheet vs income statement
			let formattedHeaders: string[] = [];
			if (t.type === "balance_sheet") {
				// Balance sheet: headers with years align with value columns
				const allRowValues: (string | number | null)[][] = [];
				for (const row of t.rows) {
					allRowValues.push(row.values);
				}
				formattedHeaders = formatBalanceSheetHeaders(
					t.headers,
					allRowValues
				);
				// Add header row (empty label column + formatted headers)
				data.push(["", ...formattedHeaders]);
			} else if (t.type === "income_statement") {
				// Income statement: 
				// - Header without year (like "In millions...") → align with label column
				// - Headers with years (2024, 2023) or "PercentageChange" → align with value columns
				const allRowValues: (string | number | null)[][] = [];
				for (const row of t.rows) {
					allRowValues.push(row.values);
				}
				
				// Find representative row to determine column count
				let representativeRow: (string | number | null)[] | null = null;
				for (const rowValues of allRowValues) {
					if (rowValues && rowValues.length > 0) {
						const hasData = rowValues.some(
							(v) =>
								v !== null &&
								v !== undefined &&
								(typeof v === "number" || v === "$" || v !== "")
						);
						if (hasData) {
							representativeRow = rowValues;
							break;
						}
					}
				}
				
				// Find label header (first non-empty header that doesn't contain year and isn't "PercentageChange")
				let labelHeader = "";
				for (const header of t.headers) {
					if (header && header.trim()) {
						const trimmed = header.trim();
						if (!containsYear(trimmed) && trimmed !== "PercentageChange") {
							labelHeader = trimmed;
							break;
						}
					}
				}
				
				// Find value headers (headers with years or "PercentageChange")
				const valueHeaderIndices: { header: string; index: number }[] = [];
				for (let i = 0; i < t.headers.length; i++) {
					if (t.headers[i] && t.headers[i].trim()) {
						const trimmed = t.headers[i].trim();
						if (containsYear(trimmed) || trimmed === "PercentageChange") {
							valueHeaderIndices.push({ header: trimmed, index: i });
						}
					}
				}
				
				// Format representative row to get number of value columns
				let valueHeaders: string[] = [];
				if (representativeRow) {
					const formattedRepRow = formatIncomeStatementValues(representativeRow);
					// Map value headers to formatted columns
					for (let i = 0; i < formattedRepRow.length; i++) {
						if (i < valueHeaderIndices.length) {
							valueHeaders.push(valueHeaderIndices[i].header);
						} else {
							valueHeaders.push("");
						}
					}
				}
				
				// Label header goes to label column, value headers go to value columns
				data.push([labelHeader, ...valueHeaders]);
			} else {
				// Default: use original headers
				data.push(t.headers);
			}

			// Add data rows
			for (const row of t.rows) {
				let label = row.label; // First column is label
				let formattedValues: string[] = [];

				// Special formatting for income statement
				if (t.type === "income_statement") {
					formattedValues = formatIncomeStatementValues(row.values);
				}
				// Special formatting for balance sheet (handles parentheses for negative numbers)
				else if (t.type === "balance_sheet") {
					formattedValues = formatBalanceSheetValues(row.values);
				} else {
					// Default formatting for other table types
					for (const value of row.values) {
						if (value === null || value === undefined) {
							formattedValues.push("");
						} else if (typeof value === "number") {
							// Format numbers with thousand separators
							formattedValues.push(formatNumber(value));
						} else {
							formattedValues.push(String(value));
						}
					}
				}

				// Check if values are empty (all empty strings or no values)
				const hasValues = formattedValues.some(
					(v) => v && v.trim() && v.trim() !== ""
				);

				// If no values, format label with colon and mark for bold
				if (!hasValues && label) {
					// Check if label already ends with colon, if so don't add another one
					const trimmedLabel = label.trim();
					if (trimmedLabel.endsWith(":")) {
						label = `**${trimmedLabel}**`;
					} else {
						label = `**${trimmedLabel}:**`;
					}
				}

				const dataRow: string[] = [label, ...formattedValues];
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


