import { z } from 'zod';

// ========== TYPES & SCHEMAS ==========

const BraveNewsResultSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
	url: z.string().url(),
	age: z.string().optional(),
	page_age: z.string().optional(),
	published_at: z.string().optional(),
	thumbnail: z.object({
		src: z.string().optional(),
	}).optional(),
});

const BraveWebSearchResponseSchema = z.object({
	web: z.object({
		results: z.array(BraveNewsResultSchema).optional(),
	}).optional(),
	news: z.object({
		results: z.array(BraveNewsResultSchema).optional(),
	}).optional(),
});

export interface NewsArticle {
	title: string;
	description: string;
	url: string;
	publishedAt?: string;
	age?: string;
	thumbnail?: string;
	score: number; // Relevance/quality score (0-100)
	sentiment?: 'positive' | 'neutral' | 'negative';
	source?: string;
}

export interface NewsSearchOptions {
	query: string;
	ticker?: string;
	companyName?: string;
	maxResults?: number;
	freshness?: 'pd' | 'pw' | 'pm' | 'py'; // past day, week, month, year
	sortBy?: 'relevance' | 'date';
}

export interface NewsSearchResult {
	articles: NewsArticle[];
	query: string;
	totalResults: number;
	fetchedAt: string;
}

// ========== CONFIGURATION ==========

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const BRAVE_BASE_URL = process.env.BRAVE_BASE_URL || 'https://api.search.brave.com/res/v1';
const NEWSAPI_KEY = process.env.NEWSAPI_KEY || '';
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

// ========== UTILITIES ==========

/**
 * Sleep with jitter for exponential backoff
 */
function sleep(ms: number, jitter = true): Promise<void> {
	const delay = jitter ? ms + Math.random() * ms * 0.5 : ms;
	return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
	const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
	return Math.min(delay, MAX_RETRY_DELAY);
}

/**
 * Simple sentiment analysis based on keywords
 * Can be replaced with VADER or more sophisticated NLP
 */
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
	const lowerText = text.toLowerCase();
	
	const positiveWords = ['surge', 'gain', 'profit', 'growth', 'beat', 'upgrade', 'bullish', 'rally', 'soar', 'record', 'success'];
	const negativeWords = ['plunge', 'loss', 'drop', 'decline', 'miss', 'downgrade', 'bearish', 'crash', 'fall', 'concern', 'risk'];
	
	let positiveScore = 0;
	let negativeScore = 0;
	
	positiveWords.forEach(word => {
		if (lowerText.includes(word)) positiveScore++;
	});
	
	negativeWords.forEach(word => {
		if (lowerText.includes(word)) negativeScore++;
	});
	
	if (positiveScore > negativeScore) return 'positive';
	if (negativeScore > positiveScore) return 'negative';
	return 'neutral';
}

/**
 * Score article relevance based on various factors
 */
function scoreArticle(
	article: z.infer<typeof BraveNewsResultSchema>,
	searchQuery: string,
	ticker?: string
): number {
	let score = 50; // Base score
	
	const title = article.title.toLowerCase();
	const description = (article.description || '').toLowerCase();
	const queryLower = searchQuery.toLowerCase();
	
	// Boost if ticker appears in title
	if (ticker && title.includes(ticker.toLowerCase())) {
		score += 20;
	}
	
	// Boost if query terms appear in title
	const queryWords = queryLower.split(' ');
	queryWords.forEach(word => {
		if (word.length > 3 && title.includes(word)) {
			score += 5;
		}
	});
	
	// Boost if query terms appear in description
	queryWords.forEach(word => {
		if (word.length > 3 && description.includes(word)) {
			score += 3;
		}
	});
	
	// Boost for recent articles (if age is available)
	if (article.age) {
		const ageLower = article.age.toLowerCase();
		if (ageLower.includes('hour') || ageLower.includes('minute')) {
			score += 15;
		} else if (ageLower.includes('day') && !ageLower.includes('days ago')) {
			score += 10;
		}
	}
	
	// Penalize if description is missing
	if (!article.description) {
		score -= 10;
	}
	
	// Ensure score is between 0-100
	return Math.max(0, Math.min(100, score));
}

/**
 * Extract domain from URL for deduplication
 */
function extractDomain(url: string): string {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname.replace('www.', '');
	} catch {
		return url;
	}
}

