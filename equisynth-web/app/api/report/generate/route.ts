import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Report Composer Agent API
 * Aggregates data from all previous agents and generates a comprehensive equity research report
 */

/**
 * Format number with thousand separators
 */
function formatNumber(num: number | null | undefined, decimals: number = 0): string {
	if (num === null || num === undefined || isNaN(num)) return 'N/A';
	return num.toLocaleString('en-US', { 
		minimumFractionDigits: decimals, 
		maximumFractionDigits: decimals 
	});
}

/**
 * Format currency with thousand separators
 */
function formatCurrency(num: number | null | undefined, decimals: number = 2): string {
	if (num === null || num === undefined || isNaN(num)) return 'N/A';
	return '$' + num.toLocaleString('en-US', { 
		minimumFractionDigits: decimals, 
		maximumFractionDigits: decimals 
	});
}

interface ReportData {
	ticker: string;
	form: string;
	filed: string;
	
	// Market Data
	marketData: {
		currentPrice: number;
		marketCap: number;
		peRatio: number | null;
		dividendYield: number | null;
		beta: number | null;
	};
	
	// Financial Metrics
	financialMetrics: {
		revenue: number;
		netIncome: number;
		operatingIncome: number;
		totalAssets: number;
		totalLiabilities: number;
		totalEquity: number;
		roe: number;
		roa: number;
		roic: number;
		wacc: number;
		debtToEquity: number;
		currentRatio: number;
		freeCashFlow: number;
		operatingCashFlow: number;
	};
	
	// Valuation Results
	valuation: {
		dcfFairValue: number | null;
		currentPrice: number;
		upside: number | null;
		recommendation: string;
		wacc: number;
		revenueGrowthRate: number;
		terminalGrowthRate: number;
		note?: string;
	};
	
	// Narrative Sections (from RAG)
	narratives: {
		businessDescription: string;
		riskFactors: string;
		mda: string;
	};
	
	// Sentiment Analysis (optional)
	sentiment?: {
		sentiment: 'positive' | 'neutral' | 'negative';
		sentimentScore: number;
		tone: 'optimistic' | 'cautious' | 'pessimistic';
		confidence: number;
		keyQuotes: Array<{
			text: string;
			confidence: number;
			sentiment: 'positive' | 'neutral' | 'negative';
		}>;
	};
}

/**
 * Fetch relevant chunks from RAG for narrative sections
 */
async function getNarrativeChunks(ticker: string, form: string, filed: string, section: string): Promise<string[]> {
	try {
		const chunksPath = path.join(process.cwd(), 'data', ticker, `${form}_${filed}`, 'chunks.jsonl');
		const chunksData = await fs.readFile(chunksPath, 'utf-8');
		
		const chunks = chunksData
			.split('\n')
			.filter(line => line.trim())
			.map(line => JSON.parse(line))
			.filter((chunk: any) => {
				const sectionLower = section.toLowerCase();
				const chunkSection = chunk.metadata?.section?.toLowerCase() || '';
				const chunkText = (chunk.text || '').toLowerCase();
				
				// Match by section name in metadata
				if (chunkSection.includes(sectionLower) || sectionLower.includes(chunkSection)) {
					// Also filter out chunks that are just headers/titles (very short or contain only "Item X")
					const text = chunk.text || '';
					if (text.length > 50 && !/^Item\s+\d+[A-Z]?\.?\s*$/.test(text.trim())) {
						return true;
					}
				}
				
				// For Business Description, also search in text content
				if (section === 'Business Description' || section === 'MD&A') {
					if ((chunkText.includes('business') || chunkText.includes('company') || chunkText.includes('operates') || 
					     chunkSection.includes('business') || chunkSection.includes('overview')) &&
					    chunkText.length > 100) { // Must have substantial content
						return true;
					}
				}
				
				// For Risk Factors, search in text
				if (section === 'Risk Factors') {
					const text = chunk.text || '';
					if ((chunkText.includes('risk') || chunkSection.includes('risk')) &&
					    chunkText.length > 100 &&
					    !/^Item\s+1A\.?\s*$/i.test(text.trim())) {
						return true;
					}
				}
				
				return false;
			})
			.slice(0, 8) // Get top 8 relevant chunks for better content
			.map((chunk: any) => chunk.text)
			.filter(text => text && text.trim().length > 50); // Filter out empty or very short chunks
		
		return chunks;
	} catch (error) {
		console.warn(`Could not load chunks for ${section}:`, error);
		return [];
	}
}

/**
 * Generate report sections using template + data
 */
function generateReportSection(
	section: string,
	data: ReportData,
	narrativeChunks: Record<string, string[]>
): string {
	switch (section) {
		case 'executive_summary':
			return generateExecutiveSummary(data);
		case 'business_overview':
			return generateBusinessOverview(data, narrativeChunks.businessDescription || []);
		case 'valuation':
			return generateValuationSection(data);
		case 'catalysts_risks':
			return generateCatalystsRisks(data, narrativeChunks.riskFactors || []);
		case 'analyst_commentary':
			return generateAnalystCommentary(data, narrativeChunks.mda || []);
		case 'bull_bear':
			return generateBullBearCase(data);
		default:
			return '';
	}
}

