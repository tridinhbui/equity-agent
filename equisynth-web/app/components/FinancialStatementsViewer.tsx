"use client";

import { useState, useEffect } from "react";

interface FinancialStatementsViewerProps {
	ticker: string;
	form: string;
	filed: string;
}

export default function FinancialStatementsViewer({
	ticker,
	form,
	filed,
}: FinancialStatementsViewerProps) {
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<any>(null);
	const [error, setError] = useState("");
	const [activeTab, setActiveTab] = useState<
		"income" | "balance" | "cashflow" | "all"
	>("all");
	const [volume, setVolume] = useState<number | null>(null);

	useEffect(() => {
		loadFinancials();
		loadVolume();
	}, [ticker, form, filed]);

	async function loadVolume() {
		try {
			const res = await fetch(`/api/market/quote?ticker=${ticker}`);
			if (res.ok) {
				const quoteData = await res.json();
				if (quoteData.volume) {
					// Check if volume might be already divided (if < 1000 and has decimal, likely already in millions)
					let volumeNum = quoteData.volume;
					if (volumeNum > 0.1 && volumeNum < 1000 && volumeNum % 1 !== 0) {
						// Likely already divided by 1,000,000, so multiply back
						volumeNum = volumeNum * 1_000_000;
					}
					setVolume(volumeNum);
				}
			}
		} catch (err) {
			// Silently fail - volume is optional
			console.log("Failed to load volume:", err);
		}
	}

	async function loadFinancials() {
		setLoading(true);
		setError("");
		setData(null);
		try {
			const res = await fetch(
				`/api/data/financials?ticker=${ticker}&form=${form}&filed=${filed}`
			);
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || "Failed to load financials");
			}
			const result = await res.json();
			setData(result);
		} catch (err: any) {
			setError(err?.message || "Unknown error");
		} finally {
			setLoading(false);
		}
	}

	if (loading) {
		return (
			<div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					📊 Financial Statements
				</h2>
				<div className="flex items-center justify-center py-12">
					<svg
						className="animate-spin h-8 w-8 text-indigo-600"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span className="ml-3 text-lg text-gray-600">
						Parsing financial statements...
					</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					📊 Financial Statements
				</h2>
				<div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
					<p className="text-base text-yellow-800 font-medium mb-2">{error}</p>
					<p className="text-sm text-yellow-700">
						Make sure you've run "Download & Parse" on the Data Extractor Agent first.
					</p>
				</div>
			</div>
		);
	}

	if (!data) return null;

	const incomeStatements = data.tables.filter(
		(t: any) => t.type === "income_statement"
	);
	const balanceSheets = data.tables.filter(
		(t: any) => t.type === "balance_sheet"
	);
	const cashFlowStatements = data.tables.filter(
		(t: any) => t.type === "cash_flow"
	);
	const otherTables = data.tables.filter((t: any) => t.type === "other");

	function formatVolume(vol: number | null): string {
		if (vol == null || vol === 0) return "N/A";
		// Format volume consistently: use B for billions, M for millions, K for thousands
		if (Math.abs(vol) >= 1_000_000_000) {
			return `${(vol / 1_000_000_000).toFixed(2)}B shares`;
		}
		if (Math.abs(vol) >= 1_000_000) {
			return `${(vol / 1_000_000).toFixed(2)}M shares`;
		}
		if (Math.abs(vol) >= 1_000) {
			return `${(vol / 1_000).toFixed(2)}K shares`;
		}
		return `${vol.toLocaleString()} shares`;
	}

	function renderTable(table: any, index: number) {
		// Skip tables with no data or empty data
		if (!table.data || !Array.isArray(table.data) || table.data.length === 0) {
			return (
				<div
					key={index}
					className="bg-gray-50 rounded-lg p-6 border border-gray-200"
				>
					<h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
						{table.type === "income_statement" && "📈"}
						{table.type === "balance_sheet" && "⚖️"}
						{table.type === "cash_flow" && "💰"}
						{table.type === "other" && "📋"}
						{table.type.replace(/_/g, " ").toUpperCase()} #{index + 1}
					</h4>
					<p className="text-gray-500 text-sm">No data available for this table.</p>
				</div>
			);
		}

		// Prepare table data - add volume row for income statements
		const tableRows = [...table.data.slice(1)];
		const isIncomeStatement = table.type === "income_statement";
		const headerRow = table.data[0] || [];
		const numColumns = headerRow.length;

		// Add volume row for income statements
		if (isIncomeStatement && volume != null && volume > 0) {
			const volumeRow = new Array(numColumns).fill("");
			volumeRow[0] = "Volume (24h)";
			// Fill the first data column with volume, leave others empty
			if (numColumns > 1) {
				volumeRow[1] = formatVolume(volume);
			}
			tableRows.push(volumeRow);
		}

		return (
			<div
				key={index}
				className="bg-gray-50 rounded-lg p-6 border border-gray-200"
			>
				<div className="mb-4">
					<h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						{table.type === "income_statement" && "📈"}
						{table.type === "balance_sheet" && "⚖️"}
						{table.type === "cash_flow" && "💰"}
						{table.type === "other" && "📋"}
						{table.type.replace(/_/g, " ").toUpperCase()} #{index + 1}
					</h4>
					<p className="text-xs text-gray-500 mt-1">
						Note: Empty columns preserved as in original SEC filing. Dollar amounts in millions.
					</p>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="bg-gray-200">
								{headerRow.map((header: string, i: number) => (
									<th
										key={i}
										className="px-4 py-2 text-left font-semibold text-gray-700"
									>
										{header}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{tableRows.map((row: string[], rowIndex: number) => {
								const isVolumeRow = isIncomeStatement && rowIndex === tableRows.length - 1 && volume != null && volume > 0;
								return (
									<tr
										key={rowIndex}
										className={`${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-100"} ${isVolumeRow ? "font-semibold bg-blue-50" : ""}`}
									>
										{row?.map((cell: string, cellIndex: number) => (
											<td key={cellIndex} className={`px-4 py-2 ${isVolumeRow ? "text-blue-700" : "text-gray-800"}`}>
												{cell}
											</td>
										))}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-gray-900">
					📊 Financial Statements
				</h2>
				<button
					onClick={loadFinancials}
					className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
				>
					🔄 Refresh
				</button>
			</div>

			{/* Tabs */}
			<div className="flex gap-2 mb-6 flex-wrap">
				<button
					onClick={() => setActiveTab("all")}
					className={`px-4 py-2 rounded-lg font-medium transition-all ${
						activeTab === "all"
							? "bg-indigo-600 text-white"
							: "bg-gray-200 text-gray-700 hover:bg-gray-300"
					}`}
				>
					All ({data.tablesCount})
				</button>
				<button
					onClick={() => setActiveTab("income")}
					className={`px-4 py-2 rounded-lg font-medium transition-all ${
						activeTab === "income"
							? "bg-indigo-600 text-white"
							: "bg-gray-200 text-gray-700 hover:bg-gray-300"
					}`}
				>
					📈 Income ({incomeStatements.length})
				</button>
				<button
					onClick={() => setActiveTab("balance")}
					className={`px-4 py-2 rounded-lg font-medium transition-all ${
						activeTab === "balance"
							? "bg-indigo-600 text-white"
							: "bg-gray-200 text-gray-700 hover:bg-gray-300"
					}`}
				>
					⚖️ Balance ({balanceSheets.length})
				</button>
				<button
					onClick={() => setActiveTab("cashflow")}
					className={`px-4 py-2 rounded-lg font-medium transition-all ${
						activeTab === "cashflow"
							? "bg-indigo-600 text-white"
							: "bg-gray-200 text-gray-700 hover:bg-gray-300"
					}`}
				>
					💰 Cash Flow ({cashFlowStatements.length})
				</button>
			</div>

			{/* Tables */}
			<div className="space-y-6">
				{activeTab === "all" && (
					<>
						{incomeStatements.length > 0 && (
							<div>
								<h3 className="text-xl font-bold text-gray-800 mb-4">
									📈 Income Statements
								</h3>
								<div className="space-y-4">
									{incomeStatements.map(renderTable)}
								</div>
							</div>
						)}
						{balanceSheets.length > 0 && (
							<div>
								<h3 className="text-xl font-bold text-gray-800 mb-4">
									⚖️ Balance Sheets
								</h3>
								<div className="space-y-4">{balanceSheets.map(renderTable)}</div>
							</div>
						)}
						{cashFlowStatements.length > 0 && (
							<div>
								<h3 className="text-xl font-bold text-gray-800 mb-4">
									💰 Cash Flow Statements
								</h3>
								<div className="space-y-4">
									{cashFlowStatements.map(renderTable)}
								</div>
							</div>
						)}
						{otherTables.length > 0 && (
							<div>
								<h3 className="text-xl font-bold text-gray-800 mb-4">
									📋 Other Tables
								</h3>
								<div className="space-y-4">{otherTables.map(renderTable)}</div>
							</div>
						)}
					</>
				)}
				{activeTab === "income" && (
					<div className="space-y-4">{incomeStatements.map(renderTable)}</div>
				)}
				{activeTab === "balance" && (
					<div className="space-y-4">{balanceSheets.map(renderTable)}</div>
				)}
				{activeTab === "cashflow" && (
					<div className="space-y-4">
						{cashFlowStatements.map(renderTable)}
					</div>
				)}
			</div>

			{data.tablesCount === 0 && (
				<p className="text-center text-gray-500 py-8">
					No financial tables found in this filing.
				</p>
			)}
		</div>
	);
}