/**
 * Deduplicate articles by URL and title similarity
 */
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
	const seen = new Set<string>();
	const deduped: NewsArticle[] = [];
	
	for (const article of articles) {
		const urlKey = article.url.toLowerCase();
		const titleKey = article.title.toLowerCase().replace(/[^a-z0-9]/g, '');
		
		// Skip if we've seen this exact URL
		if (seen.has(urlKey)) continue;
		
		// Skip if we've seen a very similar title
		let isDuplicate = false;
		for (const existingTitle of seen) {
			if (existingTitle.startsWith('title:')) {
				const existing = existingTitle.substring(6);
				// Simple similarity check: if 80% of characters match
				const similarity = calculateSimilarity(titleKey, existing);
				if (similarity > 0.8) {
					isDuplicate = true;
					break;
				}
			}
		}
		
		if (!isDuplicate) {
			seen.add(urlKey);
			seen.add(`title:${titleKey}`);
			deduped.push(article);
		}
	}
	
	return deduped;
}

/**
 * Simple string similarity (Jaccard coefficient)
 */
function calculateSimilarity(str1: string, str2: string): number {
	const set1 = new Set(str1.split(''));
	const set2 = new Set(str2.split(''));
	
	const intersection = new Set([...set1].filter(x => set2.has(x)));
	const union = new Set([...set1, ...set2]);
	
	return intersection.size / union.size;
}

// ========== MAIN FUNCTION ==========

/**
 * Fetch news from Brave Search API with retry logic
 */
