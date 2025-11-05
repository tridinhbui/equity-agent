import { NextRequest, NextResponse } from 'next/server';
import { fetchFinanceNews } from '@/app/lib/newsRetriever';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		
		const {
			query,
			ticker,
			companyName,
			maxResults = 20,
			freshness = 'pw',
			sortBy = 'relevance',
		} = body;
		
		// Validation
		if (!query || typeof query !== 'string') {
			return NextResponse.json(
				{ error: 'Query is required and must be a string' },
				{ status: 400 }
			);
		}
		
		if (query.trim().length === 0) {
			return NextResponse.json(
				{ error: 'Query cannot be empty' },
				{ status: 400 }
			);
		}
		
		// Fetch news
		const result = await fetchFinanceNews({
			query: query.trim(),
			ticker: ticker?.trim(),
			companyName: companyName?.trim(),
			maxResults: Math.min(maxResults, 50), // Cap at 50
			freshness,
			sortBy,
		});
		
		return NextResponse.json(result);
		
	} catch (error: any) {
		console.error('News fetch error:', error);
		
		if (error.message?.includes('BRAVE_API_KEY')) {
			return NextResponse.json(
				{ error: 'Brave API is not configured. Please set BRAVE_API_KEY in environment variables.' },
				{ status: 500 }
			);
		}
		
		return NextResponse.json(
			{ error: error.message || 'Failed to fetch news' },
			{ status: 500 }
		);
	}
}

export async function GET() {
	return NextResponse.json(
		{
			message: 'Finance News API',
			endpoints: {
				POST: '/api/news/fetch',
			},
			usage: {
				method: 'POST',
				body: {
					query: 'string (required) - Search query',
					ticker: 'string (optional) - Stock ticker symbol',
					companyName: 'string (optional) - Company name',
					maxResults: 'number (optional, default: 20, max: 50)',
					freshness: 'string (optional, default: "pw") - pd|pw|pm|py',
					sortBy: 'string (optional, default: "relevance") - relevance|date',
				},
			},
		},
		{ status: 200 }
	);
}
