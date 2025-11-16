/**
 * DCF (Discounted Cash Flow) Valuation Model
 * 
 * Calculates intrinsic value using 5-year Free Cash Flow projections
 * and terminal value discounted to present value.
 */

export interface DCFInputs {
	// Current metrics (from Financial Understanding Agent)
	revenue: number;
	operatingIncome: number;
	netIncome: number;
	freeCashFlow: number;
	totalDebt: number;
	cash: number;
	sharesOutstanding: number;
	
	// Cost of capital
	wacc: number;
	
	// Growth assumptions
	revenueGrowthRate: number; // Average annual growth rate for years 1-5
	operatingMargin: number; // Target operating margin
	taxRate: number;
	terminalGrowthRate: number; // Perpetual growth rate
	
	// Working capital & CapEx assumptions
	capexAsPercentOfRevenue: number;
	workingCapitalChangeAsPercentOfRevenue: number;
}

export interface DCFYearProjection {
	year: number;
	revenue: number;
	operatingIncome: number;
	nopat: number;
	capex: number;
	workingCapitalChange: number;
	freeCashFlow: number;
	discountFactor: number;
	presentValue: number;
}

export interface DCFResult {
	// Projections
	projections: DCFYearProjection[];
	
	// Terminal value calculation
	terminalFCF: number;
	terminalValue: number;
	terminalValuePV: number;
	
	// Valuation summary
	sumOfPVFCF: number; // Sum of present value of 5-year FCF
	enterpriseValue: number; // PV of FCF + PV of Terminal Value
	equityValue: number; // EV - Net Debt
	fairValuePerShare: number;
	
	// Inputs used (for transparency)
	inputs: DCFInputs;
	
	// Current price comparison
	currentPrice?: number;
	upside?: number; // Percentage upside/downside
}

/**
 * Calculate DCF valuation
 */
export function calculateDCF(inputs: DCFInputs, currentPrice?: number): DCFResult {
	const projections: DCFYearProjection[] = [];
	
	// Project 5 years of Free Cash Flow
	for (let year = 1; year <= 5; year++) {
		const prevRevenue = year === 1 ? inputs.revenue : projections[year - 2].revenue;
		
		// Revenue projection with growth
		const revenue = prevRevenue * (1 + inputs.revenueGrowthRate);
		
		// Operating Income = Revenue × Operating Margin
		const operatingIncome = revenue * inputs.operatingMargin;
		
		// NOPAT = Operating Income × (1 - Tax Rate)
		const nopat = operatingIncome * (1 - inputs.taxRate);
		
		// CapEx
		const capex = revenue * inputs.capexAsPercentOfRevenue;
		
		// Working Capital Change
		const workingCapitalChange = revenue * inputs.workingCapitalChangeAsPercentOfRevenue;
		
		// Free Cash Flow = NOPAT - CapEx - Change in Working Capital
		const freeCashFlow = nopat - capex - workingCapitalChange;
		
		// Discount Factor = 1 / (1 + WACC)^year
		const discountFactor = 1 / Math.pow(1 + inputs.wacc, year);
		
		// Present Value of this year's FCF
		const presentValue = freeCashFlow * discountFactor;
		
		projections.push({
			year,
			revenue,
			operatingIncome,
			nopat,
			capex,
			workingCapitalChange,
			freeCashFlow,
			discountFactor,
			presentValue,
		});
	}
	
	// Calculate Terminal Value using Gordon Growth Model
	// Terminal FCF = Year 5 FCF × (1 + terminal growth rate)
	const finalProjection = projections[projections.length - 1];
	const terminalFCF = finalProjection.freeCashFlow * (1 + inputs.terminalGrowthRate);
	
	// Terminal Value = Terminal FCF / (WACC - Terminal Growth Rate)
	const terminalValue = terminalFCF / (inputs.wacc - inputs.terminalGrowthRate);
	
	// Present Value of Terminal Value = TV / (1 + WACC)^5
	const terminalValuePV = terminalValue / Math.pow(1 + inputs.wacc, 5);
	
	// Sum of present value of 5-year FCF
	const sumOfPVFCF = projections.reduce((sum, proj) => sum + proj.presentValue, 0);
	
	// Enterprise Value = PV of FCF + PV of Terminal Value
	const enterpriseValue = sumOfPVFCF + terminalValuePV;
	
	// Equity Value = Enterprise Value - Net Debt
	const netDebt = inputs.totalDebt - inputs.cash;
	const equityValue = enterpriseValue - netDebt;
	
	// Fair Value per Share = Equity Value / Shares Outstanding
	// Note: sharesOutstanding is in millions, but equityValue is in base dollars
	// So we need to convert sharesOutstanding to base units (multiply by 1e6)
	const sharesOutstandingBase = inputs.sharesOutstanding * 1_000_000;
	const fairValuePerShare = equityValue / sharesOutstandingBase;
	
	// Calculate upside/downside if current price provided
	let upside: number | undefined;
	if (currentPrice) {
		upside = ((fairValuePerShare - currentPrice) / currentPrice) * 100;
	}
	
	return {
		projections,
		terminalFCF,
		terminalValue,
		terminalValuePV,
		sumOfPVFCF,
		enterpriseValue,
		equityValue,
		fairValuePerShare,
		inputs,
		currentPrice,
		upside,
	};
}

