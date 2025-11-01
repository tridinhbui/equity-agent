import { NextRequest, NextResponse } from 'next/server';
import { calculateDCF, createSensitivityMatrix, DCFInputs } from '@/app/lib/dcfModel';

/**
 * API endpoint to calculate DCF valuation
 * 
 * Accepts either:
 * 1. Full DCF inputs (user-provided assumptions)
 * 2. Ticker symbol (auto-fetch metrics and use defaults)
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		
		// Check if full inputs are provided
		if (body.inputs && typeof body.inputs === 'object') {
			const inputs = body.inputs as DCFInputs;
			const currentPrice = body.currentPrice;
			
			// Validate required fields
			const requiredFields: (keyof DCFInputs)[] = [
				'revenue',
				'operatingIncome',
				'netIncome',
				'freeCashFlow',
				'totalDebt',
				'cash',
				'sharesOutstanding',
				'wacc',
				'revenueGrowthRate',
				'operatingMargin',
				'taxRate',
				'terminalGrowthRate',
				'capexAsPercentOfRevenue',
				'workingCapitalChangeAsPercentOfRevenue',
			];
			
			const missingFields = requiredFields.filter(field => inputs[field] === undefined);
			if (missingFields.length > 0) {
				return NextResponse.json(
					{ error: `Missing required fields: ${missingFields.join(', ')}` },
					{ status: 400 }
				);
			}
			
			// Calculate DCF
			const result = calculateDCF(inputs, currentPrice);
			
			// Generate sensitivity matrix
			const waccRange = [
				inputs.wacc - 0.02,
				inputs.wacc - 0.01,
				inputs.wacc,
				inputs.wacc + 0.01,
				inputs.wacc + 0.02,
			].filter(w => w > 0);
			
			const terminalGrowthRange = [
				0.015,
				0.02,
				inputs.terminalGrowthRate,
				0.03,
				0.035,
			].filter(g => g < inputs.wacc); // Terminal growth must be < WACC
			
			const sensitivityMatrix = createSensitivityMatrix(
				inputs,
				waccRange,
				terminalGrowthRange
			);
			
			return NextResponse.json({
				result,
				sensitivityMatrix,
				waccRange,
				terminalGrowthRange,
			});
		}
		
		return NextResponse.json(
			{ error: 'Invalid request. Please provide DCF inputs.' },
			{ status: 400 }
		);
		
	} catch (error) {
		console.error('Error calculating DCF:', error);
		return NextResponse.json(
			{ error: 'Failed to calculate DCF valuation', details: String(error) },
			{ status: 500 }
		);
	}
}