async function fetchBraveNews(
	query: string,
	options: {
		count?: number;
		freshness?: string;
		search_lang?: string;
	} = {}
): Promise<z.infer<typeof BraveWebSearchResponseSchema>> {
	if (!BRAVE_API_KEY) {
		throw new Error('BRAVE_API_KEY is not configured');
	}
	
	// Build params - start with absolute minimum
	const params = new URLSearchParams();
	params.append('q', query);
	
	// Add count parameter (max 20 for free tier, adjust as needed)
	if (options.count) {
		params.append('count', String(Math.min(options.count, 20)));
	}
	
	// Add search language
	if (options.search_lang) {
		params.append('search_lang', options.search_lang);
	}
	
	// Add freshness filter (pd=past day, pw=past week, pm=past month, py=past year)
	if (options.freshness) {
		params.append('freshness', options.freshness);
	}
	
	let lastError: Error | null = null;
	
	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		try {
			const url = `${BRAVE_BASE_URL}/web/search?${params}`;
			
			const response = await fetch(url, {
				headers: {
					'Accept': 'application/json',
					'X-Subscription-Token': BRAVE_API_KEY,
				},
				method: 'GET',
			});
			
			if (response.status === 429) {
				// Rate limited - use exponential backoff
				const delay = getBackoffDelay(attempt);
				console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
				await sleep(delay);
				continue;
			}
			
			if (!response.ok) {
				const errorBody = await response.text();
				console.error('Brave API error response:', errorBody);
				throw new Error(`Brave API error: ${response.status} ${response.statusText}. Details: ${errorBody}`);
			}
			
			const data = await response.json();
			return BraveWebSearchResponseSchema.parse(data);
			
		} catch (error) {
			lastError = error as Error;
			
			if (attempt < MAX_RETRIES - 1) {
				const delay = getBackoffDelay(attempt);
				console.warn(`Request failed. Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
				await sleep(delay);
			}
		}
	}
	
	throw lastError || new Error('Failed to fetch news after retries');
}

/**
 * Fetch news from NewsAPI (supplementary source)
 */
async function fetchNewsAPI(
	query: string,
	options: {
		pageSize?: number;
		language?: string;
		sortBy?: string;
	} = {}
): Promise<NewsArticle[]> {
	if (!NEWSAPI_KEY || NEWSAPI_KEY === 'your-newsapi-key-here') {
		console.log('NewsAPI key not configured, skipping NewsAPI fetch');
		return [];
	}

	try {
		const params = new URLSearchParams({
			q: query,
			pageSize: String(options.pageSize || 20),
			language: options.language || 'en',
			sortBy: options.sortBy || 'publishedAt',
			apiKey: NEWSAPI_KEY,
		});

		const response = await fetch(`${NEWSAPI_BASE_URL}/everything?${params}`);

		if (!response.ok) {
			console.error('NewsAPI error:', response.status, response.statusText);
			return [];
		}

		const data = await response.json();
		
		if (data.status !== 'ok' || !data.articles) {
			return [];
		}

		// Convert NewsAPI format to our format
		return data.articles.map((article: any) => ({
			title: article.title || '',
			description: article.description || '',
			url: article.url || '',
			publishedAt: article.publishedAt,
			age: calculateAge(article.publishedAt),
			thumbnail: article.urlToImage,
			score: 60, // Base score for NewsAPI results
			sentiment: analyzeSentiment(`${article.title} ${article.description}`),
			source: article.source?.name || extractDomain(article.url),
		}));

	} catch (error) {
		console.error('NewsAPI fetch error:', error);
		return [];
	}
}

/**
 * Calculate how long ago an article was published
 */
function calculateAge(publishedAt?: string): string | undefined {
	if (!publishedAt) return undefined;

	try {
		const published = new Date(publishedAt);
		const now = new Date();
		const diffMs = now.getTime() - published.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 60) {
			return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
		} else if (diffHours < 24) {
			return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		} else if (diffDays === 1) {
			return 'yesterday';
		} else if (diffDays < 7) {
			return `${diffDays} days ago`;
		} else {
			return published.toLocaleDateString();
		}
	} catch {
		return undefined;
	}
}

/**
 * Main function: Fetch and rank finance news
 */
export async function fetchFinanceNews(options: NewsSearchOptions): Promise<NewsSearchResult> {
	const {
		query,
		ticker,
		companyName,
		maxResults = 20,
		freshness = 'pw', // Default to past week
		sortBy = 'relevance',
	} = options;
	
	// Build search query
	let searchQuery = query;
	if (ticker && !query.includes(ticker)) {
		searchQuery = `${ticker} ${query}`;
	}
	if (companyName && !query.includes(companyName)) {
		searchQuery = `${companyName} ${searchQuery}`;
	}
	
	// Fetch from both Brave and NewsAPI in parallel
	const [braveResponse, newsAPIResults] = await Promise.all([
		fetchBraveNews(searchQuery, {
			count: 20,
			freshness,
		}).catch(err => {
			console.error('Brave API error:', err);
			return { news: { results: [] }, web: { results: [] } };
		}),
		fetchNewsAPI(searchQuery, {
			pageSize: maxResults,
			sortBy: sortBy === 'date' ? 'publishedAt' : 'relevancy',
		}),
	]);
	
	// Combine news and web results from Brave
	const newsResults = braveResponse.news?.results || [];
	const webResults = braveResponse.web?.results || [];
	const allResults = [...newsResults, ...webResults];
	
	// Process Brave results and score articles
	let braveArticles: NewsArticle[] = allResults.map(result => {
		const score = scoreArticle(result, searchQuery, ticker);
		const fullText = `${result.title} ${result.description || ''}`;
		const sentiment = analyzeSentiment(fullText);
		
		return {
			title: result.title,
			description: result.description || '',
			url: result.url,
			publishedAt: result.published_at,
			age: result.age || result.page_age,
			thumbnail: result.thumbnail?.src,
			score,
			sentiment,
			source: extractDomain(result.url),
		};
	});
	
	// Combine Brave and NewsAPI results
	let articles: NewsArticle[] = [...braveArticles, ...newsAPIResults];
	
	// Deduplicate
	articles = deduplicateArticles(articles);
	
	// Sort
	if (sortBy === 'relevance') {
		articles.sort((a, b) => b.score - a.score);
	} else if (sortBy === 'date') {
		articles.sort((a, b) => {
			const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
			const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
			return dateB - dateA;
		});
	}
	
	// Limit results
	articles = articles.slice(0, maxResults);
	
	return {
		articles,
		query: searchQuery,
		totalResults: articles.length,
		fetchedAt: new Date().toISOString(),
	};
}

/**
 * CLI function for testing
 */
export async function runCLI() {
	const args = process.argv.slice(2);
	
	if (args.length === 0) {
		console.log('Usage: node newsRetriever.js <query> [ticker] [maxResults]');
		console.log('Example: node newsRetriever.js "stock market news" AAPL 10');
		process.exit(1);
	}
	
	const [query, ticker, maxResultsStr] = args;
	const maxResults = maxResultsStr ? parseInt(maxResultsStr, 10) : 10;
	
	try {
		console.log(`Fetching news for: ${query}${ticker ? ` (${ticker})` : ''}\n`);
		
		const result = await fetchFinanceNews({
			query,
			ticker,
			maxResults,
		});
		
		console.log(`Found ${result.totalResults} articles:\n`);
		
		result.articles.forEach((article, idx) => {
			console.log(`${idx + 1}. ${article.title}`);
			console.log(`   Score: ${article.score} | Sentiment: ${article.sentiment}`);
			console.log(`   ${article.url}`);
			console.log(`   ${article.description.substring(0, 150)}...`);
			console.log();
		});
		
	} catch (error) {
		console.error('Error:', error);
		process.exit(1);
	}
}

// Run CLI if executed directly
if (require.main === module) {
	runCLI();
}
