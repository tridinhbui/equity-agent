/**
 * Financial Table Parser
 * Identifies and structures financial statements (Income Statement, Balance Sheet, Cash Flow)
 * from raw table data extracted from SEC filings
 */

export interface FinancialTable {
	type: "income_statement" | "balance_sheet" | "cash_flow" | "segment" | "other";
	title: string;
	headers: string[];
	rows: Array<{
		label: string;
		values: (string | number)[];
	}>;
	metadata: {
		periods: string[];
		hasNegatives: boolean;
		hasPercentages: boolean;
	};
}

/**
 * Detect if a table is likely an Income Statement
 */
function isIncomeStatement(table: string[][]): boolean {
	const text = table.flat().join(" ").toLowerCase();
	const keywords = [
		"revenue",
		"net sales",
		"operating income",
		"gross profit",
		"net income",
		"earnings per share",
		"cost of revenue",
		"income from operations",
	];
	return keywords.filter((k) => text.includes(k)).length >= 3;
}

/**
 * Detect if a table is likely a Balance Sheet
 */
function isBalanceSheet(table: string[][]): boolean {
	const text = table.flat().join(" ").toLowerCase();
	const keywords = [
		"total assets",
		"total liabilities",
		"stockholders' equity",
		"current assets",
		"current liabilities",
		"cash and cash equivalents",
		"retained earnings",
	];
	return keywords.filter((k) => text.includes(k)).length >= 3;
}

/**
 * Detect if a table is likely a Cash Flow Statement
 */
function isCashFlowStatement(table: string[][]): boolean {
	const text = table.flat().join(" ").toLowerCase();
	const keywords = [
		"cash flow",
		"operating activities",
		"investing activities",
		"financing activities",
		"net cash provided",
		"net cash used",
		"depreciation",
	];
	return keywords.filter((k) => text.includes(k)).length >= 3;
}

/**
 * Clean and normalize cell values
 */
function cleanCellValue(val: string): string | number {
	const cleaned = val.trim().replace(/\s+/g, " ");
	
	// Try to parse as number
	// Common formats: 1,234.56  (1,234)  $1,234  123.45%
	const numMatch = cleaned.match(/^[\$]?\(?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\)?[\%]?$/);
	if (numMatch) {
		const num = parseFloat(numMatch[1].replace(/,/g, ""));
		// If parentheses, it's negative
		if (cleaned.includes("(") && cleaned.includes(")")) {
			return -num;
		}
		return num;
	}
	
	return cleaned;
}

/**
 * Extract period headers (dates, years, quarters)
 */
function extractPeriods(headerRow: string[]): string[] {
	return headerRow
		.slice(1) // Skip first column (usually label)
		.map((h) => h.trim())
		.filter((h) => h.length > 0);
}

/**
 * Parse a single financial table
 */
export function parseFinancialTable(rawTable: string[][]): FinancialTable | null {
	if (rawTable.length < 2) return null;

	// Determine table type
	let type: FinancialTable["type"] = "other";
	let title = "Financial Table";
	
	if (isIncomeStatement(rawTable)) {
		type = "income_statement";
		title = "Income Statement";
	} else if (isBalanceSheet(rawTable)) {
		type = "balance_sheet";
		title = "Balance Sheet";
	} else if (isCashFlowStatement(rawTable)) {
		type = "cash_flow";
		title = "Cash Flow Statement";
	}

	// First row is usually headers
	const headerRow = rawTable[0];
	const headers = headerRow.map((h) => h.trim());
	const periods = extractPeriods(headerRow);

	// Parse data rows
	const rows: FinancialTable["rows"] = [];
	let hasNegatives = false;
	let hasPercentages = false;

	for (let i = 1; i < rawTable.length; i++) {
		const row = rawTable[i];
		if (row.length === 0) continue;

		const label = row[0]?.trim() || "";
		if (!label) continue; // Skip empty labels

		const values = row.slice(1).map(cleanCellValue);
		
		// Check for negatives and percentages
		for (const val of values) {
			if (typeof val === "number" && val < 0) hasNegatives = true;
			if (typeof val === "string" && val.includes("%")) hasPercentages = true;
		}

		rows.push({ label, values });
	}

	if (rows.length === 0) return null;

	return {
		type,
		title,
		headers,
		rows,
		metadata: {
			periods,
			hasNegatives,
			hasPercentages,
		},
	};
}