/**
 * Generate default DCF inputs from financial metrics
 */
export function getDefaultDCFInputs(metrics: {
	revenue: number;
	operatingIncome: number;
	netIncome: number;
	freeCashFlow?: number;
	operatingCashFlow?: number;
	capex?: number;
	totalDebt?: number;
	shortTermDebt?: number;
	longTermDebt?: number;
	cash: number;
	wacc: number;
	taxRate?: number;
}): Partial<DCFInputs> {
	// Calculate tax rate if not provided
	const taxRate = metrics.taxRate || 
		(metrics.operatingIncome ? 1 - (metrics.netIncome / metrics.operatingIncome) : 0.21);
	
	// Calculate total debt
	const totalDebt = metrics.totalDebt || 
		((metrics.longTermDebt || 0) + (metrics.shortTermDebt || 0));
	
	// Calculate operating margin
	const operatingMargin = metrics.revenue ? metrics.operatingIncome / metrics.revenue : 0.25;
	
	// Estimate revenue growth (conservative 5% default)
	const revenueGrowthRate = 0.05;
	
	// Estimate CapEx as % of revenue (conservative 5% default)
	const capexAsPercentOfRevenue = metrics.capex && metrics.revenue ? 
		Math.abs(metrics.capex) / metrics.revenue : 0.05;
	
	// Estimate working capital change (small, 1% default)
	const workingCapitalChangeAsPercentOfRevenue = 0.01;
	
	// Terminal growth rate (long-term GDP growth, 2.5% default)
	const terminalGrowthRate = 0.025;
	
	return {
		revenue: metrics.revenue,
		operatingIncome: metrics.operatingIncome,
		netIncome: metrics.netIncome,
		freeCashFlow: metrics.freeCashFlow || metrics.operatingCashFlow || 0,
		totalDebt,
		cash: metrics.cash,
		wacc: metrics.wacc / 100, // Convert from percentage to decimal
		revenueGrowthRate,
		operatingMargin,
		taxRate,
		terminalGrowthRate,
		capexAsPercentOfRevenue,
		workingCapitalChangeAsPercentOfRevenue,
	};
}

/**
 * Create sensitivity table for WACC and Terminal Growth Rate
 */
export function createSensitivityMatrix(
	baseInputs: DCFInputs,
	waccRange: number[], // e.g., [0.07, 0.08, 0.09, 0.10, 0.11]
	terminalGrowthRange: number[] // e.g., [0.015, 0.02, 0.025, 0.03, 0.035]
): { wacc: number; terminalGrowth: number; fairValue: number }[][] {
	const matrix: { wacc: number; terminalGrowth: number; fairValue: number }[][] = [];
	
	for (const wacc of waccRange) {
		const row: { wacc: number; terminalGrowth: number; fairValue: number }[] = [];
		
		for (const terminalGrowth of terminalGrowthRange) {
			const inputs = { ...baseInputs, wacc, terminalGrowthRate: terminalGrowth };
			const result = calculateDCF(inputs);
			
			row.push({
				wacc,
				terminalGrowth,
				fairValue: result.fairValuePerShare,
			});
		}
		
		matrix.push(row);
	}
	
	return matrix;
}

