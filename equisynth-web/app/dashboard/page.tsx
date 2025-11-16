"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import ExtractorDecor from "@/components/agent/ExtractorDecor";
import QuoteHeader from "@/components/agent/QuoteHeader";
import FactGrid from "@/components/agent/FactGrid";
import MetricList from "@/components/agent/MetricList";
import ResultList from "@/components/agent/ResultList";
import PipelineExplainerCard from "@/components/agent/PipelineExplainerCard";

export default function DashboardPage() {
	const [ticker, setTicker] = useState("");
	const [formType, setFormType] = useState("10-K");
	const [year, setYear] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string>("");
	const [ingestStatus, setIngestStatus] = useState<any>(null);
	const [ingestLoading, setIngestLoading] = useState(false);
	const [sectionStatus, setSectionStatus] = useState<any>(null);
	const [sectionLoading, setSectionLoading] = useState(false);
	const [ask, setAsk] = useState("");
	const [askLoading, setAskLoading] = useState(false);
	const [askResults, setAskResults] = useState<any[] | null>(null);
	const [embedStatus, setEmbedStatus] = useState<any>(null);
	const [embedLoading, setEmbedLoading] = useState(false);

	async function fetchFiling(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");
		setResult(null);
		setIngestStatus(null);
		setSectionStatus(null);
		setEmbedStatus(null);
		setAskResults(null);
		
		try {
			// Step 1: Fetch filing metadata, quote, and fundamentals
			const [secRes, quoteRes, fundamentalsRes] = await Promise.all([
				fetch("/api/data/sec", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ticker, formType, year: year || undefined }),
				}),
				fetch(`/api/market/quote?ticker=${ticker}`),
				fetch(`/api/market/fundamentals?ticker=${ticker}`),
			]);

			const secData = await secRes.json();
			if (!secRes.ok) throw new Error(secData.error || "Request failed");

			const quoteData = quoteRes.ok ? await quoteRes.json() : null;
			const fundamentalsData = fundamentalsRes.ok ? await fundamentalsRes.json() : null;

			// Set initial result
			setResult({
				...secData,
				quote: quoteData,
				fundamentals: fundamentalsData,
				financials: null,
				company: quoteData?.longName || secData.ticker,
			});

			// Step 2: Auto-run the pipeline (Download → Section → Embed)
			await runFullPipeline(secData, ticker);

		} catch (err: any) {
			setError(err?.message || "Unknown error");
		} finally {
			setLoading(false);
		}
	}

	// Auto-run the complete pipeline
	async function runFullPipeline(secData: any, currentTicker: string) {
		try {
			// Step 1: Download & Parse
			setIngestLoading(true);
			const ingestRes = await fetch("/api/data/ingest", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					url: secData.url, 
					ticker: currentTicker, 
					cik: secData.cik, 
					form: secData.form, 
					filed: secData.filed 
				}),
			});
			const ingestData = await ingestRes.json();
			if (!ingestRes.ok) throw new Error(ingestData.error || "Ingest failed");
			setIngestStatus(ingestData);
			setIngestLoading(false);

			// Load financial metrics
			try {
				const financialsRes = await fetch(
					`/api/data/financials?ticker=${currentTicker}&form=${secData.form}&filed=${secData.filed}`
				);
				if (financialsRes.ok) {
					const finData = await financialsRes.json();
					const metricsArray = finData.keyMetrics ? Object.entries(finData.keyMetrics).map(([key, value]) => ({
						metric: formatMetricName(key),
						value: formatMetricValue(key, value),
						asOf: secData.filed
					})) : [];
					setResult((prev: any) => ({ ...prev, financials: metricsArray }));
				}
			} catch (err) {
				console.error("Failed to load financials:", err);
			}

			// Step 2: Section & Chunk
			setSectionLoading(true);
			const sectionRes = await fetch("/api/data/section", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ticker: currentTicker, form: secData.form, filed: secData.filed }),
			});
			const sectionData = await sectionRes.json();
			if (!sectionRes.ok) throw new Error(sectionData.error || "Sectioning failed");
			setSectionStatus(sectionData);
			setSectionLoading(false);

			// Step 3: Generate Embeddings
			setEmbedLoading(true);
			const embedRes = await fetch("/api/rag/embed", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ticker: currentTicker, form: secData.form, filed: secData.filed }),
			});
			const embedData = await embedRes.json();
			if (!embedRes.ok) throw new Error(embedData.error || "Embedding failed");
			setEmbedStatus(embedData);
			setEmbedLoading(false);

		} catch (err: any) {
			console.error("Pipeline error:", err);
			setError(err?.message || "Pipeline failed");
			setIngestLoading(false);
			setSectionLoading(false);
			setEmbedLoading(false);
		}
	}

	async function downloadAndParse() {
		if (!result?.url) return;
		setIngestLoading(true);
		setIngestStatus(null);
		try {
			const res = await fetch("/api/data/ingest", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url: result.url, ticker, cik: result.cik, form: result.form, filed: result.filed }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Ingest failed");
			setIngestStatus(data);
			
			// Try to reload financial metrics
			try {
				const financialsRes = await fetch(
					`/api/data/financials?ticker=${ticker}&form=${result.form}&filed=${result.filed}`
				);
				if (financialsRes.ok) {
					const finData = await financialsRes.json();
					
					// Convert keyMetrics object to array format for display
					const metricsArray = finData.keyMetrics ? Object.entries(finData.keyMetrics).map(([key, value]) => ({
						metric: formatMetricName(key),
						value: formatMetricValue(key, value),
						asOf: result.filed
					})) : [];
					
					setResult((prev: any) => ({ ...prev, financials: metricsArray }));
				}
			} catch (err) {
				console.error("Failed to load financials:", err);
				// Ignore if financials not ready yet
			}
		} catch (err: any) {
			setIngestStatus({ error: err?.message || "Unknown error" });
		} finally {
			setIngestLoading(false);
		}
	}
	
	// Helper function to format metric names
	function formatMetricName(key: string): string {
		const nameMap: Record<string, string> = {
			revenue: "Revenue",
			grossProfit: "Gross Profit",
			operatingIncome: "Operating Income",
			netIncome: "Net Income",
			eps: "EPS (Diluted)",
			grossMargin: "Gross Margin",
			operatingMargin: "Operating Margin",
			netMargin: "Net Margin",
			totalAssets: "Total Assets",
			totalLiabilities: "Total Liabilities",
			totalEquity: "Total Equity",
			cash: "Cash & Equivalents",
			currentAssets: "Current Assets",
			currentLiabilities: "Current Liabilities",
			currentRatio: "Current Ratio",
			debtToEquity: "Debt-to-Equity",
			equityRatio: "Equity Ratio",
			roe: "ROE",
			roa: "ROA",
			operatingCashFlow: "Operating Cash Flow",
			investingCashFlow: "Investing Cash Flow",
			financingCashFlow: "Financing Cash Flow",
			freeCashFlow: "Free Cash Flow",
			capex: "CapEx",
			longTermDebt: "Long-term Debt",
			shortTermDebt: "Short-term Debt",
			roic: "ROIC",
			wacc: "WACC"
		};
		return nameMap[key] || key;
	}
	
	// Helper function to format metric values with appropriate units
	function formatMetricValue(key: string, value: any): string {
		if (value === null || value === undefined) return "—";
		
		const num = Number(value);
		if (isNaN(num)) return String(value);
		
		// Percentages (values already multiplied by 100 from parser)
		const percentageKeys = [
			"roe", "roa", "roic", "wacc", 
			"grossMargin", "operatingMargin", "netMargin",
			"equityRatio"
		];
		if (percentageKeys.includes(key) || key.includes("Margin")) {
			return `${num.toFixed(3)}%`;
		}
		
		// Ratios that are NOT percentages (just numbers, no unit)
		const ratioKeys = ["currentRatio", "debtToEquity"];
		if (ratioKeys.includes(key)) {
			return num.toLocaleString('en-US', { 
				style: 'decimal',
				minimumFractionDigits: 3,
				maximumFractionDigits: 3
			});
		}
		
		// EPS (Earnings Per Share) - in dollars
		if (key === "eps") {
			return `$${num.toFixed(2)}`;
		}
		
		// Financial amounts (revenue, income, assets, liabilities, equity, cash, cash flow, debt, capex)
		// These should be in $B, $M, or $K
		const financialAmountKeys = [
			"revenue", "grossProfit", "operatingIncome", "netIncome",
			"totalAssets", "totalLiabilities", "totalEquity", "cash",
			"currentAssets", "currentLiabilities",
			"operatingCashFlow", "investingCashFlow", "financingCashFlow", "freeCashFlow",
			"longTermDebt", "shortTermDebt", "capex"
		];
		if (financialAmountKeys.includes(key)) {
			if (Math.abs(num) >= 1_000_000_000) {
				return `$${(num / 1_000_000_000).toFixed(3)}B`;
			}
			if (Math.abs(num) >= 1_000_000) {
				return `$${(num / 1_000_000).toFixed(3)}M`;
			}
			if (Math.abs(num) >= 1_000) {
				return `$${(num / 1_000).toFixed(3)}K`;
			}
			return `$${num.toFixed(2)}`;
		}
		
		// Regular numbers (fallback - should not happen for financial metrics)
		return num.toLocaleString('en-US', { 
			style: 'decimal',
			minimumFractionDigits: 0,
			maximumFractionDigits: 3
		});
	}

	async function sectionAndChunk() {
		if (!result?.filed) return;
		setSectionLoading(true);
		setSectionStatus(null);
		try {
			const res = await fetch("/api/data/section", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ticker, form: result.form, filed: result.filed }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Sectioning failed");
			setSectionStatus(data);
		} catch (err: any) {
			setSectionStatus({ error: err?.message || "Unknown error" });
		} finally {
			setSectionLoading(false);
		}
	}

	async function embedChunks() {
		if (!result?.filed) return;
		setEmbedLoading(true);
		setEmbedStatus(null);
		try {
			const res = await fetch("/api/rag/embed", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ticker, form: result.form, filed: result.filed, batch: 1 }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Embed failed");
			setEmbedStatus(data);
		} catch (err: any) {
			setEmbedStatus({ error: err?.message || "Unknown error" });
		} finally {
			setEmbedLoading(false);
		}
	}

	async function runQuery() {
		if (!result?.filed || !ask) return;
		setAskLoading(true);
		setAskResults(null);
		try {
			// First, get relevant context from RAG
			const ragRes = await fetch("/api/rag/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ticker, form: result.form, filed: result.filed, query: ask, topK: 5 }),
			});
			const ragData = await ragRes.json();
			if (!ragRes.ok) throw new Error(ragData.error || "Query failed");

			// Then, send to Gemini for natural language response
			const chatRes = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					question: ask,
					context: ragData.results,
					ticker,
					form: result.form
				}),
			});
			const chatData = await chatRes.json();
			if (!chatRes.ok) throw new Error(chatData.error || "Chat failed");
			
			// Store the AI answer instead of raw results
			setAskResults([{ 
				aiAnswer: chatData.answer,
				sources: chatData.sources 
			}]);
		} catch (err: any) {
			setAskResults([{ error: err?.message || "Unknown error" }]);
		} finally {
			setAskLoading(false);
		}
	}

	return (
		<AppShell>
			<div className="max-w-7xl mx-auto space-y-6">
				{/* BACKGROUND + CENTERED HERO CARD */}
				<div className="bg-grid rounded-2xl px-4 py-8 sm:px-6 sm:py-10">
					{/* halo */}
					<div className="relative">
						<div className="login-halo" />
					</div>

					<div className="relative mx-auto max-w-2xl">
						{/* your existing centered hero card with title + form */}
						<div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
									<div className="text-center">
										<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
											Data Extractor Agent
										</h1>
										<p className="mt-2 text-gray-600">
											Agents to <span className="font-semibold text-gray-800">Extract, parse, and analyze SEC filings</span>.
										</p>
									</div>

									<form onSubmit={fetchFiling} className="mt-6 space-y-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">Choose Stock</label>
											<input
												value={ticker}
												onChange={(e) => setTicker(e.target.value.toUpperCase())}
												placeholder="AAPL"
												className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
												required
												autoFocus
											/>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">Form Type</label>
												<select
													value={formType}
													onChange={(e) => setFormType(e.target.value)}
													className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
												>
													<option value="10-K">10-K (Annual)</option>
													<option value="10-Q">10-Q (Quarterly)</option>
												</select>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
												<input
													value={year}
													onChange={(e) => setYear(e.target.value)}
													placeholder="2024"
													inputMode="numeric"
													className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
												/>
											</div>
										</div>

									<button
										type="submit"
										className="w-full px-6 py-3 rounded-lg bg-white border-2 border-blue-600 text-blue-600 font-semibold tracking-wide hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
										disabled={loading}
									>
										{loading ? "Starting…" : "Start Extracting"}
									</button>
									</form>

									{error && (
										<div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
											<p className="text-red-700 font-medium">{error}</p>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* RESULTS */}
						{result && (
							<div className="space-y-6">
						{/* HERO QUOTE HEADER */}
						<QuoteHeader
							name={result.company}
							ticker={ticker.toUpperCase()}
							last={result.quote?.price}
							changePct={result.quote?.changePercent}
							marketCap={result.fundamentals?.marketCap ? `$${(result.fundamentals.marketCap / 1_000_000_000).toFixed(2)}B` : undefined}
							sector={result.quote?.sector}
							industry={result.quote?.industry}
							form={result.form}
							filed={result.filed}
							url={result.url}
						/>

						{/* 3-COLUMN LAYOUT: Left content + Middle actions + Right insights rail */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* LEFT COLUMN */}
							<div className="space-y-6 lg:col-span-2">
								{/* Filing Summary */}
								<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<h3 className="text-lg font-semibold mb-4">📄 Filing Summary</h3>
									<FactGrid items={[
										{ label: "Company", value: result.company ?? "—" },
										{ label: "CIK", value: result.cik ?? "—" },
										{ label: "Form", value: result.form ?? "—" },
										{ label: "Filed", value: result.filed ?? "—" },
									]}/>
									{result.url && (
										<div className="mt-4">
											<a className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 underline text-sm" href={result.url} target="_blank" rel="noreferrer">
												🔗 View original document on SEC.gov
											</a>
										</div>
									)}
								</div>

								{/* Key Metrics (market snapshot) */}
								<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<h3 className="text-lg font-semibold mb-4">📈 Key Metrics</h3>
									<MetricList
										items={[
											{ 
												label: "P/E Ratio", 
												value: (() => {
													const pe = result.quote?.trailingPE || result.fundamentals?.trailingPE;
													return pe != null ? pe.toFixed(3) : null;
												})()
											},
											{ 
												label: "P/B Ratio", 
												value: (() => {
													const pb = result.fundamentals?.priceToBook;
													return pb != null ? pb.toFixed(3) : null;
												})()
											},
											{ 
												label: "ROE", 
												value: (() => {
													const roe = result.fundamentals?.returnOnEquity;
													if (roe == null) return null;
													// Finnhub typically returns decimal (0.16405 = 16.405%)
													// But may also return percentage (164.05 = 164.05%)
													// Use threshold of 10: if >= 10, assume already percentage; if < 10, multiply by 100
													// This handles both cases: 0.16405 → 16.405% and 164.05 → 164.05%
													const percentage = Math.abs(roe) >= 10 ? roe : roe * 100;
													return `${percentage.toFixed(3)}%`;
												})()
											},
											{ 
												label: "Profit Margin", 
												value: (() => {
													const margin = result.fundamentals?.profitMargins;
													if (margin == null) return null;
													// Finnhub typically returns decimal (0.2692 = 26.92%)
													// Use threshold of 10: if >= 10, assume already percentage; if < 10, multiply by 100
													const percentage = Math.abs(margin) >= 10 ? margin : margin * 100;
													return `${percentage.toFixed(3)}%`;
												})()
											},
											{ 
												label: "Beta", 
												value: (() => {
													const beta = result.quote?.beta || result.fundamentals?.beta;
													return beta != null ? beta.toFixed(3) : null;
												})()
											},
											{ 
												label: "Volume", 
												value: (() => {
													const vol = result.quote?.volume;
													if (vol == null || vol === 0) return "N/A";
													return `${(vol / 1_000_000).toFixed(2)}M`;
												})()
											},
										]}
									/>
									<div className="text-xs text-gray-500 mt-3">
										Live market data from Finnhub API. Volume data depends on API availability.
									</div>
								</div>

								{/* Financial Metrics from filing */}
								<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<h3 className="text-lg font-semibold mb-4">🧾 Financial Metrics (SEC Filing)</h3>
									{result.financials?.length ? (
										<div className="overflow-x-auto">
											<table className="min-w-full text-sm">
												<thead className="text-gray-500">
													<tr>
														<th className="text-left py-2 pr-3">Metric</th>
														<th className="text-left py-2 pr-3">Value</th>
														<th className="text-left py-2">As of</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-gray-100">
													{result.financials.map((f: any, i: number) => (
														<tr key={i}>
															<td className="py-2 pr-3">{f.metric}</td>
															<td className="py-2 pr-3 font-medium">{f.value}</td>
															<td className="py-2">{f.asOf ?? "—"}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : (
										<div className="text-sm text-gray-500">No structured filing metrics yet — run the pipeline to extract sections/chunks.</div>
									)}
								</div>
						</div>

						{/* MIDDLE COLUMN (actions sticky) */}
						<div className="space-y-6 lg:sticky lg:top-20 h-fit">
							{/* Pipeline Status + Explainer Grid - HIDDEN */}
							<div className="hidden">
								<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
								{/* Auto Pipeline Status (left on xl) */}
								<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<h3 className="text-lg font-semibold mb-4">⚙️ Processing Status</h3>
									
									<p className="text-sm text-gray-600 mb-4">
										The filing is automatically processed in the background.
									</p>

									{/* Status indicators */}
									<div className="space-y-2 text-sm">
										{/* Download status */}
										<div className={`flex items-center gap-2 p-3 rounded-lg ${
											ingestStatus?.error ? "bg-red-50 text-red-700" :
											ingestStatus ? "bg-emerald-50 text-emerald-700" :
											ingestLoading ? "bg-blue-50 text-blue-700" :
											"bg-gray-50 text-gray-400"
										}`}>
											{ingestLoading ? "🔄" : ingestStatus ? "✅" : "⏳"}
											<span className="font-medium">Download & Parse</span>
											{ingestLoading && <span className="ml-auto text-xs">Processing...</span>}
											{ingestStatus && !ingestStatus.error && <span className="ml-auto text-xs">{ingestStatus.tables} tables</span>}
										</div>

										{/* Section status */}
										<div className={`flex items-center gap-2 p-3 rounded-lg ${
											sectionStatus?.error ? "bg-red-50 text-red-700" :
											sectionStatus ? "bg-purple-50 text-purple-700" :
											sectionLoading ? "bg-blue-50 text-blue-700" :
											"bg-gray-50 text-gray-400"
										}`}>
											{sectionLoading ? "🔄" : sectionStatus ? "✅" : "⏳"}
											<span className="font-medium">Section & Chunk</span>
											{sectionLoading && <span className="ml-auto text-xs">Processing...</span>}
											{sectionStatus && !sectionStatus.error && <span className="ml-auto text-xs">{sectionStatus.chunks} chunks</span>}
										</div>

										{/* Embed status */}
										<div className={`flex items-center gap-2 p-3 rounded-lg ${
											embedStatus?.error ? "bg-red-50 text-red-700" :
											embedStatus ? "bg-orange-50 text-orange-700" :
											embedLoading ? "bg-blue-50 text-blue-700" :
											"bg-gray-50 text-gray-400"
										}`}>
											{embedLoading ? "🔄" : embedStatus ? "✅" : "⏳"}
											<span className="font-medium">Generate Embeddings</span>
											{embedLoading && <span className="ml-auto text-xs">Processing...</span>}
											{embedStatus && !embedStatus.error && <span className="ml-auto text-xs">{embedStatus.embedded} embedded</span>}
										</div>
									</div>
									
									{/* Error display */}
									{(ingestStatus?.error || sectionStatus?.error || embedStatus?.error) && (
										<div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r">
											<div className="font-medium text-red-700">Error occurred:</div>
											<div className="text-sm text-red-600 mt-1">
												{ingestStatus?.error || sectionStatus?.error || embedStatus?.error}
											</div>
										</div>
									)}
								</div>

								{/* NEW: Explainer card (right on xl) */}
								<PipelineExplainerCard />
								</div>
							</div>

							{/* Ask Questions */}
							<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<h3 className="text-lg font-semibold mb-4">💬 Ask Questions</h3>
									<div className="flex gap-3">
										<input
											value={ask}
											onChange={(e)=>setAsk(e.target.value)}
											placeholder="What are the main risk factors?"
											className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
											onKeyDown={(e)=>{ if (e.key==='Enter' && !askLoading) { runQuery(); }}}
										/>
										<button
											onClick={runQuery}
											className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
											disabled={askLoading}
										>
											{askLoading ? "Searching…" : "🔎 Search"}
										</button>
									</div>

									{askResults && (
										<div className="mt-4">
											<ResultList results={askResults} />
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</AppShell>
	);
}