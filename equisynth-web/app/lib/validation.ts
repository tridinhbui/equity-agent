/**
 * Supervisor Agent - Validation Rules
 * Rule-based quality checks for all agent outputs
 */

export interface ValidationResult {
	agent: string;
	passed: boolean;
	score: number; // 0-100
	issues: ValidationIssue[];
	warnings: string[];
}

export interface ValidationIssue {
	severity: 'error' | 'warning' | 'info';
	category: string;
	message: string;
	suggestion?: string;
}

export interface AgentOutputs {
	dataExtractor?: {
		hasFiling: boolean;
		hasTables: boolean;
		hasSections: boolean;
		hasChunks: boolean;
		ticker?: string;
		form?: string;
		filed?: string;
	};
	financialUnderstanding?: {
		hasMetrics: boolean;
		hasStatements: boolean;
		metrics?: {
			revenue?: number;
			netIncome?: number;
			totalAssets?: number;
			totalEquity?: number;
			roe?: number;
			roic?: number;
			wacc?: number;
		};
	};
	valuation?: {
		hasDCF: boolean;
		dcfFairValue?: number;
		currentPrice?: number;
		upside?: number;
		wacc?: number;
		revenueGrowthRate?: number;
		canRun?: boolean; // Whether DCF can be calculated with available data
	};
	sentiment?: {
		hasAnalysis: boolean;
		sentimentScore?: number;
		confidence?: number;
		hasQuotes: boolean;
	};
	reportComposer?: {
		hasReport: boolean;
		hasSections: boolean;
		sections?: string[];
		canRun?: boolean; // Whether report can be generated with available data
		error?: string; // Error message if report generation failed
	};
}

/**
 * Validate Data Extractor Agent output
 */
export function validateDataExtractor(output: AgentOutputs['dataExtractor']): ValidationResult {
	const issues: ValidationIssue[] = [];
	const warnings: string[] = [];
	let score = 100;

	if (!output) {
		return {
			agent: 'Data Extractor',
			passed: false,
			score: 0,
			issues: [{
				severity: 'error',
				category: 'Missing Output',
				message: 'Data Extractor has not been run',
				suggestion: 'Run Data Extractor Agent first',
			}],
			warnings: [],
		};
	}

	// Check required components
	if (!output.hasFiling) {
		issues.push({
			severity: 'error',
			category: 'Missing Filing',
			message: 'No SEC filing was fetched',
			suggestion: 'Fetch SEC filing using ticker, form, and filed date',
		});
		score -= 30;
	}

	if (!output.hasTables) {
		issues.push({
			severity: 'warning',
			category: 'Missing Tables',
			message: 'No financial tables were extracted',
			suggestion: 'Tables may be in PDF format or require manual parsing',
		});
		score -= 10;
		warnings.push('Financial tables not found');
	}

	if (!output.hasSections) {
		issues.push({
			severity: 'error',
			category: 'Missing Sections',
			message: 'Document sections were not identified',
			suggestion: 'Run sectioning process to identify MD&A, Risk Factors, etc.',
		});
		score -= 20;
	}

	if (!output.hasChunks) {
		issues.push({
			severity: 'warning',
			category: 'Missing Chunks',
			message: 'Text chunks were not created for RAG',
			suggestion: 'Run chunking process for semantic search',
		});
		score -= 10;
		warnings.push('RAG chunks not available');
	}

	// Validate ticker/form/filed
	if (!output.ticker || !output.form || !output.filed) {
		issues.push({
			severity: 'warning',
			category: 'Missing Metadata',
			message: 'Ticker, form, or filed date not specified',
			suggestion: 'Ensure all metadata is properly set',
		});
		score -= 5;
	}

	return {
		agent: 'Data Extractor',
		passed: score >= 70,
		score: Math.max(0, score),
		issues,
		warnings,
	};
}

/**
 * Validate Financial Understanding Agent output
 */
