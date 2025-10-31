"use client";

import { useState, useEffect } from "react";

interface NarrativeAnalyzerProps {
	ticker: string;
	form: string;
	filed: string;
}

export default function NarrativeAnalyzer({
	ticker,
	form,
	filed,
}: NarrativeAnalyzerProps) {
	const [loading, setLoading] = useState(false);
	const [sections, setSections] = useState<any>(null);
	const [error, setError] = useState("");
	const [activeSection, setActiveSection] = useState<string | null>(null);

	useEffect(() => {
		loadSections();
	}, [ticker, form, filed]);

	async function loadSections() {
		setLoading(true);
		setError("");
		setSections(null);
		try {
			// Load sections.json
			const res = await fetch(
				`/api/data/sections?ticker=${ticker}&form=${form}&filed=${filed}`
			);
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || "Failed to load sections");
			}
			const result = await res.json();
			setSections(result.sections);
			if (result.sections && result.sections.length > 0) {
				setActiveSection(result.sections[0].name);
			}
		} catch (err: any) {
			setError(err?.message || "Unknown error");
		} finally {
			setLoading(false);
		}
	}

	if (loading) {
		return (
			<div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					📝 Narrative Analysis
				</h2>
				<div className="flex items-center justify-center py-12">
					<svg
						className="animate-spin h-8 w-8 text-indigo-600"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span className="ml-3 text-lg text-gray-600">
						Loading narrative sections...
					</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					📝 Narrative Analysis
				</h2>
				<div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
					<p className="text-base text-yellow-800 font-medium mb-2">{error}</p>
					<p className="text-sm text-yellow-700">
						Make sure you've run "Section + chunk" on the Data Extractor Agent
						first.
					</p>
				</div>
			</div>
		);
	}

	if (!sections || sections.length === 0) {
		return (
			<div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					📝 Narrative Analysis
				</h2>
				<p className="text-center text-gray-500 py-8">
					No sections found in this filing.
				</p>
			</div>
		);
	}

	const currentSection = sections.find((s: any) => s.name === activeSection);

	// Calculate sentiment color (simple heuristic based on keywords)
	function getSentimentColor(text: string): string {
		const lowerText = text.toLowerCase();
		const positiveWords = [
			"growth",
			"increase",
			"profit",
			"success",
			"improve",
			"strong",
			"opportunity",
		];
		const negativeWords = [
			"risk",
			"decline",
			"loss",
			"challenge",
			"uncertain",
			"adverse",
			"decline",
		];

		const positiveCount = positiveWords.filter((word) =>
			lowerText.includes(word)
		).length;
		const negativeCount = negativeWords.filter((word) =>
			lowerText.includes(word)
		).length;

		if (positiveCount > negativeCount) return "text-green-700";
		if (negativeCount > positiveCount) return "text-red-700";
		return "text-gray-700";
	}

	return (
		<div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-gray-900">📝 Narrative Analysis</h2>
				<button
					onClick={loadSections}
					className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
				>
					🔄 Refresh
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Section List */}
				<div className="lg:col-span-1 space-y-2">
					<h3 className="text-lg font-semibold text-gray-800 mb-3">Sections</h3>
					{sections.map((section: any) => (
						<button
							key={section.name}
							onClick={() => setActiveSection(section.name)}
							className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
								activeSection === section.name
									? "bg-indigo-600 text-white font-medium"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							<div className="flex items-center justify-between">
								<span className="text-sm truncate">{section.name}</span>
								<span
									className={`text-xs px-2 py-1 rounded ${
										activeSection === section.name
											? "bg-indigo-500"
											: "bg-gray-200 text-gray-600"
									}`}
								>
									{section.chunks}
								</span>
							</div>
						</button>
					))}
				</div>

				{/* Section Content */}
				<div className="lg:col-span-3">
					{currentSection && (
						<div className="space-y-4">
							<div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
								<h3 className="text-2xl font-bold text-gray-900 mb-2">
									{currentSection.name}
								</h3>
								<div className="flex items-center gap-4 text-sm text-gray-600">
									<span>📄 {currentSection.chunks} chunks</span>
									<span>📊 {currentSection.charCount.toLocaleString()} chars</span>
									<span>
										📈 Lines {currentSection.startLine} - {currentSection.endLine}
									</span>
								</div>
							</div>

							{/* Preview */}
							<div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
								<h4 className="text-lg font-semibold text-gray-900 mb-4">
									Preview (First 1000 characters)
								</h4>
								<p
									className={`leading-relaxed whitespace-pre-wrap ${getSentimentColor(
										currentSection.preview
									)}`}
								>
									{currentSection.preview.substring(0, 1000)}
									{currentSection.preview.length > 1000 && "..."}
								</p>
							</div>

							{/* Sentiment Analysis */}
							<div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
								<h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
									🎯 Quick Sentiment Indicators
								</h4>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-gray-600 mb-1">Tone</p>
										<p className="text-lg font-semibold text-gray-900">
											{currentSection.name.toLowerCase().includes("risk")
												? "⚠️ Cautionary"
												: currentSection.name.toLowerCase().includes("opportunity")
												? "✅ Positive"
												: "ℹ️ Neutral"}
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-600 mb-1">Length</p>
										<p className="text-lg font-semibold text-gray-900">
											{currentSection.charCount > 5000
												? "📚 Detailed"
												: "📄 Concise"}
										</p>
									</div>
								</div>
								<p className="text-sm text-gray-500 mt-4 italic">
									💡 Advanced sentiment analysis with FinBERT will be integrated in
									the next phase.
								</p>
							</div>

							{/* Key Topics (placeholder) */}
							<div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
								<h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
									🔑 Extracted Topics (Coming Soon)
								</h4>
								<p className="text-gray-600">
									This section will use LLM to extract key topics, entities, and
									themes from the narrative text.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