function generateExecutiveSummary(data: ReportData): string {
	const { ticker, marketData, valuation, financialMetrics } = data;
	const recommendation = valuation.recommendation || 'HOLD';
	
	// Format market cap - check if it's in millions or actual value
	let marketCapDisplay: string;
	if (marketData.marketCap > 1e12) {
		// Already in actual dollars (trillions)
		marketCapDisplay = `${formatCurrency(marketData.marketCap / 1e9, 0)} billion`;
	} else if (marketData.marketCap > 1e6) {
		// Likely in millions
		marketCapDisplay = `${formatCurrency(marketData.marketCap / 1e3, 0)} billion`;
	} else {
		// Fallback
		marketCapDisplay = formatCurrency(marketData.marketCap, 0);
	}
	
	const targetPrice = valuation.dcfFairValue !== null && valuation.dcfFairValue > 0 
		? formatCurrency(valuation.dcfFairValue, 2) 
		: 'N/A';
	const currentPrice = formatCurrency(marketData.currentPrice, 2);
	const upside = valuation.upside !== null && !isNaN(valuation.upside) && isFinite(valuation.upside)
		? formatNumber(valuation.upside, 2) + '%' 
		: 'N/A';
	
	return `## Executive Summary

**Ticker:** ${ticker} | **Current Price:** ${currentPrice} | **Fair Value:** ${targetPrice} | **Upside/Downside:** ${upside}

**Investment Rating: ${recommendation}**

### Key Highlights

- **Market Capitalization:** ${marketCapDisplay}
- **Trailing P/E Ratio:** ${marketData.peRatio ? formatNumber(marketData.peRatio, 1) : 'N/A'}
- **Revenue (TTM):** ${formatCurrency(financialMetrics.revenue / 1000, 1)} billion
- **Net Income (TTM):** ${formatCurrency(financialMetrics.netIncome / 1000, 1)} billion
- **Free Cash Flow (TTM):** ${formatCurrency(financialMetrics.freeCashFlow / 1000, 1)} billion

### Investment Thesis

${valuation.dcfFairValue !== null && valuation.dcfFairValue > 0 && valuation.upside !== null
	? `Based on our Discounted Cash Flow (DCF) analysis, ${ticker} is currently trading at ${currentPrice} per share, compared to our calculated fair value of ${targetPrice}. This implies a ${valuation.upside > 0 ? 'potential upside' : 'downside'} of ${Math.abs(valuation.upside).toFixed(2)}%.`
	: `${ticker} is currently trading at ${currentPrice} per share. ${valuation.note || 'Please run the Valuation Agent to get DCF fair value analysis.'}`}

The company demonstrates strong financial fundamentals with:
- Return on Equity (ROE): ${formatNumber(financialMetrics.roe, 2)}%
- Return on Invested Capital (ROIC): ${formatNumber(financialMetrics.roic, 2)}%
- Free Cash Flow Margin: ${formatNumber((financialMetrics.freeCashFlow / financialMetrics.revenue) * 100, 1)}%

**Recommendation:** ${recommendation}${valuation.upside !== null 
	? ` - ${valuation.upside > 15 ? 'Strong Buy' : valuation.upside > 0 ? 'Buy' : valuation.upside > -15 ? 'Hold' : 'Sell'} based on ${valuation.dcfFairValue !== null && valuation.dcfFairValue > 0 ? 'DCF valuation' : 'fundamental'} analysis.`
	: ' - Analysis pending valuation.'}${valuation.note ? ` ${valuation.note}` : ''}`;
}

function generateBusinessOverview(data: ReportData, businessChunks: string[]): string {
	const { ticker, financialMetrics } = data;
	const businessText = businessChunks.slice(0, 3).join(' ').substring(0, 1000) || 
		'Business description will be extracted from SEC filings using semantic search.';
	
	return `## Business Overview & Segment Analysis

### Company Description

${businessText}

### Key Financial Metrics

| Metric | Value |
|--------|-------|
| **Revenue (TTM)** | ${formatCurrency(financialMetrics.revenue / 1000, 1)}B |
| **Operating Income** | ${formatCurrency(financialMetrics.operatingIncome / 1000, 1)}B |
| **Net Income** | ${formatCurrency(financialMetrics.netIncome / 1000, 1)}B |
| **Total Assets** | ${formatCurrency(financialMetrics.totalAssets / 1000, 1)}B |
| **Total Equity** | ${formatCurrency(financialMetrics.totalEquity / 1000, 1)}B |
| **Operating Cash Flow** | ${formatCurrency(financialMetrics.operatingCashFlow / 1000, 1)}B |
| **Free Cash Flow** | ${formatCurrency(financialMetrics.freeCashFlow / 1000, 1)}B |

### Profitability Analysis

- **Return on Equity (ROE):** ${formatNumber(financialMetrics.roe, 2)}%
- **Return on Assets (ROA):** ${formatNumber(financialMetrics.roa, 2)}%
- **Return on Invested Capital (ROIC):** ${formatNumber(financialMetrics.roic, 2)}%
- **Weighted Average Cost of Capital (WACC):** ${formatNumber(data.valuation.wacc * 100, 2)}% (DCF model)

${financialMetrics.roic > (data.valuation.wacc * 100) ? 
	'✅ **Value Creation:** ROIC exceeds WACC, indicating the company creates shareholder value through efficient capital allocation.' :
	'⚠️ **Value Destruction:** WACC exceeds ROIC, indicating potential inefficiency in capital allocation.'}

### Financial Health

- **Debt-to-Equity Ratio:** ${formatNumber(financialMetrics.debtToEquity, 2)}
- **Current Ratio:** ${formatNumber(financialMetrics.currentRatio, 2)}
- **Equity Ratio:** ${formatNumber((financialMetrics.totalEquity / financialMetrics.totalAssets) * 100, 1)}%`;
}

