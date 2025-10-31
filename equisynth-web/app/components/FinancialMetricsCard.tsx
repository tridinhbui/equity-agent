"use client";

import { useState } from "react";

interface FinancialMetricsCardProps {
	ticker: string;
	form: string;
	filed: string;
}

export default function FinancialMetricsCard({ ticker, form, filed }: FinancialMetricsCardProps) {
	const [metrics, setMetrics] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function loadFinancials() {
		setLoading(true);
		setError("");
		try {
			const res = await fetch(`/api/data/financials?ticker=${ticker}&form=${form}&filed=${filed}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			setMetrics(data.keyMetrics);
		} catch (err: any) {
			setError(err?.message || "Failed to load financials");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="rounded border p-4 bg-white shadow-sm">
			<div className="flex justify-between items-center mb-3">
				<h3 className="font-semibold text-lg">Financial Metrics (SEC Filing)</h3>
				<button
					onClick={loadFinancials}
					disabled={loading}
					className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? "Loading..." : "Extract Metrics"}
				</button>
			</div>

			{error && <p className="text-sm text-red-600 mb-2">{error}</p>}

			{metrics && (
				<div className="space-y-4">
					{/* Income Statement Metrics */}
					{(metrics.revenue || metrics.netIncome) && (
						<div>
							<h4 className="font-medium text-sm text-gray-700 mb-2">Income Statement</h4>
							<div className="grid grid-cols-2 gap-2 text-sm">
								{metrics.revenue && (
									<div>
										<span className="text-gray-600">Revenue:</span>{" "}
										<span className="font-medium">
											${(Number(metrics.revenue) / 1e9).toFixed(2)}B
										</span>
									</div>
								)}
								{metrics.grossProfit && (
									<div>
										<span className="text-gray-600">Gross Profit:</span>{" "}
										<span className="font-medium">
											${(Number(metrics.grossProfit) / 1e9).toFixed(2)}B
										</span>
									</div>
								)}
								{metrics.operatingIncome && (
									<div>
										<span className="text-gray-600">Operating Income:</span>{" "}
										<span className="font-medium">
											${(Number(metrics.operatingIncome) / 1e9).toFixed(2)}B
										</span>
									</div>
								)}
								{metrics.netIncome && (
									<div>
										<span className="text-gray-600">Net Income:</span>{" "}
										<span className="font-medium">
											${(Number(metrics.netIncome) / 1e9).toFixed(2)}B
										</span>
									</div>
								)}
								{metrics.grossMargin && (
									<div>
										<span className="text-gray-600">Gross Margin:</span>{" "}
										<span className="font-medium">{metrics.grossMargin.toFixed(2)}%</span>
									</div>
								)}
								{metrics.operatingMargin && (
									<div>
										<span className="text-gray-600">Operating Margin:</span>{" "}
										<span className="font-medium">{metrics.operatingMargin.toFixed(2)}%</span>
									</div>
								)}
								{metrics.netMargin && (
									<div>
										<span className="text-gray-600">Net Margin:</span>{" "}
										<span className="font-medium">{metrics.netMargin.toFixed(2)}%</span>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Balance Sheet Metrics */}
					{(metrics.totalAssets || metrics.totalEquity) && (
						<div className="border-t pt-3">
							<h4 className="font-medium text-sm text-gray-700 mb-2">Balance Sheet</h4>
							<div className="grid grid-cols-2 gap-2 text-sm">
								{metrics.totalAssets && (
									<div>
										<span className="text-gray-600">Total Assets:</span>{" "}
										<span className="font-medium">
											${(Number(metrics.totalAssets) / 1e9).toFixed(2)}B
										</span>
									</div>
								)}
								{metrics.totalLiabilities && (
									<div>
										<span className="text-gray-600">Total Liabilities:</span>{" "}
										<span className="font-medium">
											${(Number(metrics.totalLiabilities) / 1e9).toFixed(2)}B
										</span>
									</div>
								)}
								{metrics.totalEquity && (
									<div>
										<span className="text-gray-600">Shareholders' Equity:</span>{" "}
										<span className="font-medium">
											${(Number(metrics.totalEquity) / 1e9).toFixed(2)}B
										</span>
									</div>
								)}
								{metrics.cash && (
									<div>
										<span className="text-gray-600">Cash:</span>{" "}
										<span className="font-medium">
											${(Number(metrics.cash) / 1e9).toFixed(2)}B
										</span>
									</div>
								)}
								{metrics.currentRatio && (
									<div>
										<span className="text-gray-600">Current Ratio:</span>{" "}
										<span className="font-medium">{metrics.currentRatio.toFixed(2)}</span>
									</div>
								)}
								{metrics.debtToEquity && (
									<div>
										<span className="text-gray-600">D/E Ratio:</span>{" "}
										<span className="font-medium">{metrics.debtToEquity.toFixed(2)}</span>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Cash Flow Metrics */}
					{(metrics.operatingCashFlow || metrics.freeCashFlow) && (
						<div className="border-t pt-3">
							<h4 className="font-medium text-sm text-gray-700 mb-2">Cash Flow</h4>
							<div className="grid grid-cols-2 gap-2 text-sm">
								{metrics.operatingCashFlow && (
									<div>
										<span className="text-gray-600">Operating CF:</span>{" "}
										<span className="font-medium">
											${(Number(metrics.operatingCashFlow) / 1e9).toFixed(2)}B
										</span>
									</div>
								)}
								{metrics.freeCashFlow && (
									<div>
										<span className="text-gray-600">Free CF:</span>{" "}
										<span className="font-medium">
											${(Number(metrics.freeCashFlow) / 1e9).toFixed(2)}B
										</span>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

