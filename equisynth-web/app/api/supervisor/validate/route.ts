import { NextRequest, NextResponse } from 'next/server';
import { validateAllAgents, AgentOutputs } from '@/app/lib/validation';
import fs from 'fs/promises';
import path from 'path';

/**
 * Supervisor Agent API
 * Validates outputs from all agents and provides quality assessment
 */

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { ticker, form, filed } = body;

		if (!ticker || !form || !filed) {
			return NextResponse.json(
				{ error: 'ticker, form, and filed date are required' },
				{ status: 400 }
			);
		}

		// Gather outputs from all agents
		const outputs: AgentOutputs = {};

		// 1. Check Data Extractor output
		try {
			const dataDir = path.join(process.cwd(), 'data', ticker.toUpperCase(), `${form}_${filed}`);
			const tablesPath = path.join(dataDir, 'tables.json');
			const sectionsPath = path.join(dataDir, 'sections.json');
			const chunksPath = path.join(dataDir, 'chunks.jsonl');

			const hasTables = await fs.access(tablesPath).then(() => true).catch(() => false);
			const hasSections = await fs.access(sectionsPath).then(() => true).catch(() => false);
			const hasChunks = await fs.access(chunksPath).then(() => true).catch(() => false);

			outputs.dataExtractor = {
				hasFiling: hasSections || hasTables || hasChunks,
				hasTables,
				hasSections,
				hasChunks,
				ticker: ticker.toUpperCase(),
				form,
				filed,
			};
		} catch (err) {
			outputs.dataExtractor = {
				hasFiling: false,
				hasTables: false,
				hasSections: false,
				hasChunks: false,
			};
		}

		// 2. Check Financial Understanding output
		try {
			const financialsRes = await fetch(
				`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/data/financials?ticker=${ticker}&form=${form}&filed=${filed}`,
				{ method: 'GET' }
			);

			if (financialsRes.ok) {
				const financialsData = await financialsRes.json();
				const metrics = financialsData.keyMetrics || {};
				const tables = financialsData.tables || [];

				outputs.financialUnderstanding = {
					hasMetrics: Object.keys(metrics).length > 0,
					hasStatements: tables.length > 0,
					metrics: {
						revenue: metrics.revenue,
						netIncome: metrics.netIncome,
						totalAssets: metrics.totalAssets,
						totalEquity: metrics.totalEquity,
						roe: metrics.roe,
						roic: metrics.roic,
						wacc: metrics.wacc,
					},
				};
			}
		} catch (err) {
			// Financial Understanding not run
		}

		// 3. Check Valuation output - First try to get DCF and Sentiment from Report Composer (if report was generated)
		// If Report Composer has run, it already has DCF and sentiment results that we can use
		let valuationFromReport = null;
		let sentimentFromReport = null;
		try {
			const reportCheckRes = await fetch(
				`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/report/generate?ticker=${ticker}&form=${form}&filed=${filed}`,
				{ method: 'GET' }
			);
			
			if (reportCheckRes.ok) {
				const reportData = await reportCheckRes.json();
				// Report Composer includes valuation data in reportData.data.valuation
				const valuation = reportData.data?.valuation || reportData.valuation;
				if (valuation && valuation.dcfFairValue && valuation.dcfFairValue > 0) {
					valuationFromReport = valuation;
					console.log(`✅ Found DCF results from Report Composer: Fair Value = $${valuationFromReport.dcfFairValue.toFixed(2)}`);
				}
				
				// Also get sentiment data from the same report
				const sentiment = reportData.data?.sentiment || reportData.sentiment;
				if (sentiment && (sentiment.sentimentScore !== undefined || sentiment.confidence !== undefined || sentiment.keyQuotes)) {
					sentimentFromReport = sentiment;
					console.log(`✅ Found sentiment results from Report Composer`);
				}
			}
		} catch (err) {
			// Report not generated yet, continue to calculate independently
		}
		
		// If we got DCF from Report Composer, use it. Otherwise, try to calculate it ourselves
		if (valuationFromReport && valuationFromReport.dcfFairValue > 0) {
			// Use DCF results from Report Composer (these are already validated and correct)
			outputs.valuation = {
				hasDCF: true,
				dcfFairValue: valuationFromReport.dcfFairValue,
				currentPrice: valuationFromReport.currentPrice || undefined,
				upside: valuationFromReport.upside,
				wacc: valuationFromReport.wacc ? (typeof valuationFromReport.wacc === 'number' ? valuationFromReport.wacc : parseFloat(valuationFromReport.wacc)) : undefined,
				revenueGrowthRate: valuationFromReport.revenueGrowthRate,
				canRun: true,
			};
			console.log(`✅ Using DCF results from Report Composer: Fair Value = $${valuationFromReport.dcfFairValue.toFixed(2)}`);
		} else {
			// Report Composer hasn't generated DCF yet, so try to calculate it ourselves for validation
			try {
				const hasFinancials = outputs.financialUnderstanding?.hasMetrics;
				if (hasFinancials) {
					// Get estimates and financial data to construct DCF inputs
					try {
						const estimatesRes = await fetch(
							`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/valuation/estimates?ticker=${ticker}`,
							{ method: 'GET' }
						);
						
						if (estimatesRes.ok) {
						const estimatesData = await estimatesRes.json();
						const metrics = outputs.financialUnderstanding?.metrics || {};
						
						// Try to get current price - fallback to Finnhub if AlphaVantage doesn't have it
						let currentPrice = estimatesData.currentPrice;
						let sharesOutstanding = estimatesData.sharesOutstanding;
						
						// IMPORTANT: The estimates API already converts shares outstanding to millions!
						// (see estimates/route.ts line 103: sharesOutstanding / 1e6)
						// So sharesOutstanding is already in millions (typically 1K-50K for most companies)
						console.log(`🔍 Supervisor - Shares outstanding from estimates API: ${sharesOutstanding} (already in millions)`);
						
						if (!currentPrice || currentPrice <= 0) {
							// Fallback to Finnhub API for current price
							try {
								const finnhubKey = process.env.FINNHUB_API_KEY;
								if (finnhubKey) {
									const quoteRes = await fetch(
										`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${finnhubKey}`,
										{ method: 'GET' }
									);
									if (quoteRes.ok) {
										const quoteData = await quoteRes.json();
										if (quoteData.c && quoteData.c > 0) {
											currentPrice = quoteData.c;
											console.log(`✅ Got current price from Finnhub: $${currentPrice}`);
										}
									}
									
									// Also try to get shares outstanding from Finnhub company profile
									// NOTE: Only use this if estimates API didn't provide it
									// The estimates API already returns it in millions, so don't overwrite if it exists
									if (!sharesOutstanding || sharesOutstanding <= 0 || sharesOutstanding < 1) {
										const profileRes = await fetch(
											`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${finnhubKey}`,
											{ method: 'GET' }
										);
										if (profileRes.ok) {
											const profileData = await profileRes.json();
											if (profileData.shareOutstanding && profileData.shareOutstanding > 0) {
												// Finnhub returns shares outstanding in actual shares, convert to millions
												const finnhubShares = profileData.shareOutstanding / 1e6;
												if (finnhubShares > 1 && finnhubShares < 100000) {
													sharesOutstanding = finnhubShares;
													console.log(`✅ Got shares outstanding from Finnhub: ${sharesOutstanding}M (converted from ${profileData.shareOutstanding} actual shares)`);
												}
											}
										}
									}
								}
							} catch (finnhubErr) {
								console.warn('Finnhub fallback failed:', finnhubErr);
							}
						}
						
						// Check if we have enough data to run DCF
						const hasRequiredData = 
							metrics.revenue && 
							metrics.revenue > 0 &&
							metrics.netIncome !== undefined &&
							currentPrice &&
							currentPrice > 0 &&
							sharesOutstanding &&
							sharesOutstanding > 0;
						
						if (hasRequiredData) {
							// Try to actually calculate DCF
							try {
								// Check if we have FCF or can estimate it
								// Try to get FCF from financials API response
								const financialsRes2 = await fetch(
									`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/data/financials?ticker=${ticker}&form=${form}&filed=${filed}`,
									{ method: 'GET' }
								);
								
								let freeCashFlow = 0;
								if (financialsRes2.ok) {
									const financialsData2 = await financialsRes2.json();
									const metrics2 = financialsData2.keyMetrics || {};
									freeCashFlow = metrics2.freeCashFlow || 
										metrics2.operatingCashFlow || 
										(metrics2.netIncome ? Number(metrics2.netIncome) * 0.8 : 0);
								}
								
								if (freeCashFlow > 0) {
									// Actually try to run DCF to see if it works
									try {
										const wacc = metrics.wacc ? (metrics.wacc / 100) : 0.10; // Convert % to decimal
										const revenue = metrics.revenue || 0;
										const operatingIncome = metrics.operatingIncome || (revenue * 0.25); // Estimate if missing
										const netIncome = metrics.netIncome || (operatingIncome * 0.8);
										const totalDebt = metrics.totalDebt || 0;
										const cash = metrics.cash || 0;
										
										// IMPORTANT: sharesOutstanding from estimates API is ALREADY in millions!
										// The estimates API converts it (see estimates/route.ts line 103: sharesOutstanding / 1e6)
										// Typical range: 1K-50K million shares for most companies (Apple has ~15K million)
										let adjustedSharesOutstanding = sharesOutstanding;
										console.log(`🔍 Supervisor DCF Check - Shares Outstanding from estimates API: ${sharesOutstanding}`);
										
										// Validation: Check if the value makes sense
										// Most companies have 1K-50K million shares outstanding
										// If < 1, it's definitely wrong (might be in billions or wrong conversion)
										// If > 100K, might still be in actual shares
										if (sharesOutstanding < 1) {
											// Less than 1 million shares is suspicious
											console.error(`❌ Shares outstanding is suspiciously low: ${sharesOutstanding}. This is likely wrong.`);
											console.error(`   The estimates API should return values in millions (typically 1K-50K).`);
											console.error(`   This might indicate a double conversion or incorrect API response.`);
											// Try to reverse if it looks like it was divided by 1e6 twice
											// If original was 14,840.39M and got divided again, it becomes 0.01484039
											// Multiplying by 1e6 gives back 14,840.39
											if (sharesOutstanding > 0.001 && sharesOutstanding < 0.1) {
												const corrected = sharesOutstanding * 1e6;
												if (corrected > 1 && corrected < 100000) {
													console.log(`🔧 Attempting correction: ${sharesOutstanding} → ${corrected}M (might have been double-converted)`);
													adjustedSharesOutstanding = corrected;
												} else {
													adjustedSharesOutstanding = sharesOutstanding; // Keep original if correction doesn't help
												}
											}
										} else if (sharesOutstanding > 100000) {
											// > 100K million shares is unusually high - might still be in actual shares
											console.warn(`⚠️ Shares outstanding seems unusually large for millions (${sharesOutstanding}). Might be in actual shares. Converting...`);
											adjustedSharesOutstanding = sharesOutstanding / 1e6;
											console.log(`✅ Converted to millions: ${adjustedSharesOutstanding}M`);
										} else {
											// Value is in reasonable range (1-100K) - assume it's already in millions
											console.log(`✅ Shares outstanding looks correct: ${adjustedSharesOutstanding}M (already in millions)`);
										}
										
										console.log(`📊 Final shares outstanding for DCF: ${adjustedSharesOutstanding}M`);
										
										// Try to call DCF API
										const dcfRes = await fetch(
											`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/valuation/dcf`,
											{
												method: 'POST',
												headers: { 'Content-Type': 'application/json' },
												body: JSON.stringify({
													inputs: {
														revenue,
														operatingIncome,
														netIncome,
														freeCashFlow,
														totalDebt,
														cash,
														sharesOutstanding: adjustedSharesOutstanding,
														wacc,
														revenueGrowthRate: 0.085,
														operatingMargin: revenue > 0 ? operatingIncome / revenue : 0.25,
														taxRate: 0.21,
														terminalGrowthRate: 0.03,
														capexAsPercentOfRevenue: 0.03,
														workingCapitalChangeAsPercentOfRevenue: 0.005,
													},
													currentPrice: currentPrice,
												}),
											}
										);
										
										if (dcfRes.ok) {
											const dcfData = await dcfRes.json();
											const result = dcfData.result;
											
											console.log(`📈 Supervisor DCF Result:`, {
												fairValuePerShare: result?.fairValuePerShare,
												equityValue: result?.equityValue,
												sharesOutstanding: adjustedSharesOutstanding,
												currentPrice,
											});
											
											if (result && result.fairValuePerShare && result.fairValuePerShare > 0) {
												// Sanity check: fair value should be reasonable
												// Most stocks are between $0.01 and $10,000 per share
												// If it's way off, the shares outstanding conversion is probably wrong
												const isReasonable = result.fairValuePerShare > 0.01 && result.fairValuePerShare < 10000;
												
												if (!isReasonable) {
													console.error(`❌ DCF fair value seems unrealistic: $${result.fairValuePerShare.toFixed(2)}.`);
													console.error(`   Equity Value: ${result.equityValue?.toLocaleString() || 'N/A'}, Shares: ${adjustedSharesOutstanding}M`);
													console.error(`   This suggests shares outstanding might be wrong. Expected range: 1K-50K million shares.`);
													
													// Try one more time with shares outstanding divided by 1e6 if it wasn't already
													if (adjustedSharesOutstanding < 50000 && sharesOutstanding > 1000) {
														console.log(`🔄 Retrying with shares outstanding converted: ${sharesOutstanding} → ${sharesOutstanding / 1e6}M`);
														// Don't retry here - just mark as invalid
													}
													
													// Mark as not calculated due to invalid result
													outputs.valuation = {
														hasDCF: false,
														currentPrice: currentPrice || undefined,
														canRun: true,
													};
												} else {
													// DCF can be calculated successfully
													// Store revenueGrowthRate as decimal (0.085) for consistency with validation
													outputs.valuation = {
														hasDCF: true, // DCF was successfully calculated
														dcfFairValue: result.fairValuePerShare,
														currentPrice: currentPrice,
														upside: result.upside,
														wacc: wacc * 100, // Convert back to % for display
														revenueGrowthRate: 0.085, // Store as decimal (0.085 = 8.5%)
														canRun: true,
													};
												}
											} else {
												// DCF calculation returned invalid result
												outputs.valuation = {
													hasDCF: false,
													currentPrice: currentPrice || undefined,
													canRun: true,
												};
											}
										} else {
											// DCF API call failed - log the error for debugging
											const errorText = await dcfRes.text().catch(() => 'Unknown error');
											console.warn('DCF API call failed:', dcfRes.status, errorText);
											outputs.valuation = {
												hasDCF: false,
												currentPrice: currentPrice || undefined,
												canRun: true, // Can attempt to run
											};
										}
									} catch (dcfErr: any) {
										// DCF calculation error
										console.warn('DCF calculation error in Supervisor:', dcfErr?.message || dcfErr);
										outputs.valuation = {
											hasDCF: false,
											currentPrice: currentPrice || undefined,
											canRun: true,
										};
									}
								} else {
									// Missing FCF
									console.warn('Missing FCF for DCF calculation:', { 
										freeCashFlow, 
										metrics,
										currentPrice,
										sharesOutstanding,
									});
									outputs.valuation = {
										hasDCF: false,
										currentPrice: currentPrice || undefined,
										canRun: false, // Missing required data (FCF)
									};
								}
							} catch (err: any) {
								console.warn('Error in DCF validation check:', err?.message || err);
								outputs.valuation = {
									hasDCF: false,
									currentPrice: currentPrice || undefined,
									canRun: hasRequiredData, // Can run if we have required data
								};
							}
						} else {
							// Missing required data
							console.warn('Missing required data for DCF:', {
								hasRevenue: !!metrics.revenue && metrics.revenue > 0,
								hasNetIncome: metrics.netIncome !== undefined,
								hasCurrentPrice: !!currentPrice && currentPrice > 0,
								hasSharesOutstanding: !!sharesOutstanding && sharesOutstanding > 0,
								revenue: metrics.revenue,
								netIncome: metrics.netIncome,
								currentPrice,
								sharesOutstanding,
							});
							outputs.valuation = {
								hasDCF: false,
								currentPrice: currentPrice || undefined,
								canRun: false, // Missing required data
							};
						}
					}
				} catch (err) {
					// Valuation estimates not available
				}
			}
		} catch (err) {
			// Valuation check failed - Report Composer didn't have it, and we couldn't calculate it
			console.warn('Could not get DCF from Report Composer or calculate it independently');
		}
		} // End of else block (if Report Composer doesn't have DCF)

		// 4. Check Sentiment output
		// If we got sentiment from Report Composer (from step 3), use it. Otherwise, check if chunks exist
		if (sentimentFromReport) {
			// Use sentiment results from Report Composer
			outputs.sentiment = {
				hasAnalysis: true,
				sentimentScore: sentimentFromReport.sentimentScore,
				confidence: sentimentFromReport.confidence,
				hasQuotes: !!(sentimentFromReport.keyQuotes && sentimentFromReport.keyQuotes.length > 0),
			};
			console.log(`✅ Using sentiment results from Report Composer`);
		} else {
			// Report Composer hasn't generated sentiment yet, so check if we can analyze it
			try {
				const mdaChunksPath = path.join(process.cwd(), 'data', ticker.toUpperCase(), `${form}_${filed}`, 'chunks.jsonl');
				const chunksData = await fs.readFile(mdaChunksPath, 'utf-8').catch(() => '');
				
				if (chunksData) {
					// Try to analyze sentiment from MD&A
					const chunks = chunksData.split('\n').filter(l => l.trim()).slice(0, 5);
					if (chunks.length > 0) {
						// Chunks exist, but sentiment analysis hasn't been run
						outputs.sentiment = {
							hasAnalysis: false, // Would need to actually run sentiment analysis
							hasQuotes: false,
						};
					}
				}
			} catch (err) {
				// Sentiment not run
			}
		}

		// 5. Check Report Composer output
		// Try to actually generate a report to see if it works
		try {
			// Check if we have required data for report generation
			const hasDataForReport = 
				outputs.dataExtractor?.hasFiling &&
				outputs.financialUnderstanding?.hasMetrics;
			
			if (hasDataForReport) {
				// Try to generate report
				try {
					const reportRes = await fetch(
						`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/report/generate?ticker=${ticker}&form=${form}&filed=${filed}`,
						{ method: 'GET' }
					);
					
					if (reportRes.ok) {
						const reportData = await reportRes.json();
						outputs.reportComposer = {
							hasReport: true, // Report was successfully generated
							hasSections: reportData.sections && Object.keys(reportData.sections).length > 0,
							sections: reportData.sections ? Object.keys(reportData.sections) : [],
						};
					} else {
						// Report generation failed, but we can check why
						const errorData = await reportRes.json().catch(() => ({}));
						outputs.reportComposer = {
							hasReport: false,
							hasSections: false,
							canRun: true, // Can attempt to run, but failed
							error: errorData.error || 'Report generation failed',
						};
					}
				} catch (err) {
					// Report endpoint error
					outputs.reportComposer = {
						hasReport: false,
						hasSections: false,
						canRun: hasDataForReport, // Can run if we have data
					};
				}
			} else {
				// Missing required data
				outputs.reportComposer = {
					hasReport: false,
					hasSections: false,
					canRun: false, // Missing required data
				};
			}
		} catch (err) {
			// Report check failed
			outputs.reportComposer = {
				hasReport: false,
				hasSections: false,
			};
		}

		// Validate all agent outputs
		const validation = validateAllAgents(outputs);

		return NextResponse.json({
			validatedAt: new Date().toISOString(),
			ticker: ticker.toUpperCase(),
			form,
			filed,
			overall: validation.overall,
			agents: validation.results,
			outputs, // Include gathered outputs for reference
		});
	} catch (error: any) {
		console.error('Supervisor validation error:', error);
		return NextResponse.json(
			{ error: error?.message || 'Failed to validate agents' },
			{ status: 500 }
		);
	}
}

/**
 * GET endpoint to validate with query params
 */
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

		// Reuse POST logic
		const response = await POST(
			new Request(req.url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ticker, form, filed }),
			})
		);

		return response;
	} catch (error: any) {
		console.error('Supervisor validation error:', error);
		return NextResponse.json(
			{ error: error?.message || 'Failed to validate agents' },
			{ status: 500 }
		);
	}
}