export function validateFinancialUnderstanding(output: AgentOutputs['financialUnderstanding']): ValidationResult {
	const issues: ValidationIssue[] = [];
	const warnings: string[] = [];
	let score = 100;

	if (!output) {
		return {
			agent: 'Financial Understanding',
			passed: false,
			score: 0,
			issues: [{
				severity: 'error',
				category: 'Missing Output',
				message: 'Financial Understanding Agent has not been run',
				suggestion: 'Run Financial Understanding Agent to extract metrics',
			}],
			warnings: [],
		};
	}

	if (!output.hasMetrics) {
		issues.push({
			severity: 'error',
			category: 'Missing Metrics',
			message: 'No financial metrics were extracted',
			suggestion: 'Ensure financial tables are properly parsed',
		});
		score -= 40;
		return { agent: 'Financial Understanding', passed: false, score, issues, warnings };
	}

	if (!output.hasStatements) {
		issues.push({
			severity: 'warning',
			category: 'Missing Statements',
			message: 'Financial statements (Income, Balance, Cash Flow) not found',
			suggestion: 'Check if tables were correctly parsed',
		});
		score -= 20;
		warnings.push('Financial statements may be incomplete');
	}

	const metrics = output.metrics || {};

	// Validate key metrics exist and are reasonable
	if (!metrics.revenue || metrics.revenue <= 0) {
		issues.push({
			severity: 'error',
			category: 'Invalid Revenue',
			message: 'Revenue is missing or invalid',
			suggestion: 'Check Income Statement parsing',
		});
		score -= 15;
	}

	if (!metrics.netIncome) {
		issues.push({
			severity: 'warning',
			category: 'Missing Net Income',
			message: 'Net income not found',
			suggestion: 'Check Income Statement parsing',
		});
		score -= 10;
	}

	// Validate calculated ratios
	if (metrics.roe !== undefined) {
		if (Math.abs(metrics.roe) > 1000) {
			issues.push({
				severity: 'error',
				category: 'Invalid ROE',
				message: `ROE seems unrealistic: ${metrics.roe.toFixed(2)}%`,
				suggestion: 'Check total equity calculation - may be misidentified',
			});
			score -= 10;
		}
		if (metrics.roe < -100 || metrics.roe > 500) {
			warnings.push(`ROE is ${metrics.roe.toFixed(2)}% - unusual but possible`);
			score -= 5;
		}
	}

	if (metrics.wacc !== undefined && metrics.wacc !== null) {
		if (metrics.wacc > 25) {
			issues.push({
				severity: 'error',
				category: 'Invalid WACC',
				message: `WACC from Financial Understanding Agent seems unrealistic: ${metrics.wacc.toFixed(2)}%`,
				suggestion: 'Financial Understanding WACC is a rough estimate. Use Valuation Agent for accurate WACC calculation based on market data and proper modeling.',
			});
			score -= 10;
		}
		if (metrics.wacc > 20) {
			issues.push({
				severity: 'warning',
				category: 'High WACC Estimate',
				message: `WACC from Financial Understanding is ${metrics.wacc.toFixed(2)}% - this is a rough estimate only`,
				suggestion: 'Valuation Agent provides more accurate WACC using market cap, beta, and risk premiums. Financial Understanding WACC may be unreliable.',
			});
			score -= 5;
		}
		if (metrics.wacc < 3 || (metrics.wacc > 15 && metrics.wacc <= 20)) {
			warnings.push(`WACC is ${metrics.wacc.toFixed(2)}% - Financial Understanding provides rough estimates only. Use Valuation Agent for accurate WACC.`);
			score -= 3;
		}
	}

	// Check consistency: ROIC should generally be between ROE and WACC
	if (metrics.roic !== undefined && metrics.roe !== undefined && metrics.wacc !== undefined) {
		if (metrics.roic < metrics.wacc && metrics.roe > metrics.wacc + 10) {
			issues.push({
				severity: 'warning',
				category: 'Inconsistent Metrics',
				message: 'ROIC below WACC but ROE much higher - may indicate calculation error',
				suggestion: 'Verify equity and invested capital calculations',
			});
			score -= 5;
		}
	}

	return {
		agent: 'Financial Understanding',
		passed: score >= 70,
		score: Math.max(0, score),
		issues,
		warnings,
	};
}

/**
 * Validate Valuation Agent output
 */
