/**
 * Sentiment & Tone Analyzer
 * Analyzes management confidence, sentiment, and tone from earnings transcripts and financial text
 */

export interface SentimentResult {
	sentiment: 'positive' | 'neutral' | 'negative';
	sentimentScore: number; // 0-100, where 50 is neutral
	confidence: number; // 0-10
	tone: 'optimistic' | 'cautious' | 'pessimistic';
	keyQuotes: Array<{
		text: string;
		confidence: number;
		sentiment: 'positive' | 'neutral' | 'negative';
	}>;
	topics: string[];
}

export interface ConfidenceAnalysis {
	overall: number; // 0-10
	byTopic: Record<string, number>;
	certainty: number;
	specificity: number;
	toneScore: number;
	riskAcknowledgment: number;
	details: {
		highConfidenceQuotes: string[];
		lowConfidenceQuotes: string[];
	};
}

/**
 * Analyze certainty language patterns
 */
function analyzeCertaintyLanguage(text: string): number {
	const lowerText = text.toLowerCase();
	
	// High confidence indicators
	const highPatterns = [
		/\b(will|expect|confident|certain|guarantee|committed|assured|definitely|absolutely|clearly|obviously)\b/g,
		/\b(achieved|delivered|exceeded|outperformed)\b/g,
		/\b(we are certain|we will|we expect|we are confident)\b/g,
	];
	const highCount = highPatterns.reduce((count, pattern) => {
		const matches = lowerText.match(pattern);
		return count + (matches ? matches.length : 0);
	}, 0);
	
	// Medium confidence indicators
	const mediumPatterns = [
		/\b(should|likely|probably|anticipate|believe|hope|aim|target)\b/g,
		/\b(we should|we likely|we anticipate|we believe)\b/g,
	];
	const mediumCount = mediumPatterns.reduce((count, pattern) => {
		const matches = lowerText.match(pattern);
		return count + (matches ? matches.length : 0);
	}, 0);
	
	// Low confidence indicators
	const lowPatterns = [
		/\b(might|possibly|potentially|could|may|uncertain|unclear|hopefully|trying|working towards)\b/g,
		/\b(we'll see|it depends|subject to|monitoring|hope|wish)\b/g,
	];
	const lowCount = lowPatterns.reduce((count, pattern) => {
		const matches = lowerText.match(pattern);
		return count + (matches ? matches.length : 0);
	}, 0);
	
	// Calculate raw score
	const rawScore = (highCount * 2.5) + (mediumCount * 0.75) - (lowCount * 1.5);
	
	// Normalize to 0-4 scale (considering text length, with better handling for short texts)
	const textLength = text.split(/\s+/).length;
	// For very short texts (< 20 words), use a different normalization
	if (textLength < 20) {
		// Cap the score for short texts to prevent over-scoring
		const shortTextScore = Math.min(3.5, Math.max(0, rawScore / 1.5));
		return shortTextScore;
	}
	
	const normalizedScore = Math.min(4, Math.max(0, rawScore / Math.max(1, textLength / 100)));
	
	return normalizedScore;
}

/**
 * Analyze specificity level
 */
function analyzeSpecificity(text: string): number {
	const lowerText = text.toLowerCase();
	
	// Extract numbers with context
	const percentagePattern = /\d+\.?\d*\s*%/g;
	const dollarPattern = /\$[\d,]+(?:\.\d+)?\s*(?:billion|million|b|m)?/gi;
	const datePattern = /(?:Q[1-4]|quarter|month|year)\s*\d{4}/gi;
	
	const percentages = (text.match(percentagePattern) || []).length;
	const dollarAmounts = (text.match(dollarPattern) || []).length;
	const dates = (text.match(datePattern) || []).length;
	
	// High specificity: multiple specific numbers
	if (percentages >= 2 || dollarAmounts >= 2 || (percentages >= 1 && dates >= 1)) {
		return 2.5;
	}
	
	// Medium specificity: some numbers or ranges
	if (percentages >= 1 || dollarAmounts >= 1 || dates >= 1) {
		return 1.25;
	}
	
	// Low specificity: vague terms
	const vagueTerms = /\b(some|several|various|many|few|improvement|better|growth|increase)\b/gi;
	const vagueCount = (text.match(vagueTerms) || []).length;
	if (vagueCount >= 3) {
		return -0.5;
	}
	
	return 0;
}

/**
 * Analyze tone and emotional indicators
 */
function analyzeTone(text: string): number {
	const lowerText = text.toLowerCase();
	
	// Positive indicators
	const positivePatterns = [
		/\b(excited|thrilled|optimistic|confident|strong|excellent|outstanding|record|growth|momentum|opportunity|success|exceeded|beat)\b/g,
		/\b(strong demand|strong momentum|record-breaking|exceptional|significant opportunities)\b/g,
	];
	const positiveCount = positivePatterns.reduce((count, pattern) => {
		const matches = lowerText.match(pattern);
		return count + (matches ? matches.length : 0);
	}, 0);
	
	// Negative indicators
	const negativePatterns = [
		/\b(challenging|headwinds|uncertainty|caution|concern|worries|risks|difficult|struggling|decline|decrease|missed|shortfall)\b/g,
		/\b(challenging environment|significant headwinds|uncertain outlook|concerns about)\b/g,
	];
	const negativeCount = negativePatterns.reduce((count, pattern) => {
		const matches = lowerText.match(pattern);
		return count + (matches ? matches.length : 0);
	}, 0);
	
	// Calculate tone score
	const toneScore = (positiveCount * 1.5) - (negativeCount * 1.5);
	
	// Normalize to -2 to +2 range, then shift to 0-2
	// Better handling for short texts
	const textLength = text.split(/\s+/).length;
	let normalized;
	if (textLength < 20) {
		// For short texts, use a simpler normalization
		normalized = Math.max(-2, Math.min(2, toneScore / Math.max(2, textLength / 10)));
	} else {
		normalized = Math.max(-2, Math.min(2, toneScore / Math.max(1, textLength / 200)));
	}
	return Math.max(0, Math.min(2, normalized + 2)); // Shift to 0-2 scale, ensure it's capped at 2
}

/**
 * Analyze risk acknowledgment
 */
function analyzeRiskAcknowledgment(text: string): number {
	const lowerText = text.toLowerCase();
	
	// High: Acknowledges risks + provides solutions
	const highPatterns = [
		/\b(risk|challenge|headwind|concern)\b.*\b(but|however|although)\b.*\b(have|implemented|mitigated|diversified|addressed|solution)\b/g,
		/\b(while|although)\b.*\b(risk|uncertainty|challenge)\b.*\b(fundamentals|strong|position|advantage)\b/g,
	];
	const highCount = highPatterns.reduce((count, pattern) => {
		const matches = lowerText.match(pattern);
		return count + (matches ? matches.length : 0);
	}, 0);
	
	// Low: Avoids or deflects
	const lowPatterns = [
		/\b(we'll see|it depends|monitoring|hoping|trying)\b/g,
		/\b(cannot comment|no comment|not at liberty)\b/g,
	];
	const lowCount = lowPatterns.reduce((count, pattern) => {
		const matches = lowerText.match(pattern);
		return count + (matches ? matches.length : 0);
	}, 0);
	
	// Medium: Acknowledges but no solutions
	const riskMentioned = /\b(risk|challenge|headwind|uncertainty|concern|risk factors)\b/gi.test(text);
	const solutionMentioned = /\b(solution|mitigate|address|diversify|manage|handle)\b/gi.test(text);
	
	let score = 0;
	if (highCount > 0) {
		score = 1;
	} else if (lowCount > 0 && !riskMentioned) {
		score = -1;
	} else if (riskMentioned && !solutionMentioned) {
		score = 0; // Medium
	}
	
	return Math.max(-1, Math.min(1, score));
}

/**
 * Extract key quotes with confidence scores
 */
function extractKeyQuotes(text: string, minLength: number = 20): Array<{text: string; confidence: number; sentiment: 'positive' | 'neutral' | 'negative'}> {
	const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
	
	return sentences
		.filter(s => {
			const trimmed = s.trim();
			// Filter out very short sentences
			if (trimmed.length < minLength) return false;
			
			// Filter out section headers and boilerplate
			const lower = trimmed.toLowerCase();
			
			// Skip section headers (Item X, Part X, etc.) - more comprehensive patterns
			if (/^(item|part)\s+\d+[a-z]?\.?\s*$/i.test(trimmed)) return false;
			
			// Skip table of contents style entries
			if (/^(item|part)\s+\d+[a-z]?\s+[A-Z][^.!?]{0,50}$/.test(trimmed)) return false;
			
			// Skip common section header patterns that appear in 10-K filings
			if (/^(controls and procedures|other information|disclosure regarding|exhibits and financial|director independence|stockholder matters|principal account)/i.test(trimmed)) return false;
			
			// Skip lines that are just section titles without actual content (e.g., "Item 9B." followed by just the number)
			if (/^[A-Z][a-z\s]+(?:Item|Part)\s+\d+[a-z]?\.?\s*$/i.test(trimmed)) return false;
			
			// Skip if sentence is just a number or very short section identifier
			if (/^(item|part)\s+\d+[a-z]?\.?\s*[A-Z]?[a-z]*$/i.test(trimmed) && trimmed.length < 60) return false;
			
			// Skip legal boilerplate that starts with common patterns
			const boilerplatePatterns = [
				/^forward-looking statements/i,
				/forward-looking statements provide/i,
				/^security ownership of/i,
				/^certain relationships and/i,
				/^exhibits and financial/i,
				/^director independence/i,
				/^stockholder matters/i,
				/^principal account/i,
				/provide current expectations of future events/i,
				/does not directly relate to any historical/i,
				/many of the forward-looking statements/i,
				/statements in this form/i,
				/references to.*form.*10-k/i,
				/part\s+[ivx]+\s*,\s*item\s+\d+/i,
				/under the heading/i,
			];
			if (boilerplatePatterns.some(pattern => pattern.test(lower))) return false;
			
			// Skip sentences that are meta-references to the filing itself
			if (/(this\s+form\s+10-?k|form\s+10-?k|part\s+[ivx]+\s*,\s*item\s+\d+|under\s+the\s+heading)/i.test(lower) && 
				(/forward-looking|statement|disclaimer|caution/i.test(lower) || trimmed.length < 150)) {
				return false;
			}
			
			// Skip common legal disclaimers
			if (/assumes no obligation/i.test(lower)) return false;
			if (/except as required by law/i.test(lower)) return false;
			if (/unless otherwise stated/i.test(lower) && /fiscal calendar/i.test(lower)) return false;
			if (/references to particular years/i.test(lower)) return false;
			if (/exhibit and financial statement schedules/i.test(lower)) return false;
			if (/based on.*fiscal calendar/i.test(lower)) return false;
			
			// Skip sentences that are clearly legal definitions/disclaimers
			if (lower.includes('forward-looking') && lower.includes('expectations') && lower.includes('assumptions')) {
				return false;
			}
			
			// Skip sentences that are just numbers or single words
			if (/^[\d\s\.]+$/.test(trimmed)) return false;
			
			// Skip sentences that are primarily formatting/headers
			if (trimmed.split(/\s+/).length < 5 && /^[A-Z\s]+$/.test(trimmed)) return false;
			
			// Skip sentences that are clearly section headers (all caps, short, no verbs)
			const words = trimmed.split(/\s+/);
			if (words.length < 8 && words.every(w => /^[A-Z][a-z]*$/.test(w) || /^[A-Z]+$/.test(w))) {
				// Check if it contains verbs - if no verbs, likely a header
				const hasVerb = /(is|are|was|were|has|have|will|would|can|could|should|may|might|do|does|did|provide|includes|requires|refers|relates|describes|indicates|represents)/i.test(trimmed);
				if (!hasVerb) return false;
			}
			
			// Skip if sentence is just a section identifier followed by minimal text
			if (/^(item|part)\s+\d+[a-z]?\.?\s*[A-Z][a-z\s]{0,100}$/i.test(trimmed) && trimmed.length < 80) {
				return false;
			}
			
			return true;
		})
		.map(sentence => {
			const certainty = analyzeCertaintyLanguage(sentence);
			const specificity = analyzeSpecificity(sentence);
			const toneScore = analyzeTone(sentence);
			const riskAck = analyzeRiskAcknowledgment(sentence);
			
			const quoteConfidence = 
				(certainty * 0.40) +
				(specificity * 0.25) +
				(toneScore * 0.20) +
				((Math.max(0, riskAck + 1)) * 0.10);
			
			// Determine sentiment from tone
			const lowerSentence = sentence.toLowerCase();
			const positiveWords = (lowerSentence.match(/\b(excited|thrilled|strong|excellent|growth|success|beat|exceeded)\b/g) || []).length;
			const negativeWords = (lowerSentence.match(/\b(challenging|headwinds|concern|decline|missed|difficult)\b/g) || []).length;
			
			let sentiment: 'positive' | 'neutral' | 'negative';
			if (positiveWords > negativeWords) sentiment = 'positive';
			else if (negativeWords > positiveWords) sentiment = 'negative';
			else sentiment = 'neutral';
			
			return {
				text: sentence.trim(),
				confidence: Math.min(10, Math.max(0, quoteConfidence * 4)), // Same normalization as overall confidence
				sentiment,
			};
		})
		.filter(q => {
			// First, filter by confidence
			if (q.confidence < 2) return false;
			
			// Then, filter out quotes that are clearly boilerplate
			const text = q.text.toLowerCase();
			
			// Skip obvious legal disclaimers and procedural text
			if (/assumes no obligation/i.test(text)) return false;
			if (/except as required by law/i.test(text)) return false;
			if (/exhibit and financial statement schedules/i.test(text)) return false;
			if (/item\s+\d+[a-z]?\.?\s*$/i.test(q.text.trim())) return false;
			
			// Skip if it's ONLY talking about the filing itself (meta-text without business content)
			// But allow if it also has business discussion
			const isOnlyMetaText = /^(this form|these statements|such statements|the company assumes|unless otherwise stated.*fiscal calendar)/i.test(text);
			if (isOnlyMetaText) return false;
			
			// Allow quotes that have business/financial content OR action verbs (not requiring both)
			const hasActionVerb = /(expect|believe|anticipate|plan|strategy|focus|grow|expand|improve|increase|decrease|achieve|deliver|generate|create|develop|launch|introduce|invest|operate|manage|execute|will|should)/i.test(q.text);
			const hasBusinessContext = /(revenue|sales|income|profit|margin|growth|market|product|service|strategy|plan|outlook|forecast|guidance|performance|result|business|operating|cash|financial|earnings|customer|demand|supply|competitive|segment|company|we|our)/i.test(q.text);
			
			// Must have at least business context OR action verb (more lenient)
			// But if confidence is very low (< 3) and has neither, exclude it
			if (q.confidence < 3 && !hasActionVerb && !hasBusinessContext) {
				return false;
			}
			
			return true;
		})
		.sort((a, b) => b.confidence - a.confidence) // Sort by confidence
		.slice(0, 15); // Increased from 10 to 15 to have more candidates after filtering
}

/**
 * Calculate overall sentiment score (0-100, 50 is neutral)
 */
function calculateSentimentScore(text: string): number {
	const tone = analyzeTone(text);
	const lowerText = text.toLowerCase();
	
	// Count positive vs negative words
	// Only count STRONGLY positive/negative words, not neutral or vague ones
	const positiveWords = [
		'strong', 'growth', 'success', 'exceeded', 'beat', 'outperformed',
		'confident', 'optimistic', 'excited', 'thrilled', 'excellent', 'outstanding',
		'record', 'momentum', 'robust', 'exceptional', 'delivering', 'achieved', 'strong results',
	];
	const negativeWords = [
		'challenging', 'challenges', 'headwinds', 'concern', 'concerns', 'worries', 'risks', 'difficult',
		'decline', 'decreases', 'decreased', 'missed', 'shortfall', 'uncertainty', 'uncertain', 'caution',
		'disruptions', 'disruption', 'pressures', 'pressure', 'trying', 'navigate', 'unclear',
	];
	
	// Neutral/hedging words that should NOT be counted (these appear in vague statements)
	const neutralWords = [
		'okay', 'ok', 'maybe', 'might', 'perhaps', 'possibly', 'some', 'various', 'many', 'few',
		'think', 'believe', 'hope', 'hoping', 'hard to say', 'working on', 'looking',
	];
	
	// Calculate base sentiment (0-100 scale, 50 is neutral)
	const totalWords = text.split(/\s+/).length;
	
	let positiveCount = 0;
	let negativeCount = 0;
	let neutralCount = 0;
	
	positiveWords.forEach(word => {
		const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
		positiveCount += (lowerText.match(regex) || []).length;
	});
	
	negativeWords.forEach(word => {
		const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
		negativeCount += (lowerText.match(regex) || []).length;
	});
	
	// Count neutral/hedging words - if text has many of these, it's likely neutral regardless of other words
	neutralWords.forEach(word => {
		const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
		neutralCount += (lowerText.match(regex) || []).length;
	});
	
	// If there are many neutral words relative to total words, heavily weight toward neutral
	// This prevents vague texts from scoring extreme sentiment
	const neutralRatio = neutralCount / Math.max(1, totalWords);
	if (neutralRatio > 0.3) { // If >30% of words are hedging/neutral
		// Reduce net sentiment significantly - text is likely vague/neutral
		positiveCount *= 0.3;
		negativeCount *= 0.3;
	}
	
	// Calculate raw sentiment based on word counts
	// Use a more balanced approach that doesn't over-penalize for lack of words
	const netSentiment = positiveCount - negativeCount;
	
	// Normalize based on text length - but don't let short texts dominate
	let baseScore: number;
	if (totalWords < 20) {
		// For short texts, use word count directly with conservative scaling
		// Each net positive/negative word moves score by ~8 points (for 9-word text, max ~3 words difference = ~24 points)
		baseScore = 50 + (netSentiment * 8);
	} else if (totalWords < 50) {
		// Medium texts: scale by word density
		const wordDensity = netSentiment / (totalWords / 20); // Normalize to ~20 word baseline
		baseScore = 50 + (wordDensity * 8);
	} else {
		// Longer texts: scale by proportion
		const sentimentRatio = netSentiment / (totalWords / 50); // Normalize to ~50 word baseline
		baseScore = 50 + (sentimentRatio * 8);
	}
	
	// Adjust based on tone analysis (tone is 0-2, convert to -15 to +15 adjustment)
	// Tone should only moderate, not dominate
	const toneAdjustment = ((tone - 1) / 1) * 10; // Reduced to 10 to prevent overriding word sentiment
	
	const finalScore = baseScore + toneAdjustment;
	
	// Cap at reasonable bounds
	if (totalWords < 20) {
		// For short texts, allow wider range but still cap
		return Math.min(90, Math.max(10, finalScore));
	}
	
	return Math.min(95, Math.max(5, finalScore));
}

/**
 * Classify tone
 */
function classifyTone(text: string, sentimentScore: number): 'optimistic' | 'cautious' | 'pessimistic' {
	if (sentimentScore >= 65) return 'optimistic';
	if (sentimentScore <= 35) return 'pessimistic';
	return 'cautious';
}

/**
 * Extract topics/themes from text
 */
function extractTopics(text: string): string[] {
	const topics: string[] = [];
	const lowerText = text.toLowerCase();
	
	// Financial topics
	if (lowerText.includes('revenue') || lowerText.includes('sales')) topics.push('Revenue');
	if (lowerText.includes('margin') || lowerText.includes('profitability')) topics.push('Profitability');
	if (lowerText.includes('cash flow') || lowerText.includes('fcf')) topics.push('Cash Flow');
	if (lowerText.includes('guidance') || lowerText.includes('outlook')) topics.push('Guidance');
	
	// Strategic topics
	if (lowerText.includes('ai') || lowerText.includes('artificial intelligence')) topics.push('AI Strategy');
	if (lowerText.includes('services') || lowerText.includes('subscription')) topics.push('Services');
	if (lowerText.includes('product') || lowerText.includes('device')) topics.push('Products');
	if (lowerText.includes('market share') || lowerText.includes('competitive')) topics.push('Competition');
	
	// Risk topics
	if (lowerText.includes('supply chain')) topics.push('Supply Chain');
	if (lowerText.includes('regulation') || lowerText.includes('regulatory')) topics.push('Regulatory');
	if (lowerText.includes('macro') || lowerText.includes('economic')) topics.push('Macro Economy');
	
	return topics;
}

/**
 * Analyze confidence from text
 */
export function analyzeConfidence(text: string): ConfidenceAnalysis {
	const certainty = analyzeCertaintyLanguage(text);
	const specificity = analyzeSpecificity(text);
	const toneScore = analyzeTone(text);
	const riskAck = analyzeRiskAcknowledgment(text);
	
	// Calculate overall confidence
	const rawScore = 
		(certainty * 0.40) +
		(specificity * 0.25) +
		(toneScore * 0.20) +
		(Math.max(0, riskAck + 1) * 0.10);
	
	// Maximum possible rawScore is approximately:
	// Certainty max: 3.5 × 0.40 = 1.40
	// Specificity max: 2.5 × 0.25 = 0.625
	// Tone max: 2.0 × 0.20 = 0.40
	// RiskAck max: 1.0 × 0.10 = 0.10
	// Total max ≈ 2.525
	// So we normalize by multiplying by ~4 to get 0-10 scale
	// But ensure minimum is 0.5 (very low confidence), not 0, because even vague statements show SOME confidence
	const overall = Math.min(10, Math.max(0.5, rawScore * 4));
	
	// Extract quotes
	const quotes = extractKeyQuotes(text);
	const highConfidenceQuotes = quotes.filter(q => q.confidence >= 7).map(q => q.text);
	const lowConfidenceQuotes = quotes.filter(q => q.confidence <= 4).map(q => q.text);
	
	return {
		overall,
		byTopic: {}, // Can be enhanced with topic-specific analysis
		certainty,
		specificity,
		toneScore,
		riskAcknowledgment: Math.max(0, riskAck + 1), // Normalize to 0-1
		details: {
			highConfidenceQuotes,
			lowConfidenceQuotes,
		},
	};
}

/**
 * Analyze sentiment from text
 */
export function analyzeSentiment(text: string): SentimentResult {
	const sentimentScore = calculateSentimentScore(text);
	const tone = classifyTone(text, sentimentScore);
	const confidence = analyzeConfidence(text);
	const keyQuotes = extractKeyQuotes(text);
	const topics = extractTopics(text);
	
	let sentiment: 'positive' | 'neutral' | 'negative';
	if (sentimentScore >= 60) sentiment = 'positive';
	else if (sentimentScore <= 40) sentiment = 'negative';
	else sentiment = 'neutral';
	
	return {
		sentiment,
		sentimentScore,
		confidence: confidence.overall,
		tone,
		keyQuotes,
		topics,
	};
}

/**
 * Analyze multiple texts (e.g., from earnings call Q&A)
 */
export function analyzeBatch(texts: string[]): {
	overall: SentimentResult;
	byStatement: Array<SentimentResult & { text: string }>;
	averages: {
		sentimentScore: number;
		confidence: number;
	};
} {
	const results = texts.map(text => ({
		...analyzeSentiment(text),
		text,
	}));
	
	const avgSentiment = results.reduce((sum, r) => sum + r.sentimentScore, 0) / results.length;
	const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
	
	// Combine all texts for overall analysis
	const combinedText = texts.join(' ');
	const overall = analyzeSentiment(combinedText);
	
	return {
		overall,
		byStatement: results,
		averages: {
			sentimentScore: avgSentiment,
			confidence: avgConfidence,
		},
	};
}

