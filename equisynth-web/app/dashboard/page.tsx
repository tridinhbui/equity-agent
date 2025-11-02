"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import ExtractorDecor from "@/components/agent/ExtractorDecor";
import QuoteHeader from "@/components/agent/QuoteHeader";
import FactGrid from "@/components/agent/FactGrid";
import MetricList from "@/components/agent/MetricList";
import ResultList from "@/components/agent/ResultList";

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
			// Fetch filing, quote, and fundamentals in parallel
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

			// Add market data to result (gracefully handle failures)
			const quoteData = quoteRes.ok ? await quoteRes.json() : null;
			const fundamentalsData = fundamentalsRes.ok ? await fundamentalsRes.json() : null;

			// Try to fetch existing financial metrics if already parsed
			let financialsData = null;
			try {
				const financialsRes = await fetch(
					`/api/data/financials?ticker=${ticker}&form=${secData.form}&filed=${secData.filed}`
				);
				if (financialsRes.ok) {
					const finData = await financialsRes.json();
					financialsData = finData.keyMetrics || [];
				}
			} catch {
				// No financials yet, that's ok
			}

			setResult({
				...secData,
				quote: quoteData,
				fundamentals: fundamentalsData,
				financials: financialsData,
				company: quoteData?.longName || secData.ticker,
			});
		} catch (err: any) {
			setError(err?.message || "Unknown error");
		} finally {
			setLoading(false);
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
					setResult((prev: any) => ({ ...prev, financials: finData.keyMetrics || [] }));
				}
			} catch {
				// Ignore if financials not ready yet
			}
		} catch (err: any) {
			setIngestStatus({ error: err?.message || "Unknown error" });
		} finally {
			setIngestLoading(false);
		}
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
			const res = await fetch("/api/rag/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ticker, form: result.form, filed: result.filed, query: ask, topK: 5 }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Query failed");
			setAskResults(data.results);
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
												value: result.quote?.trailingPE || result.fundamentals?.trailingPE 
											},
											{ 
												label: "P/B Ratio", 
												value: result.fundamentals?.priceToBook 
											},
											{ 
												label: "ROE", 
												value: result.fundamentals?.returnOnEquity ? `${(result.fundamentals.returnOnEquity * 100).toFixed(2)}%` : null 
											},
											{ 
												label: "Profit Margin", 
												value: result.fundamentals?.profitMargins ? `${(result.fundamentals.profitMargins * 100).toFixed(2)}%` : null 
											},
											{ 
												label: "Beta", 
												value: result.quote?.beta || result.fundamentals?.beta 
											},
											{ 
												label: "Volume", 
												value: result.quote?.volume != null && result.quote.volume > 0
													? `${(result.quote.volume / 1_000_000).toFixed(2)}M` 
													: result.quote?.volume === 0 
														? "0" 
														: "—"
											},
										]}
									/>
									<div className="text-xs text-gray-500 mt-3">Live market data from Finnhub API</div>
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
								{/* Pipeline card */}
								<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
									<h3 className="text-lg font-semibold mb-4">⚙️ Processing Pipeline</h3>
									
									<p className="text-sm text-gray-600 mb-4">
										Run these steps in order to extract and analyze the filing:
									</p>

									<div className="space-y-3">
										<button
											onClick={downloadAndParse}
											className="w-full px-4 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
											disabled={ingestLoading}
										>
											{ingestLoading ? "📥 Downloading…" : "📥 1) Download & Parse"}
										</button>

										<button
											onClick={sectionAndChunk}
											className="w-full px-4 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
											disabled={sectionLoading}
										>
											{sectionLoading ? "✂️ Processing…" : "✂️ 2) Section & Chunk"}
										</button>

										<button
											onClick={embedChunks}
											className="w-full px-4 py-3 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
											disabled={embedLoading}
										>
											{embedLoading ? "🧠 Embedding…" : "🧠 3) Generate Embeddings"}
										</button>
									</div>

									{/* Inline status lines */}
									<div className="mt-4 space-y-2 text-sm">
										{ingestStatus && (
											<div className={`${ingestStatus.error ? "text-red-700 bg-red-50" : "text-emerald-800 bg-emerald-50"} border-l-4 ${ingestStatus.error ? "border-red-500" : "border-emerald-500"} rounded-r p-3`}>
												{ingestStatus.error ? (
													<div className="font-medium">{ingestStatus.error}</div>
												) : (
													<>
														<div className="font-semibold">✅ Download Complete</div>
														<div className="text-xs">Saved: <code className="bg-emerald-100 px-1.5 py-0.5 rounded">{ingestStatus.savedDir}</code></div>
														<div className="text-xs">Stats: {ingestStatus.bytes?.toLocaleString()} bytes · {ingestStatus.textChars?.toLocaleString()} chars · {ingestStatus.tables} tables</div>
													</>
												)}
											</div>
										)}

										{sectionStatus && (
											<div className={`${sectionStatus.error ? "text-red-700 bg-red-50" : "text-purple-800 bg-purple-50"} border-l-4 ${sectionStatus.error ? "border-red-500" : "border-purple-500"} rounded-r p-3`}>
												{sectionStatus.error ? (
													<div className="font-medium">{sectionStatus.error}</div>
												) : (
													<>
														<div className="font-semibold">✅ Sectioning Complete</div>
														<div className="text-xs">📑 {sectionStatus.sections} sections · 📄 {sectionStatus.chunks} chunks</div>
													</>
												)}
											</div>
										)}

										{embedStatus && (
											<div className={`${embedStatus.error ? "text-red-700 bg-red-50" : "text-orange-800 bg-orange-50"} border-l-4 ${embedStatus.error ? "border-red-500" : "border-orange-500"} rounded-r p-3`}>
												{embedStatus.error ? (
													<div className="font-medium">{embedStatus.error}</div>
												) : (
													<>
														<div className="font-semibold">✅ Embedding Complete</div>
														<div className="text-xs">🧠 {embedStatus.embedded} chunks {embedStatus.message && `(${embedStatus.message})`} · Total {embedStatus.total}</div>
													</>
												)}
											</div>
										)}
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