export function validateValuation(output: AgentOutputs['valuation']): ValidationResult {
	const issues: ValidationIssue[] = [];
	const warnings: string[] = [];
	let score = 100;

	if (!output) {
		return {
			agent: 'Valuation',
			passed: true, // Optional agent - don't fail validation
			score: 0,
			issues: [{
				severity: 'info',
				category: 'Valuation Not Run',
				message: 'Valuation Agent has not been run yet. This is optional - run it if you need DCF valuation.',
				suggestion: 'Go to Valuation Agent page and click "Run Valuation" to calculate DCF',
			}],
			warnings: [],
		};
	}

	if (!output.hasDCF) {
		if (output.canRun === true) {
			// Can run but hasn't been run yet
			issues.push({
				severity: 'info',
				category: 'DCF Not Calculated',
				message: 'DCF valuation can be calculated but has not been run yet.',
				suggestion: 'Go to Valuation Agent page and click "Run Valuation" to calculate DCF',
			});
			score -= 20; // Less penalty if it CAN be run
		} else if (output.canRun === false) {
			// Cannot run - missing data
			issues.push({
				severity: 'warning',
				category: 'Missing DCF Inputs',
				message: 'DCF cannot be calculated - missing required inputs (revenue, FCF, current price, etc.)',
				suggestion: 'Ensure Financial Understanding Agent and market data are available',
			});
			score -= 30;
		} else {
			// Unknown if can run
			issues.push({
				severity: 'info',
				category: 'DCF Not Calculated',
				message: 'DCF valuation has not been run yet. This is expected if you have not used the Valuation Agent.',
				suggestion: 'Go to Valuation Agent page, enter ticker/form/filed date, and click "Run Valuation" to calculate DCF',
			});
			score -= 30;
		}
		// Continue validation to check other aspects
	}

	// Validate DCF inputs and outputs (only if DCF was calculated)
	if (output.hasDCF) {
		if (output.dcfFairValue === undefined || output.dcfFairValue <= 0) {
			issues.push({
				severity: 'error',
				category: 'Invalid Fair Value',
				message: 'DCF fair value is missing or invalid',
				suggestion: 'Check DCF calculation inputs',
			});
			score -= 30;
		}
	}

	if (output.currentPrice === undefined || output.currentPrice <= 0) {
		issues.push({
			severity: 'error',
			category: 'Missing Current Price',
			message: 'Current market price not available',
			suggestion: 'Fetch current price from market data API',
		});
		score -= 20;
	}

	// Check if fair value is reasonable compared to current price
	if (output.dcfFairValue && output.currentPrice) {
		const ratio = output.dcfFairValue / output.currentPrice;
		if (ratio < 0.1 || ratio > 10) {
			issues.push({
				severity: 'warning',
				category: 'Unusual Valuation',
				message: `Fair value (${output.dcfFairValue.toFixed(2)}) is ${ratio.toFixed(1)}x current price (${output.currentPrice.toFixed(2)})`,
				suggestion: 'Review DCF assumptions - may be too aggressive or conservative',
			});
			score -= 15;
			warnings.push('Valuation differs significantly from market price');
		}
	}

	// Validate WACC is reasonable
	if (output.wacc !== undefined) {
		if (output.wacc < 3 || output.wacc > 25) {
			warnings.push(`WACC of ${output.wacc.toFixed(2)}% is outside typical range (5-15%)`);
			score -= 5;
		}
	}

	// Validate growth rate is reasonable
	// Note: revenueGrowthRate can be stored as either decimal (0.085) or percentage (8.5)
	// Check if it's already a percentage (>= 1) or a decimal (< 1)
	if (output.revenueGrowthRate !== undefined) {
		const isPercentage = Math.abs(output.revenueGrowthRate) >= 1;
		const decimalRate = isPercentage ? output.revenueGrowthRate / 100 : output.revenueGrowthRate;
		
		if (decimalRate < -0.2 || decimalRate > 0.5) {
			const displayRate = isPercentage ? output.revenueGrowthRate : (output.revenueGrowthRate * 100);
			warnings.push(`Revenue growth rate of ${displayRate.toFixed(1)}% seems extreme`);
			score -= 5;
		}
	}

	// Valuation is optional - lower threshold since DCF requires manual input
	return {
		agent: 'Valuation',
		passed: score >= 40 || output.hasDCF, // Lower threshold, or pass if DCF exists
		score: Math.max(0, score),
		issues,
		warnings,
	};
}

/**
 * Validate Sentiment & Tone Agent output
 */
