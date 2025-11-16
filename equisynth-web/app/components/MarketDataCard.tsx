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
						if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
						if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
						if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)}K`;
						return vol.toLocaleString();
					})()}</p>
					{quote.marketCap && (
						<p>Market Cap: ${(quote.marketCap / 1e9).toFixed(2)}B</p>
					)}
				</div>
			</div>

			{fundamentals && (
				<div className="border-t pt-3 space-y-2 text-sm">
					<h4 className="font-medium">Key Metrics</h4>
					<div className="grid grid-cols-2 gap-2">
						{fundamentals.trailingPE != null && (
							<div>
								<span className="text-gray-600">P/E Ratio:</span>{" "}
								<span className="font-medium">{fundamentals.trailingPE.toFixed(3)}</span>
							</div>
						)}
						{fundamentals.priceToBook != null && (
							<div>
								<span className="text-gray-600">P/B Ratio:</span>{" "}
								<span className="font-medium">{fundamentals.priceToBook.toFixed(3)}</span>
							</div>
						)}
						{fundamentals.returnOnEquity != null && (
							<div>
								<span className="text-gray-600">ROE:</span>{" "}
								<span className="font-medium">
									{(() => {
										const roe = fundamentals.returnOnEquity;
										// Handle both decimal (0.16405) and percentage (164.05) formats
										const percentage = Math.abs(roe) >= 10 ? roe : roe * 100;
										return `${percentage.toFixed(3)}%`;
									})()}
								</span>
							</div>
						)}
						{fundamentals.profitMargins != null && (
							<div>
								<span className="text-gray-600">Profit Margin:</span>{" "}
								<span className="font-medium">
									{(() => {
										const margin = fundamentals.profitMargins;
										// Handle both decimal (0.2692) and percentage (26.92) formats
										const percentage = Math.abs(margin) >= 10 ? margin : margin * 100;
										return `${percentage.toFixed(3)}%`;
									})()}
								</span>
							</div>
						)}
						{fundamentals.debtToEquity != null && (
							<div>
								<span className="text-gray-600">D/E Ratio:</span>{" "}
								<span className="font-medium">{fundamentals.debtToEquity.toFixed(3)}</span>
							</div>
						)}
						{fundamentals.beta != null && (
							<div>
								<span className="text-gray-600">Beta:</span>{" "}
								<span className="font-medium">{fundamentals.beta.toFixed(3)}</span>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

