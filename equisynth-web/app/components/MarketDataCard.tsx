"use client";

import { useEffect, useState } from "react";

interface MarketDataCardProps {
	ticker: string;
}

export default function MarketDataCard({ ticker }: MarketDataCardProps) {
	const [quote, setQuote] = useState<any>(null);
	const [fundamentals, setFundamentals] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!ticker) return;
		loadMarketData();
	}, [ticker]);

	async function loadMarketData() {
		setLoading(true);
		setError("");
		setQuote(null);
		setFundamentals(null);
		try {
			// Fetch quote
			const quoteRes = await fetch(`/api/market/quote?ticker=${ticker}`);
			if (quoteRes.ok) {
				const quoteData = await quoteRes.json();
				setQuote(quoteData);
			} else {
				const errorData = await quoteRes.json();
				throw new Error(errorData.error || "Failed to fetch quote");
			}

			// Fetch fundamentals (optional, don't fail if this errors)
			try {
				const fundRes = await fetch(`/api/market/fundamentals?ticker=${ticker}`);
				if (fundRes.ok) {
					const fundData = await fundRes.json();
					setFundamentals(fundData);
				}
			} catch (fundErr) {
				console.warn("Fundamentals failed (non-critical):", fundErr);
			}
		} catch (err: any) {
			console.error("Failed to load market data:", err);
			setError(err?.message || "Failed to load market data");
		} finally {
			setLoading(false);
		}
	}

	if (loading) {
		return (
			<div className="rounded border p-4 bg-gray-50">
				<h3 className="font-medium mb-2">Market Data</h3>
				<p className="text-sm text-gray-600">Loading...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded border p-4 bg-white shadow-sm">
				<h3 className="font-semibold text-lg mb-3">Market Data - {ticker}</h3>
				<p className="text-sm text-red-600">{error}</p>
				<button
					onClick={loadMarketData}
					className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					Retry
				</button>
			</div>
		);
	}

	if (!quote) return null;

	const changeColor = quote.change >= 0 ? "text-green-600" : "text-red-600";

	return (
		<div className="rounded border p-4 bg-white shadow-sm">
			<h3 className="font-semibold text-lg mb-3">{quote.shortName || ticker}</h3>

			<div className="grid grid-cols-2 gap-4 mb-4">
				<div>
					<p className="text-2xl font-bold">${quote.price?.toFixed(2)}</p>
					<p className={`text-sm ${changeColor}`}>
						{quote.change >= 0 ? "+" : ""}
						{quote.change?.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
					</p>
				</div>
				<div className="text-right text-sm text-gray-600">
					<p>Volume: {(() => {
						const vol = quote.volume;
						if (vol == null || vol === 0) return "N/A";
						// Ensure volume is a number
						let volumeNum = typeof vol === 'number' ? vol : parseFloat(String(vol));
						if (isNaN(volumeNum) || volumeNum === 0) return "N/A";
						
						// Check if volume might be already divided (if < 1000 and has decimal, likely already in millions)
						// If volume is between 0.1 and 1000 with decimals, assume it's already in millions
						if (volumeNum > 0.1 && volumeNum < 1000 && volumeNum % 1 !== 0) {
							// Likely already divided by 1,000,000, so multiply back
							volumeNum = volumeNum * 1_000_000;
						}
						
						// Format volume consistently: use B for billions, M for millions, K for thousands
						if (Math.abs(volumeNum) >= 1_000_000_000) {
							return `${(volumeNum / 1_000_000_000).toFixed(2)}B shares`;
						}
						if (Math.abs(volumeNum) >= 1_000_000) {
							return `${(volumeNum / 1_000_000).toFixed(2)}M shares`;
						}
						if (Math.abs(volumeNum) >= 1_000) {
							return `${(volumeNum / 1_000).toFixed(2)}K shares`;
						}
						return `${volumeNum.toLocaleString()} shares`;
					})()}</p>
					<p>Market Cap: {quote.marketCap ? `$${(quote.marketCap / 1e9).toFixed(2)}B` : "N/A"}</p>
				</div>
			</div>

			{fundamentals && (
				<div className="border-t pt-3 space-y-2 text-sm">
					<h4 className="font-medium">Key Metrics</h4>
					<div className="grid grid-cols-2 gap-2">
						{fundamentals.trailingPE && (
							<div>
								<span className="text-gray-600">P/E Ratio:</span>{" "}
								<span className="font-medium">{fundamentals.trailingPE.toFixed(2)}</span>
							</div>
						)}
						{fundamentals.priceToBook && (
							<div>
								<span className="text-gray-600">P/B Ratio:</span>{" "}
								<span className="font-medium">{fundamentals.priceToBook.toFixed(2)}</span>
							</div>
						)}
						{fundamentals.returnOnEquity && (
							<div>
								<span className="text-gray-600">ROE:</span>{" "}
								<span className="font-medium">
									{(fundamentals.returnOnEquity * 100).toFixed(2)}%
								</span>
							</div>
						)}
						{fundamentals.profitMargins && (
							<div>
								<span className="text-gray-600">Profit Margin:</span>{" "}
								<span className="font-medium">
									{(fundamentals.profitMargins * 100).toFixed(2)}%
								</span>
							</div>
						)}
						{fundamentals.debtToEquity && (
							<div>
								<span className="text-gray-600">D/E Ratio:</span>{" "}
								<span className="font-medium">{fundamentals.debtToEquity.toFixed(2)}</span>
							</div>
						)}
						{fundamentals.beta && (
							<div>
								<span className="text-gray-600">Beta:</span>{" "}
								<span className="font-medium">{fundamentals.beta.toFixed(2)}</span>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

