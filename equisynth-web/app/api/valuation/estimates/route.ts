import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to fetch analyst estimates and company overview from AlphaVantage
 * Used for DCF model inputs (revenue growth, shares outstanding, etc.)
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const ticker = searchParams.get('ticker');
		
		if (!ticker) {
			return NextResponse.json(
				{ error: 'Ticker symbol is required' },
				{ status: 400 }
			);
		}
		
		const apiKey = process.env.ALPHAVANTAGE_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: 'AlphaVantage API key not configured' },
				{ status: 500 }
			);
		}
		
		// Fetch company overview (includes shares outstanding, fiscal year end, etc.)
		const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`;
		const overviewResponse = await fetch(overviewUrl);
		const overviewData = await overviewResponse.json();
		
		if (overviewData.Note || overviewData['Error Message']) {
			return NextResponse.json(
				{ 
					error: 'AlphaVantage API limit reached or invalid ticker',
					message: overviewData.Note || overviewData['Error Message']
				},
				{ status: 429 }
			);
		}
		
		// Extract key metrics
		const sharesOutstanding = parseFloat(overviewData.SharesOutstanding || '0');
		const marketCap = parseFloat(overviewData.MarketCapitalization || '0');
		const currentPrice = marketCap && sharesOutstanding ? marketCap / sharesOutstanding : null;
		
		// Parse analyst targets (if available)
		const analystTargetPrice = parseFloat(overviewData.AnalystTargetPrice || '0');
		const analystRating = overviewData.AnalystRatingStrongBuy || overviewData.AnalystRatingBuy || null;
		
		// Parse growth metrics
		const revenuePerShareTTM = parseFloat(overviewData.RevenuePerShareTTM || '0');
		const quarterlyRevenueGrowthYOY = parseFloat(overviewData.QuarterlyRevenueGrowthYOY || '0');
		
		// Parse valuation metrics
		const peRatio = parseFloat(overviewData.PERatio || '0');
		const pegRatio = parseFloat(overviewData.PEGRatio || '0');
		const bookValue = parseFloat(overviewData.BookValue || '0');
		const dividendPerShare = parseFloat(overviewData.DividendPerShare || '0');
		const dividendYield = parseFloat(overviewData.DividendYield || '0');
		
		// Parse profitability metrics
		const profitMargin = parseFloat(overviewData.ProfitMargin || '0');
		const operatingMarginTTM = parseFloat(overviewData.OperatingMarginTTM || '0');
		const returnOnEquityTTM = parseFloat(overviewData.ReturnOnEquityTTM || '0');
		const returnOnAssetsTTM = parseFloat(overviewData.ReturnOnAssetsTTM || '0');
		
		// Fetch earnings data for growth estimates
		const earningsUrl = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${apiKey}`;
		const earningsResponse = await fetch(earningsUrl);
		const earningsData = await earningsResponse.json();
		
		let historicalRevenue: { fiscalDateEnding: string; reportedRevenue: number }[] = [];
		let estimatedRevenue: { fiscalDateEnding: string; estimatedRevenue: number }[] = [];
		
		if (earningsData.annualEarnings && Array.isArray(earningsData.annualEarnings)) {
			historicalRevenue = earningsData.annualEarnings
				.slice(0, 5) // Last 5 years
				.map((item: any) => ({
					fiscalDateEnding: item.fiscalDateEnding,
					reportedRevenue: parseFloat(item.reportedEPS || '0'),
				}));
		}
		
		// Calculate historical revenue growth rate
		let historicalGrowthRate = 0;
		if (historicalRevenue.length >= 2) {
			const oldest = historicalRevenue[historicalRevenue.length - 1].reportedRevenue;
			const newest = historicalRevenue[0].reportedRevenue;
			const years = historicalRevenue.length - 1;
			
			if (oldest > 0) {
				// CAGR = (Ending Value / Beginning Value)^(1/years) - 1
				historicalGrowthRate = Math.pow(newest / oldest, 1 / years) - 1;
			}
		}
		
		// Use quarterly growth as a proxy if historical CAGR is not available
		const estimatedGrowthRate = historicalGrowthRate || quarterlyRevenueGrowthYOY;
		
		return NextResponse.json({
			ticker: ticker.toUpperCase(),
			sharesOutstanding: sharesOutstanding / 1e6, // Convert to millions
			marketCap: marketCap / 1e6, // Convert to millions
			currentPrice,
			analystTargetPrice,
			analystRating,
			revenuePerShareTTM,
			quarterlyRevenueGrowthYOY,
			estimatedGrowthRate,
			historicalGrowthRate,
			peRatio,
			pegRatio,
			bookValue,
			dividendPerShare,
			dividendYield,
			profitMargin,
			operatingMarginTTM,
			returnOnEquityTTM,
			returnOnAssetsTTM,
			historicalRevenue,
			estimatedRevenue,
			description: overviewData.Description || '',
			sector: overviewData.Sector || '',
			industry: overviewData.Industry || '',
			fiscalYearEnd: overviewData.FiscalYearEnd || '',
		});
		
	} catch (error) {
		console.error('Error fetching estimates:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch analyst estimates' },
			{ status: 500 }
		);
	}
}