export function validateSentiment(output: AgentOutputs['sentiment']): ValidationResult {
	const issues: ValidationIssue[] = [];
	const warnings: string[] = [];
	let score = 100;

	if (!output) {
		return {
			agent: 'Sentiment & Tone',
			passed: false,
			score: 0,
			issues: [{
				severity: 'info',
				category: 'Missing Output',
				message: 'Sentiment & Tone Agent has not been run',
				suggestion: 'Optional - run for enhanced report quality',
			}],
			warnings: [],
		};
	}

	if (!output.hasAnalysis) {
		issues.push({
			severity: 'warning',
			category: 'Missing Analysis',
			message: 'Sentiment analysis not performed',
			suggestion: 'Run sentiment analysis on MD&A or earnings transcripts',
		});
		score -= 30;
		return { agent: 'Sentiment & Tone', passed: true, score, issues, warnings }; // Optional agent
	}

	// Validate sentiment score is in range
	if (output.sentimentScore !== undefined) {
		if (output.sentimentScore < 0 || output.sentimentScore > 100) {
			issues.push({
				severity: 'error',
				category: 'Invalid Sentiment Score',
				message: `Sentiment score ${output.sentimentScore} is out of range (0-100)`,
				suggestion: 'Check sentiment calculation logic',
			});
			score -= 20;
		}
	}

	// Validate confidence score is in range
	if (output.confidence !== undefined) {
		if (output.confidence < 0 || output.confidence > 10) {
			issues.push({
				severity: 'error',
				category: 'Invalid Confidence Score',
				message: `Confidence score ${output.confidence} is out of range (0-10)`,
				suggestion: 'Check confidence calculation logic',
			});
			score -= 20;
		}
	}

	if (!output.hasQuotes && output.hasAnalysis) {
		warnings.push('Sentiment analysis completed but no key quotes extracted');
		score -= 10;
	}

	return {
		agent: 'Sentiment & Tone',
		passed: score >= 50, // Lower threshold since it's optional
		score: Math.max(0, score),
		issues,
		warnings,
	};
}

/**
 * Validate Report Composer Agent output
 */
export function validateReportComposer(output: AgentOutputs['reportComposer']): ValidationResult {
	const issues: ValidationIssue[] = [];
	const warnings: string[] = [];
	let score = 100;

	if (!output) {
		return {
			agent: 'Report Composer',
			passed: false,
			score: 0,
			issues: [{
				severity: 'error',
				category: 'Missing Output',
				message: 'Report Composer has not been run',
				suggestion: 'Run Report Composer to generate final report',
			}],
			warnings: [],
		};
	}

	if (!output.hasReport) {
		if (output.canRun === true) {
			// Can generate but hasn't been generated yet
			issues.push({
				severity: 'info',
				category: 'Report Not Generated',
				message: 'Report can be generated but has not been generated yet.',
				suggestion: output.error ? `Report generation failed: ${output.error}. Check required agents are run.` : 'Go to Report Composer page and click "Generate Report"',
			});
			score -= 20; // Less penalty if it CAN be generated
		} else if (output.canRun === false) {
			// Cannot generate - missing data
			issues.push({
				severity: 'warning',
				category: 'Missing Report Inputs',
				message: 'Report cannot be generated - missing required data',
				suggestion: 'Ensure Data Extractor and Financial Understanding agents have been run',
			});
			score -= 30;
		} else {
			// Unknown
			issues.push({
				severity: 'warning',
				category: 'Report Not Generated',
				message: 'Report was not generated',
				suggestion: 'Go to Report Composer page and click "Generate Report"',
			});
			score -= 30;
		}
		// Don't return early - continue validation
	}

	if (!output.hasSections) {
		issues.push({
			severity: 'error',
			category: 'Missing Sections',
			message: 'Report sections were not generated',
			suggestion: 'Check report generation logic',
		});
		score -= 30;
	}

	// Check for required sections
	const requiredSections = ['executive_summary', 'business_overview', 'valuation', 'catalysts_risks'];
	const missingSections = requiredSections.filter(
		section => !output.sections || !output.sections.includes(section)
	);

	if (missingSections.length > 0) {
		issues.push({
			severity: 'warning',
			category: 'Incomplete Report',
			message: `Missing required sections: ${missingSections.join(', ')}`,
			suggestion: 'Ensure all agent outputs are available',
		});
		score -= missingSections.length * 10;
		warnings.push(`Report missing ${missingSections.length} section(s)`);
	}

	return {
		agent: 'Report Composer',
		passed: score >= 70,
		score: Math.max(0, score),
		issues,
		warnings,
	};
}

/**
 * Validate all agent outputs
 */
export function validateAllAgents(outputs: AgentOutputs): {
	overall: {
		passed: boolean;
		score: number;
		agentsPassed: number;
		totalAgents: number;
	};
	results: ValidationResult[];
} {
	const results: ValidationResult[] = [
		validateDataExtractor(outputs.dataExtractor),
		validateFinancialUnderstanding(outputs.financialUnderstanding),
		validateValuation(outputs.valuation),
		validateSentiment(outputs.sentiment),
		validateReportComposer(outputs.reportComposer),
	];

	const agentsPassed = results.filter(r => r.passed).length;
	const totalAgents = results.length;
	const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalAgents;

	return {
		overall: {
			passed: avgScore >= 70 && agentsPassed >= 3, // At least 3/5 agents must pass
			score: avgScore,
			agentsPassed,
			totalAgents,
		},
		results,
	};
}

