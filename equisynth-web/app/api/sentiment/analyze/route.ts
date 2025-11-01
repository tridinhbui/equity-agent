import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentiment, analyzeConfidence, analyzeBatch } from '@/app/lib/sentimentAnalyzer';

/**
 * Sentiment & Tone Agent API
 * Analyzes sentiment, tone, and confidence from financial text (earnings transcripts, news, etc.)
 */

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { text, texts, type } = body;
		
		// Single text analysis
		if (text && typeof text === 'string') {
			const sentiment = analyzeSentiment(text);
			const confidence = analyzeConfidence(text);
			
			return NextResponse.json({
				sentiment: sentiment.sentiment,
				sentimentScore: sentiment.sentimentScore,
				tone: sentiment.tone,
				confidence: confidence.overall,
				confidenceDetails: {
					certainty: confidence.certainty,
					specificity: confidence.specificity,
					toneScore: confidence.toneScore,
					riskAcknowledgment: confidence.riskAcknowledgment,
				},
				keyQuotes: sentiment.keyQuotes,
				topics: sentiment.topics,
				highConfidenceQuotes: confidence.details.highConfidenceQuotes,
				lowConfidenceQuotes: confidence.details.lowConfidenceQuotes,
			});
		}
		
		// Batch analysis (multiple statements)
		if (texts && Array.isArray(texts)) {
			const batchResult = analyzeBatch(texts);
			
			return NextResponse.json({
				overall: {
					sentiment: batchResult.overall.sentiment,
					sentimentScore: batchResult.overall.sentimentScore,
					tone: batchResult.overall.tone,
					confidence: batchResult.overall.confidence,
					keyQuotes: batchResult.overall.keyQuotes,
					topics: batchResult.overall.topics,
				},
				averages: batchResult.averages,
				byStatement: batchResult.byStatement.map(s => ({
					text: s.text.substring(0, 200) + '...', // Truncate for response
					sentiment: s.sentiment,
					sentimentScore: s.sentimentScore,
					confidence: s.confidence,
				})),
			});
		}
		
		return NextResponse.json(
			{ error: 'Either "text" (string) or "texts" (array) must be provided' },
			{ status: 400 }
		);
	} catch (error: any) {
		console.error('Sentiment analysis error:', error);
		return NextResponse.json(
			{ error: error?.message || 'Failed to analyze sentiment' },
			{ status: 500 }
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const ticker = searchParams.get('ticker');
		const type = searchParams.get('type') || 'transcript'; // transcript, news, mda
		
		if (!ticker) {
			return NextResponse.json(
				{ error: 'ticker parameter is required' },
				{ status: 400 }
			);
		}
		
		// For now, return placeholder - in Phase 2, this would fetch actual transcripts
		// from SeekingAlpha, SEC filings, or other sources
		return NextResponse.json({
			message: 'Transcript fetching not yet implemented. Please POST text directly.',
			ticker,
			type,
			note: 'Use POST /api/sentiment/analyze with text/texts in body',
		});
	} catch (error: any) {
		console.error('Sentiment fetch error:', error);
		return NextResponse.json(
			{ error: error?.message || 'Failed to fetch sentiment data' },
			{ status: 500 }
		);
	}
}

