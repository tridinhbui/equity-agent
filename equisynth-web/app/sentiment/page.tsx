'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold mb-2">🎭 Sentiment & Tone Agent</h1>
					<p className="text-gray-300">
						Analyze management confidence, sentiment, and tone from earnings transcripts and financial text
					</p>
				</div>

				{/* Input Form */}
				<div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8">
					<h2 className="text-2xl font-bold mb-6">Text Analysis</h2>
					
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Enter Text to Analyze (Earnings Transcript, News Article, MD&A, etc.)
						</label>
						<textarea
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							rows={8}
							className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
							placeholder="Paste earnings call transcript, management commentary, or news article here..."
						/>
						<p className="text-sm text-gray-400 mt-2">
							💡 Tip: Paste management statements from earnings calls for best results
						</p>
					</div>

					<button
						onClick={handleAnalyze}
						disabled={loading || !inputText.trim()}
						className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? '🔄 Analyzing...' : '🎯 Analyze Sentiment & Tone'}
					</button>

					{error && (
						<div className="mt-4 bg-red-500/20 border border-red-500 rounded-lg p-4">
							<p className="text-red-200">❌ {error}</p>
						</div>
					)}
				</div>

				{/* Results */}
				{result && (
					<div className="space-y-8">
						{/* Overall Sentiment Summary */}
						<div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
							<h2 className="text-3xl font-bold text-white mb-6">📊 Sentiment Analysis Results</h2>
							
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
								<div className="bg-white/5 rounded-xl p-6">
									<p className="text-gray-400 text-sm mb-2">Overall Sentiment</p>
									<p className="text-4xl font-bold mb-2">{getSentimentEmoji(result.sentiment)}</p>
									<p className={`text-2xl font-bold mb-1 ${getSentimentColor(result.sentimentScore)}`}>
										{result.sentiment.toUpperCase()}
									</p>
									<p className="text-gray-300 text-sm">
										Score: {result.sentimentScore.toFixed(1)}/100
									</p>
								</div>

								<div className="bg-white/5 rounded-xl p-6">
									<p className="text-gray-400 text-sm mb-2">Tone</p>
									<p className="text-4xl font-bold mb-2">
										{result.tone === 'optimistic' ? '🚀' : result.tone === 'pessimistic' ? '⚠️' : '⚖️'}
									</p>
									<p className="text-2xl font-bold mb-1 text-purple-300">
										{result.tone.charAt(0).toUpperCase() + result.tone.slice(1)}
									</p>
									<p className="text-gray-300 text-sm">
										Management outlook assessment
									</p>
								</div>

								<div className="bg-white/5 rounded-xl p-6">
									<p className="text-gray-400 text-sm mb-2">Confidence Score</p>
									<p className="text-4xl font-bold mb-2">💪</p>
									<p className={`text-2xl font-bold mb-1 ${getConfidenceColor(result.confidence)}`}>
										{result.confidence.toFixed(1)}/10
									</p>
									<p className="text-gray-300 text-sm">
										{result.confidence >= 7 ? 'High Confidence' : result.confidence >= 4 ? 'Medium Confidence' : 'Low Confidence'}
									</p>
								</div>
							</div>

							{/* Confidence Breakdown */}
							<div className="bg-white/5 rounded-xl p-6 mt-6">
								<h3 className="text-xl font-bold text-white mb-4">Confidence Breakdown</h3>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p className="text-gray-400 text-sm mb-1">Certainty Language</p>
										<p className="text-lg font-semibold text-white">
											{(result.confidenceDetails.certainty / 4 * 10).toFixed(1)}/10
										</p>
										<p className="text-xs text-gray-400">({result.confidenceDetails.certainty.toFixed(2)}/4)</p>
									</div>
									<div>
										<p className="text-gray-400 text-sm mb-1">Specificity</p>
										<p className="text-lg font-semibold text-white">
											{(result.confidenceDetails.specificity / 2.5 * 10).toFixed(1)}/10
										</p>
										<p className="text-xs text-gray-400">({result.confidenceDetails.specificity.toFixed(2)}/2.5)</p>
									</div>
									<div>
										<p className="text-gray-400 text-sm mb-1">Tone Score</p>
										<p className="text-lg font-semibold text-white">
											{(result.confidenceDetails.toneScore / 2 * 10).toFixed(1)}/10
										</p>
										<p className="text-xs text-gray-400">({result.confidenceDetails.toneScore.toFixed(2)}/2)</p>
									</div>
									<div>
										<p className="text-gray-400 text-sm mb-1">Risk Acknowledgment</p>
										<p className="text-lg font-semibold text-white">
											{(result.confidenceDetails.riskAcknowledgment * 10).toFixed(1)}/10
										</p>
										<p className="text-xs text-gray-400">({result.confidenceDetails.riskAcknowledgment.toFixed(2)}/1)</p>
									</div>
								</div>
							</div>
						</div>

						{/* Key Topics */}
						{result.topics.length > 0 && (
							<div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
								<h2 className="text-2xl font-bold text-white mb-4">🔑 Key Topics Identified</h2>
								<div className="flex flex-wrap gap-3">
									{result.topics.map((topic, idx) => (
										<span
											key={idx}
											className="px-4 py-2 bg-purple-500/30 border border-purple-400/50 rounded-lg text-purple-200"
										>
											{topic}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Key Quotes */}
						{result.keyQuotes.length > 0 && (
							<div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
								<h2 className="text-2xl font-bold text-white mb-4">💬 Key Quotes</h2>
								<div className="space-y-4">
									{result.keyQuotes.slice(0, 5).map((quote, idx) => (
										<div
											key={idx}
											className="bg-white/5 rounded-lg p-4 border-l-4 border-purple-500"
										>
											<p className="text-gray-200 mb-2 italic">"{quote.text}"</p>
											<div className="flex items-center gap-4 text-sm">
												<span className={`font-semibold ${getConfidenceColor(quote.confidence)}`}>
													Key Quote Confidence: {quote.confidence.toFixed(1)}/10
												</span>
												<span className={`font-semibold ${getSentimentColor(quote.sentiment === 'positive' ? 70 : quote.sentiment === 'negative' ? 30 : 50)}`}>
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
							<div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
								<h2 className="text-2xl font-bold text-green-400 mb-4">✅ High Confidence Statements</h2>
								<div className="space-y-3">
									{result.highConfidenceQuotes.slice(0, 3).map((quote, idx) => (
										<div key={idx} className="bg-green-500/10 rounded-lg p-4 border border-green-400/30">
											<p className="text-gray-200">{quote}</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Low Confidence Quotes */}
						{result.lowConfidenceQuotes.length > 0 && (
							<div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
								<h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ Low Confidence Statements</h2>
								<div className="space-y-3">
									{result.lowConfidenceQuotes.slice(0, 3).map((quote, idx) => (
										<div key={idx} className="bg-red-500/10 rounded-lg p-4 border border-red-400/30">
											<p className="text-gray-200">{quote}</p>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

