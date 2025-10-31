"use client";

import { useState, useEffect } from "react";

interface MetricsInterpreterProps {
	ticker: string;
	form: string;
	filed: string;
}

export default function MetricsInterpreter({
	ticker,
	form,
	filed,
}: MetricsInterpreterProps) {
	const [loading, setLoading] = useState(false);
	const [metrics, setMetrics] = useState<any>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		loadMetrics();
	}, [ticker, form, filed]);

	async function loadMetrics() {
		setLoading(true);
		setError("");
		setMetrics(null);
		try {
			const res = await fetch(
				`/api/data/financials?ticker=${ticker}&form=${form}&filed=${filed}`
			);
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || "Failed to load metrics");
			}
			const result = await res.json();
			setMetrics(result.keyMetrics);
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
					📈 Key Metrics & Ratios
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
						Calculating metrics...
					</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					📈 Key Metrics & Ratios
				</h2>
				<div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
					<p className="text-base text-yellow-800 font-medium">{error}</p>
				</div>
			</div>
		);
	}

	if (!metrics || Object.keys(metrics).length === 0) {
		return (
			<div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					📈 Key Metrics & Ratios
				</h2>
				<p className="text-center text-gray-500 py-8">
					No key metrics could be extracted from the financial statements.
				</p>
			</div>
		);
	}

	function formatNumber(num: number | null | undefined): string {
		if (num === null || num === undefined || isNaN(num)) return "N/A";
		if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
		if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
		if (Math.abs(num) >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
		return `$${num.toFixed(2)}`;
	}

	function formatPercent(num: number | null | undefined): string {
		if (num === null || num === undefined || isNaN(num)) return "N/A";
		return `${(num * 100).toFixed(2)}%`;
	}

	// For metrics that are already in percentage format (e.g., ROE = 164.59)
	function formatPercentDirect(num: number | null | undefined): string {
		if (num === null || num === undefined || isNaN(num)) return "N/A";
		return `${num.toFixed(2)}%`;
	}

	function formatRatio(num: number | null | undefined): string {
		if (num === null || num === undefined || isNaN(num)) return "N/A";
		return num.toFixed(2);
	}

	return (
		<div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-gray-900">
					📈 Key Metrics & Ratios
				</h2>
				<button
					onClick={loadMetrics}
					className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
				>
					🔄 Refresh
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Revenue */}
				{metrics.revenue !== undefined && (
					<div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
						<p className="text-sm text-blue-700 font-medium mb-1">Revenue</p>
						<p className="text-2xl font-bold text-blue-900">
							{formatNumber(metrics.revenue)}
						</p>
					</div>
				)}

				{/* Net Income */}
				{metrics.netIncome !== undefined && (
					<div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
						<p className="text-sm text-green-700 font-medium mb-1">Net Income</p>
						<p className="text-2xl font-bold text-green-900">
							{formatNumber(metrics.netIncome)}
						</p>
					</div>
				)}

				{/* Total Assets */}
				{metrics.totalAssets !== undefined && (
					<div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
						<p className="text-sm text-purple-700 font-medium mb-1">
							Total Assets
						</p>
						<p className="text-2xl font-bold text-purple-900">
							{formatNumber(metrics.totalAssets)}
						</p>
					</div>
				)}

				{/* Total Liabilities */}
				{metrics.totalLiabilities !== undefined && (
					<div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-5 border border-red-200">
						<p className="text-sm text-red-700 font-medium mb-1">
							Total Liabilities
						</p>
						<p className="text-2xl font-bold text-red-900">
							{formatNumber(metrics.totalLiabilities)}
						</p>
					</div>
				)}

				{/* Shareholders' Equity */}
				{metrics.shareholdersEquity !== undefined && (
					<div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-5 border border-indigo-200">
						<p className="text-sm text-indigo-700 font-medium mb-1">
							Shareholders' Equity
						</p>
						<p className="text-2xl font-bold text-indigo-900">
							{formatNumber(metrics.shareholdersEquity)}
						</p>
					</div>
				)}

				{/* Operating Cash Flow */}
				{metrics.operatingCashFlow !== undefined && (
					<div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-5 border border-teal-200">
						<p className="text-sm text-teal-700 font-medium mb-1">
							Operating Cash Flow
						</p>
						<p className="text-2xl font-bold text-teal-900">
							{formatNumber(metrics.operatingCashFlow)}
						</p>
					</div>
				)}

				{/* Profit Margin */}
				{metrics.profitMargin !== undefined && (
					<div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 border border-amber-200">
						<p className="text-sm text-amber-700 font-medium mb-1">
							Profit Margin
						</p>
						<p className="text-2xl font-bold text-amber-900">
							{formatPercent(metrics.profitMargin)}
						</p>
					</div>
				)}

				{/* ROE */}
				{metrics.roe !== undefined && (
					<div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-5 border border-emerald-200">
						<p className="text-sm text-emerald-700 font-medium mb-1">ROE</p>
						<p className="text-2xl font-bold text-emerald-900">
							{formatPercentDirect(metrics.roe)}
						</p>
					</div>
				)}

				{/* ROA */}
				{metrics.roa !== undefined && (
					<div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-5 border border-cyan-200">
						<p className="text-sm text-cyan-700 font-medium mb-1">ROA</p>
						<p className="text-2xl font-bold text-cyan-900">
							{formatPercentDirect(metrics.roa)}
						</p>
					</div>
				)}

				{/* Debt to Equity */}
				{metrics.debtToEquity !== undefined && (
					<div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-5 border border-rose-200">
						<p className="text-sm text-rose-700 font-medium mb-1">
							Debt to Equity
						</p>
						<p className="text-2xl font-bold text-rose-900">
							{formatRatio(metrics.debtToEquity)}
						</p>
					</div>
				)}

				{/* Current Ratio */}
				{metrics.currentRatio !== undefined && (
					<div className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-lg p-5 border border-lime-200">
						<p className="text-sm text-lime-700 font-medium mb-1">
							Current Ratio
						</p>
						<p className="text-2xl font-bold text-lime-900">
							{formatRatio(metrics.currentRatio)}
						</p>
					</div>
				)}

				{/* Quick Ratio */}
				{metrics.quickRatio !== undefined && (
					<div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200">
						<p className="text-sm text-orange-700 font-medium mb-1">
							Quick Ratio
						</p>
						<p className="text-2xl font-bold text-orange-900">
							{formatRatio(metrics.quickRatio)}
						</p>
					</div>
				)}

				{/* ROIC (Return on Invested Capital) */}
				{metrics.roic !== undefined && (
					<div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-5 border border-violet-200">
						<p className="text-sm text-violet-700 font-medium mb-1">
							ROIC
						</p>
						<p className="text-2xl font-bold text-violet-900">
							{formatPercentDirect(metrics.roic)}
						</p>
						<p className="text-xs text-violet-600 mt-1">
							Return on Invested Capital
						</p>
					</div>
				)}

				{/* WACC (Weighted Average Cost of Capital) */}
				{metrics.wacc !== undefined && (
					<div className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 rounded-lg p-5 border border-fuchsia-200">
						<p className="text-sm text-fuchsia-700 font-medium mb-1">
							WACC
						</p>
						<p className="text-2xl font-bold text-fuchsia-900">
							{formatPercentDirect(metrics.wacc)}
						</p>
						<p className="text-xs text-fuchsia-600 mt-1">
							Weighted Avg. Cost of Capital
						</p>
					</div>
				)}
			</div>

			{/* AI Interpretation (placeholder for future LLM integration) */}
			<div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
				<h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
					🤖 AI Interpretation
				</h3>
				<p className="text-gray-700 leading-relaxed">
					Based on the extracted metrics, the company shows{" "}
					{metrics.profitMargin > 0.15 ? (
						<span className="font-semibold text-green-700">
							strong profitability
						</span>
					) : (
						<span className="font-semibold text-amber-700">
							moderate profitability
						</span>
					)}{" "}
					with a profit margin of {formatPercent(metrics.profitMargin)}.{" "}
					{metrics.roe > 15 && (
						<>
							The ROE of {formatPercentDirect(metrics.roe)} indicates{" "}
							<span className="font-semibold text-green-700">
								efficient use of shareholder equity
							</span>
							.
						</>
					)}{" "}
					{metrics.roic !== undefined && (
						<>
							The ROIC of {formatPercentDirect(metrics.roic)}{" "}
							{metrics.roic > metrics.wacc ? (
								<>
									<span className="font-semibold text-green-700">
										exceeds the WACC
									</span>{" "}
									({formatPercentDirect(metrics.wacc)}), indicating the company is{" "}
									<span className="font-semibold text-green-700">
										creating value
									</span>{" "}
									for shareholders.
								</>
							) : (
								<>
									is{" "}
									{metrics.wacc !== undefined ? (
										<>
											<span className="font-semibold text-amber-700">
												below the WACC
											</span>{" "}
											({formatPercentDirect(metrics.wacc)}), suggesting the company{" "}
											<span className="font-semibold text-amber-700">
												may need to improve capital efficiency
											</span>
											.
										</>
									) : (
										<>shows the return on invested capital.</>
									)}
								</>
							)}
						</>
					)}{" "}
					{metrics.debtToEquity < 1 && (
						<>
							With a debt-to-equity ratio of {formatRatio(metrics.debtToEquity)},{" "}
							the company maintains a{" "}
							<span className="font-semibold text-blue-700">
								conservative capital structure
							</span>
							.
						</>
					)}
				</p>
				<p className="text-sm text-gray-500 mt-3 italic">
					💡 Full LLM-powered analysis will be integrated in the next phase.
				</p>
			</div>
		</div>
	);
}

