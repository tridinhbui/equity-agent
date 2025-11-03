"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import AgentSurface from "@/components/AgentSurface";
import FinancialStatementsViewer from "@/app/components/FinancialStatementsViewer";
import NarrativeAnalyzer from "@/app/components/NarrativeAnalyzer";
import MetricsInterpreter from "@/app/components/MetricsInterpreter";

export default function FinancialUnderstandingPage() {
	const [ticker, setTicker] = useState("");
	const [formType, setFormType] = useState("10-K");
	const [year, setYear] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [filingInfo, setFilingInfo] = useState<any>(null);
	const [error, setError] = useState<string>("");

	async function fetchFiling(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");
		setFilingInfo(null);
		try {
			const res = await fetch("/api/data/sec", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ticker, formType, year: year || undefined }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Request failed");
			setFilingInfo(data);
		} catch (err: any) {
			setError(err?.message || "Unknown error");
		} finally {
			setLoading(false);
		}
	}

	return (
		<AppShell>
			<div className="bg-grid max-w-7xl mx-auto px-4 md:px-6">
				<div className="agent-teal">
					<AgentSurface
						title="💡 Financial Understanding Agent"
						subtitle="Parse financial statements, extract metrics, and analyze narratives with AI"
						className="mt-6"
					>
						<div className="glass-card p-6 md:p-8">
							<form onSubmit={fetchFiling} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div>
										<label className="block text-base font-medium text-gray-700 mb-2">
											Stock Ticker
										</label>
										<input
											value={ticker}
											onChange={(e) => setTicker(e.target.value)}
											placeholder="e.g., AAPL, MSFT, TSLA"
											className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 ring-agent focus:outline-none transition-all"
											required
										/>
									</div>
									<div>
										<label className="block text-base font-medium text-gray-700 mb-2">
											Filing Type
										</label>
										<select
											value={formType}
											onChange={(e) => setFormType(e.target.value)}
											className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 ring-agent focus:outline-none transition-all"
										>
											<option>10-K</option>
											<option>10-Q</option>
										</select>
									</div>
									<div>
										<label className="block text-base font-medium text-gray-700 mb-2">
											Year (optional)
										</label>
										<input
											value={year}
											onChange={(e) => setYear(e.target.value)}
											placeholder="e.g., 2024"
											className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 ring-agent focus:outline-none transition-all"
										/>
									</div>
								</div>
								<button
									type="submit"
									className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-lg font-semibold hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-xl focus:ring-2 ring-agent focus:outline-none"
									disabled={loading}
								>
									{loading ? (
										<span className="flex items-center justify-center gap-2">
											<svg
												className="animate-spin h-5 w-5"
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
											Loading filing...
										</span>
									) : (
										"🔍 Analyze Filing"
									)}
								</button>
							</form>

							{error && (
								<div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
									<p className="text-base text-red-700 font-medium">{error}</p>
								</div>
							)}
						</div>
					</AgentSurface>

				{/* Analysis Components */}
				{filingInfo && (
					<div className="space-y-6 mt-6">
						{/* Filing Info */}
						<div className="glass-card p-6">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">
								📄 Filing Information
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-base">
								<div className="bg-teal-50 rounded-lg p-4">
									<p className="text-sm text-gray-600 mb-1">Ticker</p>
									<p className="text-lg font-semibold text-gray-900">{ticker.toUpperCase()}</p>
								</div>
								<div className="bg-cyan-50 rounded-lg p-4">
									<p className="text-sm text-gray-600 mb-1">CIK</p>
									<p className="text-lg font-semibold text-gray-900">{filingInfo.cik}</p>
								</div>
								<div className="bg-emerald-50 rounded-lg p-4">
									<p className="text-sm text-gray-600 mb-1">Form</p>
									<p className="text-lg font-semibold text-gray-900">{filingInfo.form}</p>
								</div>
								<div className="bg-sky-50 rounded-lg p-4">
									<p className="text-sm text-gray-600 mb-1">Filed</p>
									<p className="text-lg font-semibold text-gray-900">{filingInfo.filed}</p>
								</div>
							</div>
						</div>

						{/* Financial Statements */}
						<FinancialStatementsViewer
							ticker={ticker.toUpperCase()}
							form={filingInfo.form}
							filed={filingInfo.filed}
						/>

						{/* Metrics Interpreter */}
						<MetricsInterpreter
							ticker={ticker.toUpperCase()}
							form={filingInfo.form}
							filed={filingInfo.filed}
						/>

						{/* Narrative Analyzer */}
						<NarrativeAnalyzer
							ticker={ticker.toUpperCase()}
							form={filingInfo.form}
							filed={filingInfo.filed}
						/>
					</div>
				)}
				</div>
			</div>
		</AppShell>
	);
}