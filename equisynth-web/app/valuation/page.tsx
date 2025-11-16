'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import AgentSurface from '@/components/AgentSurface';
import { DCFInputs, DCFResult } from '@/app/lib/dcfModel';

export default function ValuationPage() {
	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			redirect('/api/auth/signin');
		},
	});

	const [ticker, setTicker] = useState('AAPL');
	const [form, setForm] = useState('10-K');
	const [year, setYear] = useState(2024);
	const [filedDate, setFiledDate] = useState('2024-11-01');
	
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	
	// DCF State
	const [dcfInputs, setDCFInputs] = useState<DCFInputs | null>(null);
	const [dcfResult, setDCFResult] = useState<DCFResult | null>(null);
	const [sensitivityMatrix, setSensitivityMatrix] = useState<any>(null);
	const [currentPrice, setCurrentPrice] = useState<number | null>(null);
	const [estimates, setEstimates] = useState<any>(null);

	if (status === 'loading') {
		return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
	}

	const handleRunValuation = async () => {
		setLoading(true);
		setError(null);
		
		try {
			// Step 1: Fetch financial metrics from Financial Understanding Agent
			const financialsRes = await fetch(
				`/api/data/financials?ticker=${ticker}&form=${form}&filed=${filedDate}`
			);
			
			if (!financialsRes.ok) {
				throw new Error('Failed to fetch financial data. Please run Data Extractor and Financial Understanding first.');
			}
			
			const financialsData = await financialsRes.json();
			const metrics = financialsData.keyMetrics || financialsData.metrics;
			
			if (!metrics) {
				throw new Error('No financial metrics found. Please analyze this filing in Financial Understanding first.');
			}
			
			// Step 2: Fetch analyst estimates and market data
			const estimatesRes = await fetch(`/api/valuation/estimates?ticker=${ticker}`);
			const estimatesData = await estimatesRes.json();
			
			if (!estimatesRes.ok) {
				console.warn('Failed to fetch estimates:', estimatesData.error);
				// Continue with defaults if estimates fail
			}
			
			setEstimates(estimatesData);
			
			// Try to get current price from AlphaVantage, if not available, use Finnhub
			let currentPriceValue = estimatesData.currentPrice;
			if (!currentPriceValue || currentPriceValue === 0) {
				try {
					const quoteRes = await fetch(`/api/market/quote?ticker=${ticker}`);
					if (quoteRes.ok) {
						const quoteData = await quoteRes.json();
						currentPriceValue = quoteData.price || null;
					}
				} catch (err) {
					console.warn('Failed to fetch quote from Finnhub:', err);
				}
			}
			
			setCurrentPrice(currentPriceValue || null);
			
			// Step 3: Prepare DCF inputs
			// Shares outstanding from AlphaVantage is already in millions (we divide by 1e6 in API)
			// Apple has ~15.1 billion shares = 15,100 million shares
			let sharesOutstanding = estimatesData.sharesOutstanding;
			
			// Fallback: Calculate from market cap / current price if available
			if (!sharesOutstanding || sharesOutstanding <= 0) {
				if (estimatesData.marketCap && currentPriceValue && currentPriceValue > 0) {
					sharesOutstanding = estimatesData.marketCap / currentPriceValue;
					console.log(`📊 Calculated shares from market cap: ${sharesOutstanding.toLocaleString()}M (${estimatesData.marketCap.toLocaleString()}M / $${currentPriceValue.toFixed(2)})`);
				} else {
					// Last resort: Use ticker-specific defaults
					const defaultShares: Record<string, number> = {
						'AAPL': 14773, // ~14.77 billion
						'MSFT': 7400,
						'GOOGL': 12500,
						'META': 2400,
						'AMZN': 10400,
					};
					sharesOutstanding = defaultShares[ticker.toUpperCase()] || 15000;
					console.warn(`⚠️ Shares outstanding not available. Using default: ${sharesOutstanding.toLocaleString()}M`);
				}
			}
			
			// Sanity check: For large-cap companies, shares should be between 1,000 and 100,000 million
			if (sharesOutstanding < 100 || sharesOutstanding > 200000) {
				console.warn(`⚠️ Shares outstanding (${sharesOutstanding}M) seems unusual. Expected 1,000-100,000M for large-cap companies.`);
			}
			
			console.log(`📊 Shares Outstanding: ${sharesOutstanding.toLocaleString()} million (${(sharesOutstanding / 1000).toFixed(2)} billion)`);
			
			// Calculate total debt
			const totalDebt = (metrics.longTermDebt || 0) + (metrics.shortTermDebt || 0);
			
			console.log('🔍 DCF Debug:', {
				sharesOutstanding,
				revenue: metrics.revenue,
				netIncome: metrics.netIncome,
				totalDebt,
				cash: metrics.cash,
				wacc: metrics.wacc,
				currentPrice: currentPriceValue,
			});
			
			// Define large-cap tech tickers for better defaults (used in multiple places)
			const largeCapTech = ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'NVDA'];
			
			// Use estimated growth rate from API or more realistic default
			// For mature large-cap tech, 5% is conservative, but for growth companies use higher default
			let revenueGrowthRate = estimatesData.estimatedGrowthRate || estimatesData.historicalGrowthRate;
			
			// If no growth data from API, use industry-appropriate default
			if (!revenueGrowthRate || revenueGrowthRate <= 0) {
				// Large-cap tech companies typically grow 8-12% annually
				// Apple specifically: 6-10% in recent years, but market expects 8-10%
				// Use 8.5% as more realistic default for large-cap tech (AAPL, MSFT, GOOGL)
				revenueGrowthRate = largeCapTech.includes(ticker.toUpperCase()) ? 0.085 : 0.07;
				console.warn(`⚠️ No growth rate from API. Using ${(revenueGrowthRate * 100).toFixed(1)}% default for ${ticker}`);
			}
			
			console.log(`📈 Revenue Growth Rate: ${(revenueGrowthRate * 100).toFixed(2)}%`);
			
			// ========================================
			// METRICS EXTRACTION FROM FINANCIAL UNDERSTANDING AGENT
			// All metrics below are calculated from the financial statements
			// to ensure consistency across Data Extractor, Financial Understanding, and Valuation agents
			// ========================================
			
			// Calculate operating margin from actual financial data
			const operatingMargin = metrics.revenue && metrics.operatingIncome ?
				metrics.operatingIncome / metrics.revenue : 0.25;
			
			console.log(`📊 Operating Margin: ${(operatingMargin * 100).toFixed(2)}% (from ${metrics.operatingIncome?.toLocaleString()}M / ${metrics.revenue?.toLocaleString()}M)`);
			
			// Calculate tax rate from actual financial data
			const taxRate = metrics.netIncome && metrics.operatingIncome ?
				1 - (metrics.netIncome / metrics.operatingIncome) : 0.21;
			
			console.log(`💵 Tax Rate: ${(taxRate * 100).toFixed(2)}% (from Net Income / Operating Income)`);
			
			// Calculate actual FCF margin to use as baseline (more accurate than deriving from operating margin)
			const actualFCF = metrics.freeCashFlow || 
				(metrics.operatingCashFlow ? metrics.operatingCashFlow - Math.abs(metrics.capex || 0) : 0) ||
				metrics.netIncome || 0;
			
			console.log('🔍 FCF Extraction Check:', {
				freeCashFlow: metrics.freeCashFlow || 'N/A',
				operatingCashFlow: metrics.operatingCashFlow || 'N/A',
				capex: metrics.capex || 'N/A',
				netIncome: metrics.netIncome || 'N/A',
				actualFCF: actualFCF || 'N/A',
				revenue: metrics.revenue || 'N/A',
			});
			
			const actualFCFMargin = metrics.revenue && actualFCF > 0 ? actualFCF / metrics.revenue : null;
			
			if (actualFCFMargin && actualFCFMargin > 0.15) {
				console.log(`💰 Using actual FCF margin: ${(actualFCFMargin * 100).toFixed(2)}% (from ${actualFCF.toLocaleString()}M FCF / ${metrics.revenue.toLocaleString()}M revenue)`);
			} else {
				console.warn(`⚠️ Actual FCF margin not available or too low (${actualFCFMargin ? (actualFCFMargin * 100).toFixed(2) + '%' : 'N/A'}). Using derived calculations.`);
			}
			
			// Estimate CapEx - use actual if extracted, otherwise back-calculate from actual FCF margin
			// Large tech companies typically have CapEx of 2.5-4% of revenue (lower than manufacturing)
			let capexAsPercentOfRevenue = metrics.capex && metrics.revenue ?
				Math.abs(metrics.capex) / metrics.revenue : 0.035; // Default 3.5% for tech (was 5%)
			
			// If we have actual FCF margin, back-calculate what CapEx should be
			// FCF Margin = Operating Margin × (1 - Tax) - CapEx% - WC Change%
			// So: CapEx% = Operating Margin × (1 - Tax) - WC Change% - FCF Margin
			if (actualFCFMargin && actualFCFMargin > 0.15) {
				const impliedCapexPercent = (operatingMargin * (1 - taxRate)) - 0.005 - actualFCFMargin; // 0.005 is WC change
				if (impliedCapexPercent > 0 && impliedCapexPercent < 0.08) {
					console.log(`💡 Back-calculated CapEx: ${(impliedCapexPercent * 100).toFixed(2)}% (from actual FCF margin of ${(actualFCFMargin * 100).toFixed(2)}%)`);
					// Use the lower of calculated or extracted CapEx (more conservative)
					capexAsPercentOfRevenue = Math.min(capexAsPercentOfRevenue, impliedCapexPercent || capexAsPercentOfRevenue);
				}
			}
			
			// Sanity check: CapEx for tech should be 2-5% of revenue
			if (capexAsPercentOfRevenue > 0.05 || capexAsPercentOfRevenue < 0.02) {
				console.warn(`⚠️ CapEx ${(capexAsPercentOfRevenue * 100).toFixed(2)}% seems unusual. Using 3% default.`);
				capexAsPercentOfRevenue = 0.03; // Lower to 3% if outside range
			}
			
			console.log(`💰 CapEx: ${(capexAsPercentOfRevenue * 100).toFixed(2)}% of revenue`);
			
			// Calculate FCF - handle CapEx if it's a string (e.g., "(9,447)")
			let capexValue = metrics.capex;
			if (typeof capexValue === 'string') {
				const cleaned = capexValue.replace(/,/g, '').trim();
				if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
					capexValue = Math.abs(parseFloat(cleaned.slice(1, -1))) || 0;
				} else {
					capexValue = Math.abs(parseFloat(cleaned)) || 0;
				}
			} else {
				capexValue = Math.abs(Number(capexValue)) || 0;
			}
			
			// Estimate FCF if not available
			const freeCashFlow = metrics.freeCashFlow || 
				(metrics.operatingCashFlow ? Number(metrics.operatingCashFlow) - capexValue : 0) ||
				metrics.netIncome || 0;
			
			console.log(`💰 Calculated FCF: ${freeCashFlow.toLocaleString()}M (from OCF: ${metrics.operatingCashFlow || 'N/A'}, CapEx: ${capexValue.toLocaleString()}M)`);
			
			// Use WACC from Financial Understanding Agent (which calculates it from balance sheet data)
			// This ensures consistency across Data Extractor, Financial Understanding, and Valuation agents
			let waccValue: number;
			
			if (metrics.wacc && metrics.wacc > 0 && metrics.wacc <= 25) {
				// Use the calculated WACC from Financial Understanding Agent
				// Convert from percentage to decimal (e.g., 6.10% -> 0.061)
				waccValue = metrics.wacc / 100;
				console.log(`✅ Using calculated WACC from Financial Understanding: ${metrics.wacc.toFixed(2)}% (${waccValue.toFixed(4)} decimal)`);
			} else {
				// Fallback to sector-based estimate only if WACC is missing or unreasonable
				const largeCapTech = ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'NVDA'];
				const tickerUpper = ticker.toUpperCase();
				
				if (tickerUpper === 'AAPL') {
					waccValue = 0.085; // 8.5% for Apple
				} else if (largeCapTech.includes(tickerUpper)) {
					waccValue = 0.09; // 9% for large-cap tech
				} else if (estimatesData.marketCap && estimatesData.marketCap > 500000) {
					waccValue = 0.10; // 10% for mega-cap
				} else {
					waccValue = 0.11; // 11% default
				}
				
				console.warn(`⚠️ WACC not available or unreliable (${metrics.wacc || 'N/A'}%). Using sector-based fallback: ${(waccValue * 100).toFixed(2)}%`);
			}
			
			const inputs: DCFInputs = {
				revenue: metrics.revenue || 0,
				operatingIncome: metrics.operatingIncome || 0,
				netIncome: metrics.netIncome || 0,
				freeCashFlow,
				totalDebt,
				cash: metrics.cash || 0,
				sharesOutstanding,
				wacc: waccValue, // Use capped WACC
				revenueGrowthRate,
				operatingMargin,
				taxRate,
				terminalGrowthRate: largeCapTech.includes(ticker.toUpperCase()) ? 0.03 : 0.025, // 3% for large-cap tech, 2.5% for others
				capexAsPercentOfRevenue,
				workingCapitalChangeAsPercentOfRevenue: 0.005, // Small default 0.5% for mature companies
			};
			
			setDCFInputs(inputs);
			
			// Step 4: Calculate DCF
			const dcfRes = await fetch('/api/valuation/dcf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					inputs, 
					currentPrice: currentPriceValue // Use the one we fetched (AlphaVantage or Finnhub)
				}),
			});
			
			if (!dcfRes.ok) {
				const errorData = await dcfRes.json();
				throw new Error(errorData.error || 'Failed to calculate DCF');
			}
			
			const dcfData = await dcfRes.json();
			
			// Log year-by-year projections
			console.log('📈 5-Year FCF Projections:', dcfData.result.projections.map((p: any) => ({
				Year: p.year,
				Revenue: `$${(p.revenue / 1000).toFixed(1)}B`,
				FCF: `$${(p.freeCashFlow / 1000).toFixed(1)}B`,
				'PV of FCF': `$${(p.presentValue / 1000).toFixed(1)}B`,
			})));
			
			console.log('💰 DCF Result:', {
				enterpriseValue: dcfData.result.enterpriseValue,
				equityValue: dcfData.result.equityValue,
				fairValuePerShare: dcfData.result.fairValuePerShare,
				sharesOutstanding: inputs.sharesOutstanding,
				sumOfPVFCF: dcfData.result.sumOfPVFCF,
				terminalValuePV: dcfData.result.terminalValuePV,
				terminalValue: dcfData.result.terminalValue,
				terminalFCF: dcfData.result.terminalFCF,
			});
			
			console.log('📊 DCF Inputs Summary:', {
				revenue: inputs.revenue,
				revenueGrowthRate: (inputs.revenueGrowthRate * 100).toFixed(2) + '%',
				operatingMargin: (inputs.operatingMargin * 100).toFixed(2) + '%',
				wacc: (inputs.wacc * 100).toFixed(2) + '%',
				terminalGrowthRate: (inputs.terminalGrowthRate * 100).toFixed(2) + '%',
				taxRate: (inputs.taxRate * 100).toFixed(2) + '%',
				capexPercent: (inputs.capexAsPercentOfRevenue * 100).toFixed(2) + '%',
				wcChangePercent: (inputs.workingCapitalChangeAsPercentOfRevenue * 100).toFixed(2) + '%',
				totalDebt: inputs.totalDebt,
				cash: inputs.cash,
				netDebt: inputs.totalDebt - inputs.cash,
				sharesOutstanding: inputs.sharesOutstanding,
				currentFCF: inputs.freeCashFlow || 'N/A',
			});
			
			console.log('🔢 Valuation Math Check:', {
				'Enterprise Value (M)': dcfData.result.enterpriseValue,
				'Net Debt (M)': inputs.totalDebt - inputs.cash,
				'Equity Value (M)': dcfData.result.equityValue,
				'Shares Outstanding (M)': inputs.sharesOutstanding,
				'Fair Value = Equity / Shares': `${(dcfData.result.equityValue / inputs.sharesOutstanding).toFixed(2)}`,
				'Actual Fair Value': dcfData.result.fairValuePerShare,
			});
			
			setDCFResult(dcfData.result);
			setSensitivityMatrix(dcfData);
			
		} catch (err: any) {
			setError(err.message);
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const formatCurrency = (value: number, decimals: number = 0) => {
		if (value >= 1e6) return `$${(value / 1e6).toFixed(decimals)}T`;
		if (value >= 1e3) return `$${(value / 1e3).toFixed(decimals)}B`;
		return `$${value.toFixed(decimals)}M`;
	};

	const formatPercent = (value: number) => {
		return `${(value * 100).toFixed(2)}%`;
	};

	return (
		<AppShell>
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-5xl font-bold text-gray-100 mb-4">
						💰 Valuation Agent
					</h1>
					<p className="text-xl text-gray-300">
						DCF (Discounted Cash Flow) Analysis
					</p>
				</div>

				{/* Input Form */}
				<div className="rounded-2xl p-8 mb-8">
				<h2 className="text-2xl font-bold text-gray-100 mb-6">Company Selection</h2>
				
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<div>
						<label className="block text-sm font-bold text-gray-100 mb-2">
							Ticker Symbol
						</label>
						<input
							type="text"
							value={ticker}
							onChange={(e) => setTicker(e.target.value.toUpperCase())}
							className="w-full px-4 py-2 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
							placeholder="AAPL"
						/>
					</div>
					
					<div>
						<label className="block text-sm font-bold text-gray-100 mb-2">
							Form Type
						</label>
						<select
							value={form}
							onChange={(e) => setForm(e.target.value)}
							className="w-full px-4 py-2 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
						>
							<option value="10-K">10-K (Annual)</option>
							<option value="10-Q">10-Q (Quarterly)</option>
						</select>
					</div>						<div>
							<label className="block text-sm font-bold text-gray-100 mb-2">
								Fiscal Year
							</label>
							<input
								type="number"
								value={year}
								onChange={(e) => setYear(parseInt(e.target.value))}
								className="w-full px-4 py-2 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
								placeholder="2024"
							/>
						</div>
						
						<div>
							<label className="block text-sm font-bold text-gray-100 mb-2">
								Filed Date
							</label>
							<input
								type="date"
								value={filedDate}
								onChange={(e) => setFiledDate(e.target.value)}
								className="w-full px-4 py-2 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
							/>
						</div>
				</div>

				<button
					onClick={handleRunValuation}
					disabled={loading}
					className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
				>
					{loading ? '🔄 Calculating DCF...' : '🚀 Run DCF Valuation'}
				</button>
			</div>				{/* Error Display */}
				{error && (
					<div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-8">
						<p className="text-red-200">❌ {error}</p>
					</div>
				)}

				{/* DCF Results */}
				{dcfResult && dcfInputs && (
					<div className="space-y-8">
						{/* Valuation Summary */}
						<div className="p-8">
							<h2 className="text-3xl font-bold text-gray-100 mb-6">
								📊 Valuation Summary
							</h2>
							
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
								<div>
									<p className="text-gray-300 text-sm mb-2">Current Price</p>
									<p className="text-4xl font-bold text-gray-100">
										{currentPrice ? `$${currentPrice.toFixed(2)}` : 'N/A'}
									</p>
								</div>
								
								<div>
									<p className="text-gray-300 text-sm mb-2">DCF Fair Value</p>
									<p className="text-4xl font-bold text-green-400">
										${dcfResult.fairValuePerShare.toFixed(2)}
									</p>
								</div>
								
								<div>
									<p className="text-gray-300 text-sm mb-2">Upside / Downside</p>
									<p className={`text-4xl font-bold ${dcfResult.upside && dcfResult.upside > 0 ? 'text-green-400' : 'text-red-400'}`}>
										{dcfResult.upside !== undefined ? `${dcfResult.upside.toFixed(2)}%` : 'N/A'}
										{dcfResult.upside !== undefined && (dcfResult.upside > 0 ? ' 🚀' : ' 📉')}
									</p>
								</div>
							</div>
							
							{/* Recommendation */}
							<div>
								<p className="text-lg text-gray-300">
									<span className="font-semibold text-gray-100">Recommendation:</span>{' '}
									{dcfResult.upside !== undefined && dcfResult.upside > 15 && <span className="text-green-400 font-bold">BUY 🚀</span>}
									{dcfResult.upside !== undefined && dcfResult.upside >= -15 && dcfResult.upside <= 15 && <span className="text-yellow-400 font-bold">HOLD 📊</span>}
									{dcfResult.upside !== undefined && dcfResult.upside < -15 && <span className="text-red-400 font-bold">SELL 📉</span>}
							{dcfResult.upside === undefined && <span className="text-gray-400">N/A</span>}
						</p>
						<p className="text-sm text-gray-200 mt-2">
							<span className="font-bold text-white">WACC Used:</span> {formatPercent(dcfInputs.wacc)}
						</p>
					</div>
				</div>						{/* DCF Assumptions */}
						<div className="p-8">
							<h2 className="text-2xl font-bold text-gray-100 mb-6">
								⚙️ DCF Assumptions & Inputs
							</h2>
							<p className="text-gray-300 text-sm mb-4">
								All metrics synced from Financial Understanding Agent for consistency
							</p>
							
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{/* Revenue & Growth */}
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">Base Revenue (TTM)</p>
									<p className="text-xl font-bold text-white">${(dcfInputs.revenue / 1_000_000_000).toFixed(1)}B</p>
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">Revenue Growth Rate</p>
									<p className="text-xl font-bold text-white">{formatPercent(dcfInputs.revenueGrowthRate)}</p>
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">Terminal Growth Rate</p>
									<p className="text-xl font-bold text-white">{formatPercent(dcfInputs.terminalGrowthRate)}</p>
								</div>
								
								{/* Margins & Rates */}
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">Operating Margin</p>
									<p className="text-xl font-bold text-white">{formatPercent(dcfInputs.operatingMargin)}</p>
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">Tax Rate</p>
									<p className="text-xl font-bold text-white">{formatPercent(dcfInputs.taxRate)}</p>
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">WACC</p>
									<p className="text-xl font-bold text-emerald-300">{formatPercent(dcfInputs.wacc)}</p>
								</div>
								
								{/* CapEx & Working Capital */}
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">CapEx (% of Revenue)</p>
									<p className="text-xl font-bold text-white">{formatPercent(dcfInputs.capexAsPercentOfRevenue)}</p>
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">WC Change (% of Rev)</p>
									<p className="text-xl font-bold text-white">{formatPercent(dcfInputs.workingCapitalChangeAsPercentOfRevenue)}</p>
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">Shares Outstanding</p>
									<p className="text-xl font-bold text-white">{(dcfInputs.sharesOutstanding / 1000).toFixed(2)}B</p>
								</div>
								
								{/* Debt & Cash */}
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">Total Debt</p>
									<p className="text-xl font-bold text-white">${(dcfInputs.totalDebt / 1_000_000_000).toFixed(1)}B</p>
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">Cash & Equivalents</p>
									<p className="text-xl font-bold text-white">${(dcfInputs.cash / 1_000_000_000).toFixed(1)}B</p>
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-200 mb-1">Net Debt</p>
									<p className="text-xl font-bold text-white">${((dcfInputs.totalDebt - dcfInputs.cash) / 1_000_000_000).toFixed(1)}B</p>
								</div>
							</div>
						</div>

						{/* To be continued: DCF Table, Sensitivity Matrix */}
						<div className="rounded-2xl p-8">
							<h2 className="text-2xl font-bold text-gray-100 mb-4">
								📈 5-Year Projections
							</h2>
							<p className="text-gray-300 mb-4">Coming next: Full projection table, sensitivity analysis, and editable assumptions...</p>
						</div>
					</div>
				)}
			</div>
		</div>
		</AppShell>
	);
}