function generateValuationSection(data: ReportData): string {
	const { valuation, marketData } = data;
	const { dcfFairValue, currentPrice, upside, wacc, revenueGrowthRate, terminalGrowthRate } = valuation;
	
	const fairValueDisplay = dcfFairValue !== null && dcfFairValue > 0 
		? formatCurrency(dcfFairValue, 2) 
		: 'N/A (Run Valuation Agent)';
	const currentPriceDisplay = formatCurrency(currentPrice, 2);
	const upsideDisplay = upside !== null ? formatNumber(upside, 2) + '%' : 'N/A';
	
	return `## Valuation & Forecast

### DCF Model Summary

| Metric | Value |
|--------|-------|
| **Current Market Price** | ${currentPriceDisplay} |
| **DCF Fair Value** | ${fairValueDisplay} |
| **Upside/Downside** | ${upsideDisplay} |
| **Recommendation** | ${valuation.recommendation} |

### DCF Assumptions

- **WACC (Discount Rate):** ${formatNumber(wacc * 100, 2)}%
- **Revenue Growth Rate (5-Year):** ${formatNumber(revenueGrowthRate * 100, 2)}%
- **Terminal Growth Rate:** ${formatNumber(terminalGrowthRate * 100, 2)}%
- **Valuation Methodology:** Discounted Cash Flow (5-year projections + terminal value)

### Valuation Analysis

${dcfFairValue !== null && dcfFairValue > 0 
	? `Based on our DCF model using ${formatNumber(revenueGrowthRate * 100, 1)}% revenue growth and ${formatNumber(wacc * 100, 2)}% WACC, we calculate a fair value of ${fairValueDisplay} per share.

**Current Price:** ${currentPriceDisplay}  
**Fair Value:** ${fairValueDisplay}  
**Difference:** ${upside !== null ? (upside > 0 ? '+' : '') + upsideDisplay : 'N/A'}

${upside !== null && upside > 15 ? 
	'**Investment Thesis:** Significant upside potential suggests the stock is undervalued relative to fundamentals.' :
	upside !== null && upside > 0 ?
	'**Investment Thesis:** Moderate upside potential with balanced risk-reward profile.' :
	upside !== null && upside > -15 ?
	'**Investment Thesis:** Fairly valued with limited upside/downside from current levels.' :
	upside !== null ?
	'**Investment Thesis:** Downside risk suggests the stock may be overvalued relative to fundamentals.' :
	'**Investment Thesis:** Valuation analysis requires running the Valuation Agent.'}`
	: `${valuation.note || 'Please run the Valuation Agent to get DCF fair value analysis.'}`}

### Valuation Methodology Notes

This valuation uses a simplified DCF model. For a more comprehensive analysis, consider:
- Sensitivity analysis on key assumptions (growth rate, WACC, terminal growth)
- Comparable company multiples (P/E, EV/EBITDA, P/S)
- Scenario analysis (bull, base, bear cases)`;
}

function generateBullBearCase(data: ReportData): string {
	const { financialMetrics, valuation, sentiment } = data;
	
	// Generate bull case
	const bullGrowth = valuation.revenueGrowthRate * 1.5; // 50% higher growth
	const bullWACC = valuation.wacc * 0.9; // 10% lower WACC (better execution)
	const bullFairValue = valuation.dcfFairValue ? valuation.dcfFairValue * 1.4 : null; // Rough estimate
	
	// Generate bear case
	const bearGrowth = valuation.revenueGrowthRate * 0.7; // 30% lower growth
	const bearWACC = valuation.wacc * 1.15; // 15% higher WACC (higher risk)
	const bearFairValue = valuation.dcfFairValue ? valuation.dcfFairValue * 0.7 : null; // Rough estimate
	
	// Adjust based on sentiment if available
	let bullProbability = 0.35; // Base 35%
	let bearProbability = 0.35; // Base 35%
	
	if (sentiment) {
		if (sentiment.confidence >= 7 && sentiment.sentiment === 'positive') {
			bullProbability = 0.45;
			bearProbability = 0.25;
		} else if (sentiment.confidence <= 4 && sentiment.sentiment === 'negative') {
			bullProbability = 0.25;
			bearProbability = 0.45;
		}
	}
	
	return `## Bull vs Bear Scenarios

### Bull Case (${(bullProbability * 100).toFixed(0)}% Probability)

**Assumptions:**
- Revenue Growth: ${formatNumber(bullGrowth * 100, 1)}% (vs base ${formatNumber(valuation.revenueGrowthRate * 100, 1)}%)
- WACC: ${formatNumber(bullWACC * 100, 2)}% (vs base ${formatNumber(valuation.wacc * 100, 2)}%)
- Management Confidence: ${sentiment ? (sentiment.confidence >= 7 ? 'High' : sentiment.confidence >= 4 ? 'Medium' : 'Low') : 'N/A'}

**Key Drivers:**
${sentiment && sentiment.sentiment === 'positive' ? '- Management shows optimistic outlook based on sentiment analysis\n' : ''}
- Strong execution on growth initiatives
- Market share gains
- Successful new product launches
${financialMetrics.roic > financialMetrics.wacc ? '- ROIC exceeds WACC suggests sustainable value creation\n' : ''}

**Fair Value Estimate:** ${bullFairValue ? formatCurrency(bullFairValue, 2) : 'N/A'} per share
**Upside vs Current Price:** ${valuation.currentPrice && bullFairValue ? formatNumber(((bullFairValue - valuation.currentPrice) / valuation.currentPrice) * 100, 1) + '%' : 'N/A'}

---

### Bear Case (${(bearProbability * 100).toFixed(0)}% Probability)

**Assumptions:**
- Revenue Growth: ${formatNumber(bearGrowth * 100, 1)}% (vs base ${formatNumber(valuation.revenueGrowthRate * 100, 1)}%)
- WACC: ${formatNumber(bearWACC * 100, 2)}% (vs base ${formatNumber(valuation.wacc * 100, 2)}%)
- Management Confidence: ${sentiment ? (sentiment.confidence <= 4 ? 'Low' : sentiment.confidence < 7 ? 'Medium' : 'High') : 'N/A'}

**Key Risks:**
${sentiment && sentiment.sentiment === 'negative' ? '- Management expresses caution/concerns based on sentiment analysis\n' : ''}
- Competitive pressures intensifying
- Macroeconomic headwinds
- Execution challenges
${financialMetrics.roic < financialMetrics.wacc ? '- ROIC below WACC indicates capital allocation concerns\n' : ''}

**Fair Value Estimate:** ${bearFairValue ? formatCurrency(bearFairValue, 2) : 'N/A'} per share
**Downside vs Current Price:** ${valuation.currentPrice && bearFairValue ? formatNumber(((bearFairValue - valuation.currentPrice) / valuation.currentPrice) * 100, 1) + '%' : 'N/A'}

---

### Base Case (${((1 - bullProbability - bearProbability) * 100).toFixed(0)}% Probability)

**Current DCF Assumptions:**
- Revenue Growth: ${formatNumber(valuation.revenueGrowthRate * 100, 1)}%
- WACC: ${formatNumber(valuation.wacc * 100, 2)}%

**Fair Value:** ${valuation.dcfFairValue ? formatCurrency(valuation.dcfFairValue, 2) : 'N/A'} per share
**Upside/Downside:** ${valuation.upside !== null ? formatNumber(valuation.upside, 2) + '%' : 'N/A'}
`;
}

