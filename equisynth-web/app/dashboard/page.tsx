"use client";

import { useState } from "react";
import MarketDataCard from "@/app/components/MarketDataCard";
import FinancialMetricsCard from "@/app/components/FinancialMetricsCard";

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
			const res = await fetch("/api/data/sec", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ticker, formType, year: year || undefined }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Request failed");
			setResult(data);
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
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="text-center mb-10">
					<h1 className="text-4xl font-bold text-gray-900 mb-2">Data Extractor Agent</h1>
					<p className="text-lg text-gray-600">Extract, parse, and analyze SEC filings with AI-powered semantic search</p>
				</div>

				{/* Search Form */}
				<div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
					<form onSubmit={fetchFiling} className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div>
								<label className="block text-base font-medium text-gray-700 mb-2">Stock Ticker</label>
								<input 
									value={ticker} 
									onChange={(e) => setTicker(e.target.value)} 
									placeholder="e.g., AAPL, MSFT, TSLA" 
									className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
									required 
								/>
							</div>
							<div>
								<label className="block text-base font-medium text-gray-700 mb-2">Filing Type</label>
								<select 
									value={formType} 
									onChange={(e) => setFormType(e.target.value)} 
									className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
								>
									<option>10-K</option>
									<option>10-Q</option>
								</select>
							</div>
							<div>
								<label className="block text-base font-medium text-gray-700 mb-2">Year (optional)</label>
								<input 
									value={year} 
									onChange={(e) => setYear(e.target.value)} 
									placeholder="e.g., 2024" 
									className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
								/>
							</div>
						</div>
						<button 
							type="submit" 
							className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-xl" 
							disabled={loading}
						>
							{loading ? (
								<span className="flex items-center justify-center gap-2">
									<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Fetching filing...
								</span>
							) : (
								"🔍 Fetch SEC Filing"
							)}
						</button>
					</form>

					{error && (
						<div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
							<p className="text-base text-red-700 font-medium">{error}</p>
						</div>
					)}
				</div>

				{/* Market Data Cards */}
				{ticker && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
						<MarketDataCard ticker={ticker.toUpperCase()} />
						{result?.filed && (
							<FinancialMetricsCard
								ticker={ticker.toUpperCase()}
								form={result.form}
								filed={result.filed}
							/>
						)}
					</div>
				)}

				{/* Results */}
				{result && (
					<div className="space-y-6">
						{/* Filing Info */}
						<div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">📄 Filing Information</h2>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base">
								<div className="bg-blue-50 rounded-lg p-4">
									<p className="text-sm text-gray-600 mb-1">CIK Number</p>
									<p className="text-lg font-semibold text-gray-900">{result.cik}</p>
								</div>
								<div className="bg-green-50 rounded-lg p-4">
									<p className="text-sm text-gray-600 mb-1">Form Type</p>
									<p className="text-lg font-semibold text-gray-900">{result.form}</p>
								</div>
								<div className="bg-purple-50 rounded-lg p-4">
									<p className="text-sm text-gray-600 mb-1">Filed Date</p>
									<p className="text-lg font-semibold text-gray-900">{result.filed}</p>
								</div>
							</div>
							<div className="mt-4">
								<a 
									className="inline-flex items-center gap-2 text-base text-blue-600 hover:text-blue-700 font-medium underline" 
									href={result.url} 
									target="_blank" 
									rel="noreferrer"
								>
									🔗 View original document on SEC.gov
								</a>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">⚙️ Processing Pipeline</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<button 
									onClick={downloadAndParse} 
									className="px-6 py-4 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-base font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg" 
									disabled={ingestLoading}
								>
									{ingestLoading ? (
										<span className="flex items-center justify-center gap-2">
											<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Downloading...
										</span>
									) : (
										"📥 1. Download & Parse"
									)}
								</button>

								<button 
									onClick={sectionAndChunk} 
									className="px-6 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white text-base font-semibold hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg" 
									disabled={sectionLoading}
								>
									{sectionLoading ? (
										<span className="flex items-center justify-center gap-2">
											<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Processing...
										</span>
									) : (
										"✂️ 2. Section & Chunk"
									)}
								</button>

								<button 
									onClick={embedChunks} 
									className="px-6 py-4 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-base font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg" 
									disabled={embedLoading}
								>
									{embedLoading ? (
										<span className="flex items-center justify-center gap-2">
											<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Embedding...
										</span>
									) : (
										"🧠 3. Generate Embeddings"
									)}
								</button>

								<button 
									onClick={async () => { 
										setEmbedLoading(true); 
										setEmbedStatus(null); 
										try { 
											const res = await fetch('/api/rag/embed', { 
												method: 'POST', 
												headers: { 'Content-Type': 'application/json' }, 
												body: JSON.stringify({ ticker, form: result.form, filed: result.filed, section: 'risk factors', maxChunks: 5, resume: false, batch: 1 }) 
											}); 
											const data = await res.json(); 
											if (!res.ok) throw new Error(data.error || 'Embed failed'); 
											setEmbedStatus(data); 
										} catch (e:any) { 
											setEmbedStatus({ error: e?.message || 'Unknown error' }); 
										} finally { 
											setEmbedLoading(false); 
										} 
									}} 
									className="px-6 py-4 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-base font-semibold hover:from-yellow-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg" 
									disabled={embedLoading}
								>
									🚀 Quick: Embed Risk Factors
								</button>
							</div>

							{/* Status Messages */}
							<div className="mt-6 space-y-3">
								{ingestStatus && (
									<div className={`p-4 rounded-lg ${ingestStatus.error ? 'bg-red-50 border-l-4 border-red-500' : 'bg-green-50 border-l-4 border-green-500'}`}>
										{ingestStatus.error ? (
											<p className="text-base text-red-700 font-medium">{ingestStatus.error}</p>
										) : (
											<div className="text-base text-green-800">
												<p className="font-semibold mb-1">✅ Download Complete</p>
												<p className="text-sm">Saved to: <code className="bg-green-100 px-2 py-1 rounded">{ingestStatus.savedDir}</code></p>
												<p className="text-sm mt-1">📊 Stats: {ingestStatus.bytes.toLocaleString()} bytes · {ingestStatus.textChars.toLocaleString()} chars · {ingestStatus.tables} tables</p>
											</div>
										)}
									</div>
								)}

								{sectionStatus && (
									<div className={`p-4 rounded-lg ${sectionStatus.error ? 'bg-red-50 border-l-4 border-red-500' : 'bg-purple-50 border-l-4 border-purple-500'}`}>
										{sectionStatus.error ? (
											<p className="text-base text-red-700 font-medium">{sectionStatus.error}</p>
										) : (
											<div className="text-base text-purple-800">
												<p className="font-semibold mb-1">✅ Sectioning Complete</p>
												<p className="text-sm">📑 {sectionStatus.sections} sections · 📄 {sectionStatus.chunks} chunks created</p>
											</div>
										)}
									</div>
								)}

								{embedStatus && (
									<div className={`p-4 rounded-lg ${embedStatus.error ? 'bg-red-50 border-l-4 border-red-500' : 'bg-orange-50 border-l-4 border-orange-500'}`}>
										{embedStatus.error ? (
											<p className="text-base text-red-700 font-medium">{embedStatus.error}</p>
										) : (
											<div className="text-base text-orange-800">
												<p className="font-semibold mb-1">✅ Embedding Complete</p>
												<p className="text-sm">🧠 {embedStatus.embedded} chunks embedded {embedStatus.message && `(${embedStatus.message})`} · Total: {embedStatus.total}</p>
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						{/* Search Interface */}
						<div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">💬 Ask Questions</h2>
							<div className="space-y-4">
								<div className="flex gap-3">
									<input 
										value={ask} 
										onChange={(e) => setAsk(e.target.value)} 
										placeholder="What are the main risk factors for this company?" 
										className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
										onKeyDown={(e) => {
											if (e.key === 'Enter' && !askLoading) {
												runQuery();
											}
										}}
									/>
									<button 
										onClick={runQuery} 
										className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-base font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg" 
										disabled={askLoading}
									>
										{askLoading ? (
											<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
										) : (
											"🔎 Search"
										)}
									</button>
								</div>

								{askResults && (
									<div className="space-y-3 mt-6">
										<h3 className="text-lg font-semibold text-gray-900">Search Results:</h3>
										{askResults.map((r: any, i: number) => (
											<div key={i} className="rounded-lg border-2 border-gray-200 p-5 hover:border-blue-300 transition-all bg-gray-50">
												{r.error ? (
													<p className="text-base text-red-600 font-medium">{r.error}</p>
												) : (
													<div>
														<div className="flex items-center gap-3 mb-3">
															<span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
																Relevance: {(r.score * 100).toFixed(1)}%
															</span>
															<span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
																{r.metadata.section}
															</span>
														</div>
														<p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{r.text}</p>
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