/**
 * Parse all tables and return structured financial tables
 */
export function parseAllFinancialTables(rawTables: string[][][]): FinancialTable[] {
	const results: FinancialTable[] = [];
	
	for (const rawTable of rawTables) {
		const parsed = parseFinancialTable(rawTable);
		if (parsed) {
			results.push(parsed);
		}
	}
	
	return results;
}

/**
 * Extract key metrics from parsed financial tables
 */
export function extractKeyMetrics(tables: FinancialTable[]): Record<string, any> {
	const metrics: Record<string, any> = {};

	// Income Statement metrics
	const incomeStatement = tables.find((t) => t.type === "income_statement");
	if (incomeStatement) {
		for (const row of incomeStatement.rows) {
			const label = row.label.toLowerCase();
			const latestValue = row.values[0];
			
			if (label.includes("revenue") || label.includes("net sales")) {
				metrics.revenue = latestValue;
			}
			if (label.includes("gross profit")) {
				metrics.grossProfit = latestValue;
			}
			if (label.includes("operating income") && !label.includes("non-")) {
				metrics.operatingIncome = latestValue;
			}
			if (label.includes("net income") && !label.includes("per share")) {
				metrics.netIncome = latestValue;
			}
			if (label.includes("earnings per share") || label.includes("eps")) {
				metrics.eps = latestValue;
			}
		}

		// Calculate margins if we have the data
		if (metrics.revenue && metrics.grossProfit) {
			metrics.grossMargin = (Number(metrics.grossProfit) / Number(metrics.revenue)) * 100;
		}
		if (metrics.revenue && metrics.operatingIncome) {
			metrics.operatingMargin = (Number(metrics.operatingIncome) / Number(metrics.revenue)) * 100;
		}
		if (metrics.revenue && metrics.netIncome) {
			metrics.netMargin = (Number(metrics.netIncome) / Number(metrics.revenue)) * 100;
		}
	}

	// Balance Sheet metrics
	const balanceSheet = tables.find((t) => t.type === "balance_sheet");
	if (balanceSheet) {
		for (const row of balanceSheet.rows) {
			const label = row.label.toLowerCase();
			const latestValue = row.values[0];
			
			if (label.includes("total assets")) {
				metrics.totalAssets = latestValue;
			}
			if (label.includes("total liabilities")) {
				metrics.totalLiabilities = latestValue;
			}
			if (label.includes("stockholders' equity") || label.includes("shareholders' equity")) {
				metrics.totalEquity = latestValue;
			}
			if (label.includes("cash and cash equivalents")) {
				metrics.cash = latestValue;
			}
			if (label.includes("current assets")) {
				metrics.currentAssets = latestValue;
			}
			if (label.includes("current liabilities")) {
				metrics.currentLiabilities = latestValue;
			}
		}

		// Calculate ratios
		if (metrics.currentAssets && metrics.currentLiabilities) {
			metrics.currentRatio = Number(metrics.currentAssets) / Number(metrics.currentLiabilities);
		}
		if (metrics.totalLiabilities && metrics.totalEquity) {
			metrics.debtToEquity = Number(metrics.totalLiabilities) / Number(metrics.totalEquity);
		}
		if (metrics.totalEquity && metrics.totalAssets) {
			metrics.equityRatio = (Number(metrics.totalEquity) / Number(metrics.totalAssets)) * 100;
		}
	}

	// Cash Flow metrics
	const cashFlow = tables.find((t) => t.type === "cash_flow");
	if (cashFlow) {
		for (const row of cashFlow.rows) {
			const label = row.label.toLowerCase();
			const latestValue = row.values[0];
			
			if (label.includes("operating activities")) {
				metrics.operatingCashFlow = latestValue;
			}
			if (label.includes("investing activities")) {
				metrics.investingCashFlow = latestValue;
			}
			if (label.includes("financing activities")) {
				metrics.financingCashFlow = latestValue;
			}
			if (label.includes("free cash flow")) {
				metrics.freeCashFlow = latestValue;
			}
		}
	}

	return metrics;
}

