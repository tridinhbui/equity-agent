'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import AgentSurface from '@/components/AgentSurface';

interface NewsArticle {
	title: string;
	description: string;
	url: string;
	publishedAt?: string;
	age?: string;
	thumbnail?: string;
	score: number;
	sentiment?: 'positive' | 'neutral' | 'negative';
	source?: string;
}

interface NewsSearchResult {
	articles: NewsArticle[];
	query: string;
	totalResults: number;
	fetchedAt: string;
}

export default function FinanceNewsPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [query, setQuery] = useState('');
	const [ticker, setTicker] = useState('');
	const [companyName, setCompanyName] = useState('');
	const [maxResults, setMaxResults] = useState(20);
	const [freshness, setFreshness] = useState<'pd' | 'pw' | 'pm' | 'py'>('pw');
	const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
	
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<NewsSearchResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Trending news state
	const [trendingNews, setTrendingNews] = useState<NewsSearchResult | null>(null);
	const [trendingLoading, setTrendingLoading] = useState(true);
	const [trendingError, setTrendingError] = useState<string | null>(null);

	// Fetch trending finance news on mount
	useEffect(() => {
		const fetchTrendingNews = async () => {
			if (status !== 'authenticated') return;
			
			setTrendingLoading(true);
			setTrendingError(null);

			try {
				const res = await fetch('/api/news/fetch', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						query: 'stocks stock market earnings NYSE NASDAQ S&P 500 Dow Jones',
						maxResults: 20,
						freshness: 'pd', // Past day for trending news
						sortBy: 'date',
					}),
				});

				if (!res.ok) {
					const errorData = await res.json();
					throw new Error(errorData.error || 'Failed to fetch trending news');
				}

				const data = await res.json();
				setTrendingNews(data);
			} catch (err: any) {
				setTrendingError(err?.message || 'Failed to fetch trending news');
			} finally {
				setTrendingLoading(false);
			}
		};

		fetchTrendingNews();
	}, [status]);

	// Redirect if not authenticated
	if (status === 'loading') {
		return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">Loading...</div>;
	}

	if (status === 'unauthenticated') {
		router.push('/login');
		return null;
	}

	const handleSearch = async () => {
		if (!query.trim()) {
			setError('Please enter a search query');
			return;
		}

		setLoading(true);
		setError(null);
		setResult(null);

		try {
			const res = await fetch('/api/news/fetch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: query.trim(),
					ticker: ticker.trim() || undefined,
					companyName: companyName.trim() || undefined,
					maxResults,
					freshness,
					sortBy,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Failed to fetch news');
			}

			const data = await res.json();
			setResult(data);
		} catch (err: any) {
			setError(err?.message || 'Failed to fetch news');
		} finally {
			setLoading(false);
		}
	};

	const getSentimentColor = (sentiment?: string) => {
		if (sentiment === 'positive') return 'text-green-600';
		if (sentiment === 'negative') return 'text-red-600';
		return 'text-gray-600';
	};

	const getSentimentEmoji = (sentiment?: string) => {
		if (sentiment === 'positive') return '📈';
		if (sentiment === 'negative') return '📉';
		return '➡️';
	};

	// Render news articles (reusable for both trending and custom search)
	const renderNewsArticles = (articles: NewsArticle[]) => (
		<div className="space-y-4">
			{articles.map((article, idx) => (
				<div
					key={idx}
					className="bg-white rounded-xl p-6 border border-gray-200 hover:border-slate-400 hover:shadow-lg transition-all"
				>
					<div className="flex gap-4">
						{/* Thumbnail */}
						{article.thumbnail && (
							<div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
								<img
									src={article.thumbnail}
									alt={article.title}
									className="w-full h-full object-cover"
									onError={(e) => {
										e.currentTarget.style.display = 'none';
									}}
								/>
							</div>
						)}

						{/* Content */}
						<div className="flex-1 min-w-0">
							{/* Title */}
							<h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-slate-700 transition-colors">
								<a
									href={article.url}
									target="_blank"
									rel="noopener noreferrer"
									className="hover:underline"
								>
									{article.title}
								</a>
							</h3>

							{/* Description */}
							{article.description && (
								<p className="text-sm text-gray-700 mb-3 line-clamp-2">
									{article.description}
								</p>
							)}

							{/* Metadata */}
							<div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
								{/* Source */}
								{article.source && (
									<span className="font-medium text-slate-700">
										{article.source}
									</span>
								)}

								{/* Age */}
								{article.age && (
									<span>
										🕐 {article.age}
									</span>
								)}

								{/* Sentiment */}
								{article.sentiment && (
									<span className={`font-medium ${getSentimentColor(article.sentiment)}`}>
										{getSentimentEmoji(article.sentiment)} {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
									</span>
								)}

								{/* Score */}
								<span className="font-medium text-gray-700">
									⭐ Score: {article.score}
								</span>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);

	return (
		<AppShell>
			<div className="bg-grid max-w-7xl mx-auto px-4 md:px-6">
				<div className="agent-slate">
					<AgentSurface
						title="📰 Finance News"
						subtitle="Search and discover the latest financial news with AI-powered relevance scoring and sentiment analysis."
					>
						{/* TRENDING NEWS SECTION */}
						<div className="glass-card p-6 md:p-8 mb-6">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-gray-900">
									🔥 Trending Finance News
								</h2>
								<div className="text-sm text-gray-600">
									Live updates • Past 24 hours
								</div>
							</div>

							{/* Loading State */}
							{trendingLoading && (
								<div className="text-center py-12">
									<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
									<p className="mt-4 text-gray-600">Loading trending news...</p>
								</div>
							)}

							{/* Error State */}
							{trendingError && (
								<div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
									<p className="text-red-700 font-medium">❌ {trendingError}</p>
								</div>
							)}

							{/* Trending News Results */}
							{!trendingLoading && !trendingError && trendingNews && (
								<>
									{trendingNews.articles.length === 0 ? (
										<div className="text-center py-12 text-gray-500">
											<p className="text-lg mb-2">No trending news found</p>
											<p className="text-sm">Check back later for updates</p>
										</div>
									) : (
										renderNewsArticles(trendingNews.articles)
									)}
								</>
							)}
						</div>

						{/* DIVIDER */}
						<div className="relative my-12">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t-2 border-gray-300"></div>
							</div>
						</div>

						{/* CUSTOM SEARCH HEADER */}
						<div className="text-center mb-8">
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
								🔍 Custom Search
							</h2>
							<p className="text-gray-600 text-sm md:text-base">
								Search for specific topics, companies, or tickers
							</p>
						</div>

						{/* CUSTOM SEARCH SECTION */}
						<div className="glass-card p-6 md:p-8">
							<h3 className="text-xl font-semibold mb-6 text-gray-900">Search Parameters</h3>
							
							{/* Search Query */}
							<div className="mb-6">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Search Query *
								</label>
								<input
									type="text"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
									className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 ring-agent focus:outline-none transition-all"
									placeholder="e.g., artificial intelligence stocks, Tesla earnings, market analysis"
								/>
							</div>

							{/* Optional Filters */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Ticker Symbol (optional)
									</label>
									<input
										type="text"
										value={ticker}
										onChange={(e) => setTicker(e.target.value.toUpperCase())}
										className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 ring-agent focus:outline-none transition-all"
										placeholder="AAPL"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Company Name (optional)
									</label>
									<input
										type="text"
										value={companyName}
										onChange={(e) => setCompanyName(e.target.value)}
										className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 ring-agent focus:outline-none transition-all"
										placeholder="Apple Inc."
									/>
								</div>
							</div>

							{/* Advanced Options */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Time Range
									</label>
									<select
										value={freshness}
										onChange={(e) => setFreshness(e.target.value as any)}
										className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 ring-agent focus:outline-none transition-all"
									>
										<option value="pd">Past Day</option>
										<option value="pw">Past Week</option>
										<option value="pm">Past Month</option>
										<option value="py">Past Year</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Sort By
									</label>
									<select
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value as any)}
										className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 ring-agent focus:outline-none transition-all"
									>
										<option value="relevance">Relevance</option>
										<option value="date">Date</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Max Results
									</label>
									<input
										type="number"
										value={maxResults}
										onChange={(e) => setMaxResults(Math.min(50, Math.max(1, parseInt(e.target.value) || 20)))}
										min="1"
										max="50"
										className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 ring-agent focus:outline-none transition-all"
									/>
								</div>
							</div>

							{/* Search Button */}
							<button
								onClick={handleSearch}
								disabled={loading || !query.trim()}
								className="w-full px-6 py-3 bg-gradient-to-r from-slate-600 to-gray-700 text-white font-semibold rounded-lg hover:from-slate-700 hover:to-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl focus:ring-2 ring-agent focus:outline-none"
							>
								{loading ? '🔄 Searching...' : '🔍 Search News'}
							</button>

							{/* Error Display */}
							{error && (
								<div className="mt-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
									<p className="text-red-700 font-medium">❌ {error}</p>
								</div>
							)}
						</div>
					</AgentSurface>

					{/* CUSTOM SEARCH RESULTS */}
					{result && (
						<div className="glass-card p-6 md:p-8 mt-6">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-gray-900">
									📰 Custom Search Results
								</h2>
								<div className="text-sm text-gray-600">
									{result.totalResults} articles found
								</div>
							</div>

							{result.articles.length === 0 ? (
								<div className="text-center py-12 text-gray-500">
									<p className="text-lg mb-2">No articles found</p>
									<p className="text-sm">Try adjusting your search parameters</p>
								</div>
							) : (
								renderNewsArticles(result.articles)
							)}

							{/* Footer Info */}
							<div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
								Fetched at {new Date(result.fetchedAt).toLocaleString()} • Powered by Brave Search API
							</div>
						</div>
					)}
				</div>
			</div>
		</AppShell>
	);
}
