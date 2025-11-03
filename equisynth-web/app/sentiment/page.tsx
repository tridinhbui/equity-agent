'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import AgentSurface from '@/components/AgentSurface';

interface SentimentResult {
	sentiment: 'positive' | 'neutral' | 'negative';
	sentimentScore: number;
	tone: 'optimistic' | 'cautious' | 'pessimistic';
	confidence: number;
	confidenceDetails: {
		certainty: number;
		specificity: number;
		toneScore: number;
		riskAcknowledgment: number;
	};
	keyQuotes: Array<{
		text: string;
		confidence: number;
		sentiment: 'positive' | 'neutral' | 'negative';
	}>;
	topics: string[];
	highConfidenceQuotes: string[];
	lowConfidenceQuotes: string[];
}

export default function SentimentPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [inputText, setInputText] = useState('');
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<SentimentResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Redirect if not authenticated
	if (status === 'loading') {
		return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">Loading...</div>;
	}

	if (status === 'unauthenticated') {
		router.push('/login');
		return null;
	}

	const handleAnalyze = async () => {
		if (!inputText.trim()) {
			setError('Please enter text to analyze');
			return;
		}

		setLoading(true);
		setError(null);
		setResult(null);

		try {
			const res = await fetch('/api/sentiment/analyze', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: inputText }),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Failed to analyze sentiment');
			}

			const data = await res.json();
			setResult(data);
		} catch (err: any) {
			setError(err?.message || 'Failed to analyze sentiment');
		} finally {
			setLoading(false);
		}
	};

	const getSentimentColor = (score: number) => {
		if (score >= 60) return 'text-green-400';
		if (score <= 40) return 'text-red-400';
		return 'text-yellow-400';
	};

	const getConfidenceColor = (score: number) => {
		if (score >= 7) return 'text-green-400';
		if (score >= 4) return 'text-yellow-400';
		return 'text-red-400';
	};

	const getSentimentEmoji = (sentiment: string) => {
		if (sentiment === 'positive') return '📈';
		if (sentiment === 'negative') return '📉';
		return '➡️';
	};

	return (
		<AppShell>
			<div className="bg-grid max-w-7xl mx-auto px-4 md:px-6">
				<div className="agent-rose">
					<AgentSurface
						title="🎭 Sentiment & Tone Agent"
						subtitle="Analyze management confidence, sentiment, and tone from earnings transcripts and financial text"
						className="mt-6"
					>
						<div className="glass-card p-6 md:p-8">
							<h2 className="text-2xl font-bold mb-6 text-gray-900">Text Analysis</h2>
							
							<div className="mb-6">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Enter Text to Analyze (Earnings Transcript, News Article, MD&A, etc.)
								</label>
								<textarea
									value={inputText}
									onChange={(e) => setInputText(e.target.value)}
									rows={8}
									className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 ring-agent focus:outline-none transition-all"
									placeholder="Paste earnings call transcript, management commentary, or news article here..."
								/>
								<p className="text-sm text-gray-500 mt-2">
									💡 Tip: Paste management statements from earnings calls for best results
								</p>
							</div>

							<button
								onClick={handleAnalyze}
								disabled={loading || !inputText.trim()}
								className="w-full px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl focus:ring-2 ring-agent focus:outline-none"
							>
								{loading ? '🔄 Analyzing...' : '🎯 Analyze Sentiment & Tone'}
							</button>

							{error && (
								<div className="mt-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
									<p className="text-red-700 font-medium">❌ {error}</p>
								</div>
							)}
						</div>
					</AgentSurface>

				{/* Results */}
				{result && (
					<div className="space-y-6 mt-6">
						{/* Overall Sentiment Summary */}
						<div className="glass-card p-6 md:p-8">
							<h2 className="text-3xl font-bold text-gray-900 mb-6">📊 Sentiment Analysis Results</h2>
							
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
								<div className="bg-rose-50 rounded-xl p-6">
									<p className="text-gray-600 text-sm mb-2">Overall Sentiment</p>
									<p className="text-4xl font-bold mb-2">{getSentimentEmoji(result.sentiment)}</p>
									<p className={`text-2xl font-bold mb-1`}>
										{result.sentiment.toUpperCase()}
									</p>
									<p className="text-gray-700 text-sm">
										Score: {result.sentimentScore.toFixed(1)}/100
									</p>
								</div>

								<div className="bg-pink-50 rounded-xl p-6">
									<p className="text-gray-600 text-sm mb-2">Tone</p>
									<p className="text-4xl font-bold mb-2">
										{result.tone === 'optimistic' ? '🚀' : result.tone === 'pessimistic' ? '⚠️' : '⚖️'}
									</p>
									<p className="text-2xl font-bold mb-1 text-gray-900">
										{result.tone.charAt(0).toUpperCase() + result.tone.slice(1)}
									</p>
									<p className="text-gray-700 text-sm">
										Management outlook assessment
									</p>
								</div>

								<div className="bg-fuchsia-50 rounded-xl p-6">
									<p className="text-gray-600 text-sm mb-2">Confidence Score</p>
									<p className="text-4xl font-bold mb-2">💪</p>
									<p className={`text-2xl font-bold mb-1`}>
										{result.confidence.toFixed(1)}/10
									</p>
									<p className="text-gray-700 text-sm">
										{result.confidence >= 7 ? 'High Confidence' : result.confidence >= 4 ? 'Medium Confidence' : 'Low Confidence'}
									</p>
								</div>
							</div>

							{/* Confidence Breakdown */}
							<div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl p-6 mt-6">
								<h3 className="text-xl font-bold text-gray-900 mb-4">Confidence Breakdown</h3>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p className="text-gray-600 text-sm mb-1">Certainty Language</p>
										<p className="text-lg font-semibold text-gray-900">
											{(result.confidenceDetails.certainty / 4 * 10).toFixed(1)}/10
										</p>
										<p className="text-xs text-gray-500">({result.confidenceDetails.certainty.toFixed(2)}/4)</p>
									</div>
									<div>
										<p className="text-gray-600 text-sm mb-1">Specificity</p>
										<p className="text-lg font-semibold text-gray-900">
											{(result.confidenceDetails.specificity / 2.5 * 10).toFixed(1)}/10
										</p>
										<p className="text-xs text-gray-500">({result.confidenceDetails.specificity.toFixed(2)}/2.5)</p>
									</div>
									<div>
										<p className="text-gray-600 text-sm mb-1">Tone Score</p>
										<p className="text-lg font-semibold text-gray-900">
											{(result.confidenceDetails.toneScore / 2 * 10).toFixed(1)}/10
										</p>
										<p className="text-xs text-gray-500">({result.confidenceDetails.toneScore.toFixed(2)}/2)</p>
									</div>
									<div>
										<p className="text-gray-600 text-sm mb-1">Risk Acknowledgment</p>
										<p className="text-lg font-semibold text-gray-900">
											{(result.confidenceDetails.riskAcknowledgment * 10).toFixed(1)}/10
										</p>
										<p className="text-xs text-gray-500">({result.confidenceDetails.riskAcknowledgment.toFixed(2)}/1)</p>
									</div>
								</div>
							</div>
						</div>

						{/* Key Topics */}
						{result.topics.length > 0 && (
							<div className="glass-card p-6 md:p-8">
								<h2 className="text-2xl font-bold text-gray-900 mb-4">🔑 Key Topics Identified</h2>
								<div className="flex flex-wrap gap-3">
									{result.topics.map((topic, idx) => (
										<span
											key={idx}
											className="px-4 py-2 bg-rose-100 border border-rose-300 rounded-lg text-rose-800 font-medium"
										>
											{topic}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Key Quotes */}
						{result.keyQuotes.length > 0 && (
							<div className="glass-card p-6 md:p-8">
								<h2 className="text-2xl font-bold text-gray-900 mb-4">💬 Key Quotes</h2>
								<div className="space-y-4">
									{result.keyQuotes.slice(0, 5).map((quote, idx) => (
										<div
											key={idx}
											className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-4 border-l-4 border-rose-500"
										>
											<p className="text-gray-800 mb-2 italic">"{quote.text}"</p>
											<div className="flex items-center gap-4 text-sm">
												<span className="font-semibold text-gray-900">
													Confidence: {quote.confidence.toFixed(1)}/10
												</span>
												<span className="font-semibold text-gray-900">
													{quote.sentiment.toUpperCase()}
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* High Confidence Quotes */}
						{result.highConfidenceQuotes.length > 0 && (
							<div className="glass-card p-6 md:p-8">
								<h2 className="text-2xl font-bold text-green-700 mb-4">✅ High Confidence Statements</h2>
								<div className="space-y-3">
									{result.highConfidenceQuotes.slice(0, 3).map((quote, idx) => (
										<div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-300">
											<p className="text-gray-800">{quote}</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Low Confidence Quotes */}
						{result.lowConfidenceQuotes.length > 0 && (
							<div className="glass-card p-6 md:p-8">
								<h2 className="text-2xl font-bold text-red-700 mb-4">⚠️ Low Confidence Statements</h2>
								<div className="space-y-3">
									{result.lowConfidenceQuotes.slice(0, 3).map((quote, idx) => (
										<div key={idx} className="bg-red-50 rounded-lg p-4 border border-red-300">
											<p className="text-gray-800">{quote}</p>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
				</div>
			</div>
		</AppShell>
	);
}