function generateCatalystsRisks(data: ReportData, riskChunks: string[]): string {
	const { financialMetrics, valuation } = data;
	const riskText = riskChunks.slice(0, 5).join(' ').substring(0, 1500) || 
		'Risk factors extracted from SEC filings. Please review the full 10-K filing for complete risk disclosure.';
	
	return `## Catalysts & Risks

### Key Catalysts

1. **Strong Financial Performance**
   - ROIC of ${formatNumber(financialMetrics.roic, 2)}% exceeds WACC of ${formatNumber(data.valuation.wacc * 100, 2)}%, indicating value creation
   - Robust free cash flow generation of ${formatCurrency(financialMetrics.freeCashFlow / 1000, 1)} billion supports growth initiatives
   
2. **Valuation Upside**
   ${valuation.upside !== null 
	? `- DCF model suggests ${valuation.upside > 0 ? 'upside potential' : 'downside risk'} of ${formatNumber(Math.abs(valuation.upside), 1)}%
   ${valuation.upside > 15 ? '- Significant margin of safety based on fundamentals' : ''}`
	: '- Run Valuation Agent to get DCF-based valuation assessment'}

3. **Financial Health**
   - Current ratio of ${formatNumber(financialMetrics.currentRatio, 2)} indicates ${financialMetrics.currentRatio >= 1.5 ? 'strong' : financialMetrics.currentRatio >= 1.0 ? 'adequate' : 'potentially constrained'} liquidity position
   - Debt-to-equity ratio of ${formatNumber(financialMetrics.debtToEquity, 2)} suggests ${financialMetrics.debtToEquity < 0.5 ? 'conservative' : financialMetrics.debtToEquity < 2 ? 'moderate' : 'high'} leverage

### Key Risks

${riskText}

### Risk Mitigation

Investors should monitor:
- Execution of growth strategy and revenue trajectory
- Changes in competitive landscape
- Macroeconomic conditions affecting demand
- Regulatory changes impacting operations
- Changes in key financial metrics (ROIC, margins, cash flow generation)`;
}

function generateAnalystCommentary(data: ReportData, mdaChunks: string[]): string {
	const { ticker, financialMetrics, valuation, marketData, sentiment } = data;
	const mdaText = mdaChunks.slice(0, 3).join(' ').substring(0, 1200) || 
		'Management discussion and analysis extracted from SEC filings.';
	
	return `## Analyst Commentary

### Management Discussion Highlights

${mdaText}

${sentiment ? `
### Management Sentiment & Confidence Analysis

**Overall Sentiment:** ${sentiment.sentiment.toUpperCase()} (${sentiment.sentimentScore.toFixed(1)}/100)  
**Tone:** ${sentiment.tone.charAt(0).toUpperCase() + sentiment.tone.slice(1)}  
**Confidence Score:** ${sentiment.confidence.toFixed(1)}/10

${sentiment.confidence >= 7 
	? `✅ **High Confidence:** Management shows strong conviction in forward-looking statements and guidance.`
	: sentiment.confidence >= 4
	? `⚖️ **Medium Confidence:** Management statements show moderate certainty with some conditional language.`
	: `⚠️ **Low Confidence:** Management uses cautious or vague language, suggesting uncertainty in outlook.`}

${sentiment.keyQuotes && sentiment.keyQuotes.length > 0 ? `
**Key Management Statements:**

${sentiment.keyQuotes.slice(0, 3).map((quote, idx) => 
	`${idx + 1}. "${quote.text.substring(0, 200)}${quote.text.length > 200 ? '...' : ''}" (Key Quote Confidence: ${quote.confidence.toFixed(1)}/10, ${quote.sentiment.toUpperCase()})`
).join('\n\n')}
` : ''}
` : `
### Management Sentiment Analysis

*Run Sentiment & Tone Agent to get management confidence and sentiment analysis from earnings transcripts.*
`}

### Financial Performance Outlook

Based on our analysis:

**Strengths:**
- Strong profitability metrics: ROE ${formatNumber(financialMetrics.roe, 2)}%, ROIC ${formatNumber(financialMetrics.roic, 2)}%
- Healthy free cash flow generation
- ${financialMetrics.currentRatio > 1.5 ? 'Strong' : 'Adequate'} liquidity position

**Concerns:**
${financialMetrics.roic < financialMetrics.wacc ? '- ROIC below WACC suggests potential capital allocation inefficiency\n' : ''}
${valuation.upside !== null && valuation.upside < -15 ? '- Significant valuation premium relative to DCF fair value\n' : ''}
${valuation.dcfFairValue === null || valuation.dcfFairValue === 0 ? '- DCF valuation not available. Please run Valuation Agent for complete analysis.\n' : ''}
${financialMetrics.debtToEquity > 2 ? '- High debt-to-equity ratio warrants monitoring\n' : ''}

### Investment Outlook

**Short-term (0-6 months):**
- Monitor quarterly earnings for revenue growth trajectory
- Track execution against growth assumptions (${formatNumber(valuation.revenueGrowthRate * 100, 1)}% target)
- Watch for changes in competitive dynamics

**Long-term (1-3 years):**
- Focus on sustainable value creation (ROIC vs WACC spread)
- Monitor free cash flow generation and capital allocation
- Assess management's ability to execute growth strategy

### Conclusion

${ticker} presents a ${valuation.upside !== null 
	? (valuation.upside > 15 ? 'compelling investment opportunity' : valuation.upside > 0 ? 'moderate investment case' : 'challenging investment case')
	: 'investment case requiring further analysis'} based on our fundamental${valuation.dcfFairValue !== null && valuation.dcfFairValue > 0 ? ' and valuation' : ''} analysis. Investors should weigh the ${valuation.upside !== null && valuation.upside > 0 ? 'upside potential' : valuation.upside !== null ? 'downside risks' : 'risks and opportunities'} against their risk tolerance and investment objectives.

**Target Price:** ${valuation.dcfFairValue !== null && valuation.dcfFairValue > 0 ? formatCurrency(valuation.dcfFairValue, 2) : 'N/A (Run Valuation Agent)'}  
**Recommendation:** ${valuation.recommendation}${valuation.note ? `\n\n*${valuation.note}*` : ''}`;
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const ticker = searchParams.get('ticker');
		const form = searchParams.get('form') || '10-K';
		const filed = searchParams.get('filed');

		if (!ticker || !filed) {
			return NextResponse.json(
				{ error: 'ticker and filed date are required' },
				{ status: 400 }
			);
		}

		// Step 1: Fetch market data
		const marketRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/market/quote?ticker=${ticker}`);
		if (!marketRes.ok) throw new Error('Failed to fetch market data');
		const marketData = await marketRes.json();

		// Step 2: Fetch financial metrics
		const financialsRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/data/financials?ticker=${ticker}&form=${form}&filed=${filed}`);
		if (!financialsRes.ok) throw new Error('Failed to fetch financial metrics');
		const financialsData = await financialsRes.json();

		// Step 3: Call Valuation Agent DCF API to get actual results
		const currentPrice = marketData.price || 0;
		
		// Fetch analyst estimates for shares outstanding and growth
		let estimatesData: any = {};
		try {
			const estimatesRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/valuation/estimates?ticker=${ticker}`);
			if (estimatesRes.ok) {
				estimatesData = await estimatesRes.json();
			}
		} catch (err) {
			console.warn('Could not fetch estimates:', err);
		}
		
		// Build DCF inputs (same logic as Valuation page)
		const metrics = financialsData.keyMetrics || {};
		const revenue = metrics.revenue || 0;
		const netIncome = metrics.netIncome || 0;
		const operatingIncome = metrics.operatingIncome || 0;
		
		// Calculate shares outstanding (must be in MILLIONS for DCF model)
		let sharesOutstanding = estimatesData.sharesOutstanding;
		
		// If we got shares from estimates, they should already be in millions from the API
		// But if we calculate from market cap, we need to be careful about units
		if (!sharesOutstanding || sharesOutstanding <= 0) {
			const marketCap = marketData.marketCap || 0;
			if (marketCap > 0 && currentPrice > 0) {
				// Market cap from API is typically in millions, convert to actual dollars
				const marketCapActual = marketCap * 1e6;
				// Calculate shares: marketCap (dollars) / price per share = total shares
				// Then convert to millions for DCF model
				sharesOutstanding = (marketCapActual / currentPrice) / 1e6;
			} else {
				// Fallback to defaults (already in millions)
				const defaultShares: Record<string, number> = {
					'AAPL': 14773,
					'MSFT': 7400,
					'GOOGL': 12500,
					'META': 2400,
					'AMZN': 10400,
				};
				sharesOutstanding = defaultShares[ticker.toUpperCase()] || 15000;
			}
		}
		
		// Sanity check: If sharesOutstanding is > 1,000,000, it's likely in actual shares, not millions
		// Convert it to millions
		if (sharesOutstanding > 1000000) {
			console.warn(`⚠️ Shares outstanding seems too large (${sharesOutstanding}). Converting from actual shares to millions.`);
			sharesOutstanding = sharesOutstanding / 1e6;
		}
		
		console.log(`📊 Shares Outstanding (millions): ${sharesOutstanding.toFixed(2)}`);
		
		// Calculate other inputs
		const totalDebt = (metrics.longTermDebt || 0) + (metrics.shortTermDebt || 0);
		const cash = metrics.cash || 0;
		
		// Revenue growth rate
		const largeCapTech = ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'NVDA'];
		let revenueGrowthRate = estimatesData.estimatedGrowthRate || estimatesData.historicalGrowthRate;
		if (!revenueGrowthRate || revenueGrowthRate <= 0) {
			revenueGrowthRate = largeCapTech.includes(ticker.toUpperCase()) ? 0.085 : 0.07;
		}
		
		// Operating margin and tax rate
		const operatingMargin = revenue > 0 && operatingIncome > 0 ? operatingIncome / revenue : 0.25;
		const taxRate = netIncome > 0 && operatingIncome > 0 ? 1 - (netIncome / operatingIncome) : 0.21;
		
		// WACC
		function getSectorWACC(ticker: string): number {
			const tickerUpper = ticker.toUpperCase();
			if (tickerUpper === 'AAPL') return 0.085;
			if (largeCapTech.includes(tickerUpper)) return 0.09;
			return 0.11;
		}
		const wacc = getSectorWACC(ticker);
		
		// FCF calculation
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
		
		const freeCashFlow = metrics.freeCashFlow || 
			(metrics.operatingCashFlow ? Number(metrics.operatingCashFlow) - capexValue : 0) ||
			netIncome || 0;
		
		// CapEx as % of revenue
		let capexAsPercentOfRevenue = capexValue && revenue ? Math.abs(capexValue) / revenue : 0.03;
		if (capexAsPercentOfRevenue > 0.05 || capexAsPercentOfRevenue < 0.02) {
			capexAsPercentOfRevenue = 0.03;
		}
		
		// Terminal growth
		const terminalGrowthRate = largeCapTech.includes(ticker.toUpperCase()) ? 0.03 : 0.025;
		
		// Call DCF API - use direct import instead of fetch to avoid URL issues
		let valuation: any = {
			dcfFairValue: null as number | null,
			currentPrice,
			upside: null as number | null,
			recommendation: 'NOT RATED',
			wacc,
			revenueGrowthRate,
			terminalGrowthRate,
			note: 'Could not calculate DCF valuation.',
		};
		
		// Check if we have minimum required data
		console.log('📊 Report DCF Inputs Check:', {
			revenue: revenue > 0,
			freeCashFlow: freeCashFlow > 0,
			sharesOutstanding: sharesOutstanding > 0,
			currentPrice: currentPrice > 0,
			values: { revenue, freeCashFlow, sharesOutstanding, currentPrice },
		});
		
		if (revenue > 0 && freeCashFlow > 0 && sharesOutstanding > 0 && currentPrice > 0) {
			try {
				// Import DCF calculation directly (no HTTP call needed)
				const { calculateDCF } = await import('@/app/lib/dcfModel');
				
				const dcfInputs = {
					revenue,
					operatingIncome,
					netIncome,
					freeCashFlow,
					totalDebt,
					cash,
					sharesOutstanding,
					wacc,
					revenueGrowthRate,
					operatingMargin,
					taxRate,
					terminalGrowthRate,
					capexAsPercentOfRevenue,
					workingCapitalChangeAsPercentOfRevenue: 0.005,
				};
				
				console.log('🔍 Calling DCF with inputs:', {
					revenue,
					freeCashFlow,
					sharesOutstanding,
					currentPrice,
					wacc: (wacc * 100).toFixed(2) + '%',
					revenueGrowthRate: (revenueGrowthRate * 100).toFixed(2) + '%',
				});
				
				const dcfResult = calculateDCF(dcfInputs, currentPrice);
				
				console.log('✅ DCF Result:', {
					fairValuePerShare: dcfResult.fairValuePerShare,
					upside: dcfResult.upside,
					equityValue: dcfResult.equityValue,
				});
				
				// Validate DCF result - fairValuePerShare must be > 0 and reasonable
				if (dcfResult && dcfResult.fairValuePerShare && dcfResult.fairValuePerShare > 0 && dcfResult.fairValuePerShare < currentPrice * 10) {
					valuation.dcfFairValue = dcfResult.fairValuePerShare;
					
					// Only use upside if it's a valid number
					if (dcfResult.upside !== undefined && !isNaN(dcfResult.upside) && isFinite(dcfResult.upside)) {
						valuation.upside = dcfResult.upside;
						
						if (valuation.upside > 15) valuation.recommendation = 'BUY';
						else if (valuation.upside > 0) valuation.recommendation = 'BUY';
						else if (valuation.upside > -15) valuation.recommendation = 'HOLD';
						else valuation.recommendation = 'SELL';
					} else {
						// Calculate upside manually if DCF didn't provide it
						valuation.upside = ((dcfResult.fairValuePerShare - currentPrice) / currentPrice) * 100;
						
						if (valuation.upside > 15) valuation.recommendation = 'BUY';
						else if (valuation.upside > 0) valuation.recommendation = 'BUY';
						else if (valuation.upside > -15) valuation.recommendation = 'HOLD';
						else valuation.recommendation = 'SELL';
					}
					
					valuation.note = undefined; // Remove note if successful
				} else {
					console.warn('DCF calculation returned invalid result:', {
						fairValuePerShare: dcfResult?.fairValuePerShare,
						equityValue: dcfResult?.equityValue,
						sharesOutstanding: dcfInputs.sharesOutstanding,
						freeCashFlow: dcfInputs.freeCashFlow,
					});
					valuation.note = `DCF calculation returned invalid fair value (${dcfResult?.fairValuePerShare || 0}). Check inputs.`;
				}
			} catch (err: any) {
				console.error('DCF calculation error:', err?.message || err);
				valuation.note = `DCF calculation failed: ${err?.message || 'Unknown error'}`;
			}
		} else {
			console.warn('Missing required data for DCF:', {
				revenue: revenue > 0,
				freeCashFlow: freeCashFlow > 0,
				sharesOutstanding: sharesOutstanding > 0,
				currentPrice: currentPrice > 0,
			});
			valuation.note = 'Missing required data for DCF calculation. Please run Financial Understanding and Valuation agents first.';
		}

		// Step 4: Analyze sentiment from narrative sections
		// Try Business Description first (often has more substantive management statements)
		// Fall back to MD&A if Business Description doesn't have enough content
		let sentimentAnalysis: any = null;
		try {
			// Try Business Description first - usually has better management statements
			let analysisText = '';
			let source = 'Business Description';
			
			const businessChunks = await getNarrativeChunks(ticker, form, filed, 'Business Description');
			if (businessChunks.length > 0) {
				analysisText = businessChunks
					.map(chunk => chunk.trim())
					.filter(chunk => {
						// Minimal filtering - just remove obvious junk
						const lower = chunk.toLowerCase();
						if (/^(item|part)\s+\d+[a-z]?\.?\s*$/i.test(chunk.trim())) return false;
						if (chunk.trim().length < 30) return false;
						return true;
					})
					.join(' ')
					.substring(0, 5000);
			}
			
			// If Business Description doesn't have enough content, try MD&A
			if (analysisText.length < 200) {
				source = 'MD&A';
				const mdaChunks = await getNarrativeChunks(ticker, form, filed, 'MD&A');
				if (mdaChunks.length > 0) {
					analysisText = mdaChunks
						.map(chunk => chunk.trim())
						.filter(chunk => {
							// Minimal filtering
							const lower = chunk.toLowerCase();
							if (/^(item|part)\s+\d+[a-z]?\.?\s*$/i.test(chunk.trim())) return false;
							if (chunk.trim().length < 30) return false;
							return true;
						})
						.join(' ')
						.substring(0, 5000);
				}
			}
			
			if (analysisText.trim().length > 100) {
				console.log(`📝 Analyzing sentiment from ${source} (${analysisText.length} chars)`);
				const sentimentRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sentiment/analyze`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ text: analysisText }),
				});
					
				if (sentimentRes.ok) {
					sentimentAnalysis = await sentimentRes.json();
					console.log(`✅ Sentiment analysis complete: ${sentimentAnalysis.keyQuotes?.length || 0} quotes found`);
					
					// Minimal filtering - only remove absolutely obvious junk
					// Keep everything else, even if it's cautious/vague
					if (sentimentAnalysis.keyQuotes && sentimentAnalysis.keyQuotes.length > 0) {
						console.log(`📊 Original quotes: ${sentimentAnalysis.keyQuotes.length}`);
							const filtered = sentimentAnalysis.keyQuotes.filter((quote: any) => {
								const text = quote.text || '';
								const lower = text.toLowerCase();
								
								// Filter out obvious boilerplate and headers
								if (/^(item|part)\s+\d+[a-z]?\.?\s*$/i.test(text.trim())) return false;
								if (/^forward-looking statements provide/i.test(lower)) return false;
								if (/^security ownership of/i.test(lower)) return false;
								if (/^certain relationships and/i.test(lower)) return false;
								if (text.trim().length < 30) return false; // Reduced from 50 to keep more quotes
								
								// Filter out sentences that are mostly uppercase (likely headers)
								const words = text.trim().split(/\s+/);
								if (words.length < 8 && words.filter((w: string) => /^[A-Z]+$/.test(w)).length > words.length / 2) {
									return false;
								}
								
								return true;
							});
							
							// Additional filtering: remove quotes that are clearly section headers
							const finalFiltered = filtered.filter((quote: any) => {
								const text = quote.text || '';
								const lower = text.toLowerCase().trim();
								
								// Remove quotes that are just section identifiers
								if (/^(item|part)\s+\d+[a-z]?\.?\s*$/i.test(text.trim())) return false;
								if (/^(controls and procedures|other information|disclosure regarding|exhibits|director independence)/i.test(lower)) return false;
								
								// Remove quotes that are too short or don't contain meaningful management language
								if (text.length < 40) return false;
								
								// Skip if it's a legal disclaimer about forward-looking statements or references to other sections
								if (/(many of the forward-looking|statements in this form|references to.*form.*10-?k|part\s+[ivx]+\s*,\s*item|under the heading)/i.test(lower)) {
									return false;
								}
								
								// Skip specific obvious legal disclaimers
								if (/assumes no obligation/i.test(lower)) return false;
								if (/except as required by law/i.test(lower)) return false;
								if (/exhibit and financial statement schedules/i.test(lower)) return false;
								
								// Skip if it's ONLY meta-text (talking about the filing itself) without business content
								const isOnlyMetaText = /^(this form|these statements|such statements|the company assumes|unless otherwise stated.*fiscal calendar)/i.test(lower);
								if (isOnlyMetaText) return false;
								
								// Prefer quotes with business/financial language OR action verbs (more lenient)
								const hasBusinessLanguage = /(revenue|sales|income|profit|margin|growth|market|product|service|strategy|plan|outlook|expect|forecast|guidance|performance|result|business|operating|cash|financial|earnings|customer|demand|supply|competitive|segment|company|we|our)/i.test(text);
								const hasActionVerb = /(expect|believe|anticipate|plan|strategy|focus|grow|expand|improve|increase|decrease|achieve|deliver|generate|create|develop|launch|introduce|invest|operate|manage|execute|will|should)/i.test(text);
								
								// Keep if it has business language OR action verb (more permissive)
								// Only exclude if it has neither AND is very short
								if (!hasBusinessLanguage && !hasActionVerb && text.length < 60) {
									return false;
								}
								
								return true;
							});
							
							// If filtering removed all quotes but we had some, keep at least the top 5 (more permissive)
							if (finalFiltered.length === 0 && sentimentAnalysis.keyQuotes.length > 0) {
								// Try to find quotes with business language or action verbs
								const meaningfulQuotes = sentimentAnalysis.keyQuotes.filter((quote: any) => {
									const text = quote.text || '';
									const lower = text.toLowerCase();
									
									// Skip obvious boilerplate
									if (/assumes no obligation|except as required by law|exhibit and financial statement schedules/i.test(lower)) {
										return false;
									}
									
									// Keep if it has business language OR action verbs
									return /(revenue|sales|income|profit|margin|growth|market|product|service|strategy|plan|outlook|expect|forecast|guidance|performance|result|business|operating|cash|financial|earnings|company|we|our)/i.test(text) ||
										   /(expect|believe|anticipate|plan|strategy|focus|grow|expand|improve|will|should|may)/i.test(text);
								});
								
								if (meaningfulQuotes.length > 0) {
									console.log(`⚠️ Filtered quotes, but keeping ${meaningfulQuotes.length} meaningful quotes.`);
									sentimentAnalysis.keyQuotes = meaningfulQuotes.slice(0, 5);
								} else {
									console.log(`⚠️ No obviously meaningful quotes found. Keeping top 5 quotes anyway to show something.`);
									sentimentAnalysis.keyQuotes = sentimentAnalysis.keyQuotes.slice(0, 5);
								}
							} else {
								sentimentAnalysis.keyQuotes = finalFiltered.length > 0 ? finalFiltered : sentimentAnalysis.keyQuotes.slice(0, 5);
							}
						}
					}
				}
			}
		} catch (err) {
			console.warn('Sentiment analysis failed:', err);
			// Continue without sentiment - not critical
		}

		// Step 5: Get narrative chunks from RAG
		const businessDescription = await getNarrativeChunks(ticker, form, filed, 'Business Description');
		const riskFactors = await getNarrativeChunks(ticker, form, filed, 'Risk Factors');
		const mda = await getNarrativeChunks(ticker, form, filed, 'MD&A');

		// Step 6: Compile report data
		const reportData: ReportData = {
			ticker: ticker.toUpperCase(),
			form,
			filed,
			marketData: {
				currentPrice: marketData.price || 0,
				marketCap: marketData.marketCap || 0,
				peRatio: marketData.trailingPE,
				dividendYield: marketData.dividendYield,
				beta: marketData.beta,
			},
			financialMetrics: {
				revenue: financialsData.keyMetrics?.revenue || 0,
				netIncome: financialsData.keyMetrics?.netIncome || 0,
				operatingIncome: financialsData.keyMetrics?.operatingIncome || 0,
				totalAssets: financialsData.keyMetrics?.totalAssets || 0,
				totalLiabilities: financialsData.keyMetrics?.totalLiabilities || 0,
				totalEquity: financialsData.keyMetrics?.totalEquity || 0,
				roe: financialsData.keyMetrics?.roe || 0,
				roa: financialsData.keyMetrics?.roa || 0,
				roic: financialsData.keyMetrics?.roic || 0,
				wacc: financialsData.keyMetrics?.wacc || 0,
				debtToEquity: financialsData.keyMetrics?.debtToEquity || 0,
				currentRatio: financialsData.keyMetrics?.currentRatio || 0,
				freeCashFlow: financialsData.keyMetrics?.freeCashFlow || 0,
				operatingCashFlow: financialsData.keyMetrics?.operatingCashFlow || 0,
			},
			valuation,
			narratives: {
				businessDescription: businessDescription.join(' '),
				riskFactors: riskFactors.join(' '),
				mda: mda.join(' '),
			},
			sentiment: sentimentAnalysis, // Include sentiment analysis if available
		};

		// Step 7: Generate report sections
		const narratives = {
			businessDescription,
			riskFactors,
			mda,
		};

		const report = {
			metadata: {
				ticker: reportData.ticker,
				form: reportData.form,
				filed: reportData.filed,
				generatedAt: new Date().toISOString(),
			},
			sections: {
				executive_summary: generateReportSection('executive_summary', reportData, narratives),
				business_overview: generateReportSection('business_overview', reportData, narratives),
				valuation: generateReportSection('valuation', reportData, narratives),
				bull_bear: generateReportSection('bull_bear', reportData, narratives),
				catalysts_risks: generateReportSection('catalysts_risks', reportData, narratives),
				analyst_commentary: generateReportSection('analyst_commentary', reportData, narratives),
			},
			data: reportData, // Include raw data for reference
		};

		return NextResponse.json(report);
	} catch (error: any) {
		console.error('Report generation error:', error);
		return NextResponse.json(
			{ error: error?.message || 'Failed to generate report' },
			{ status: 500 }
		);
	}
}

