# Sentiment Score - Summary

## What is Sentiment Score?

**Sentiment Score (0-100, 50 is neutral)** measures the **emotional tone and positivity/negativity** of management's language.

### Purpose:
- Answers: "Is management optimistic or pessimistic about their outlook?"
- Helps investors understand: Are they talking about growth/opportunities (positive) or challenges/risks (negative)?
- Different from Confidence: Sentiment is about **feeling/tone**, Confidence is about **certainty/certainty level**

### Example:
- **High Sentiment (75-85%):** "We are excited about strong growth opportunities and record-breaking performance"
- **Neutral Sentiment (45-55%):** "We anticipate moderate growth with some headwinds ahead"
- **Low Sentiment (15-35%):** "We face challenging conditions and significant headwinds"

---

## How It's Calculated

**File:** `app/lib/sentimentAnalyzer.ts` - Function: `calculateSentimentScore()` (Lines 249-313)

### Formula:

```
Sentiment = Base Score (word-based) + Tone Adjustment
```

### Step 1: Count Positive vs Negative Words

**Positive Words** (counted as +1 each):
- Strong positive: `strong`, `growth`, `success`, `exceeded`, `beat`, `confident`, `optimistic`, `excited`, `excellent`, `outstanding`, `record`, `momentum`, `robust`, `exceptional`, `delivering`, `achieved`

**Negative Words** (counted as -1 each):
- Strong negative: `challenging`, `challenges`, `headwinds`, `concern`, `concerns`, `worries`, `risks`, `difficult`, `decline`, `missed`, `shortfall`, `uncertainty`, `disruptions`, `pressures`, `trying`, `navigate`, `unclear`

### Step 2: Detect Neutral/Hedging Language

**Neutral Words** (don't count as positive or negative, but indicate vagueness):
- `okay`, `maybe`, `might`, `perhaps`, `possibly`, `some`, `various`, `many`, `think`, `believe`, `hope`, `hoping`, `hard to say`, `working on`, `looking`

**Key Logic:**
- If >30% of words are neutral/hedging → reduce positive/negative word weights by 70%
- This prevents vague texts from scoring extreme sentiment
- Example: "We think things are okay, but there are many factors" → neutral, not 95% positive

### Step 3: Calculate Base Score (50 = neutral)

```
netSentiment = positiveCount - negativeCount

For short texts (< 20 words):
  baseScore = 50 + (netSentiment × 8)

For medium texts (20-50 words):
  baseScore = 50 + (netSentiment / (textLength/20) × 8)

For long texts (> 50 words):
  baseScore = 50 + (netSentiment / (textLength/50) × 8)
```

**Scaling Factor (8):** Each net positive/negative word moves score by ~8 points from neutral (50).

### Step 4: Adjust with Tone Analysis

**Tone Score** (0-2 scale) from `analyzeTone()`:
- Analyzes emotional patterns: positive phrases, negative phrases
- Normalized to 0-2 scale

```
toneAdjustment = ((tone - 1) / 1) × 10
```

This adds ±10 points maximum to moderate the base score.

### Step 5: Final Normalization

```
finalScore = baseScore + toneAdjustment

Capped at:
  - Short texts: 10-90 (wider range)
  - Longer texts: 5-95
```

---

## Key Design Decisions

### 1. **Word-Based First, Tone Second**
- Primary signal: Actual positive/negative words
- Tone adjustment is a **moderator**, not the main driver
- Prevents tone analysis from overriding actual word sentiment

### 2. **Neutral Word Detection**
- Detects hedging language (`might`, `think`, `hoping`)
- If text is >30% hedging → heavily reduces sentiment weight
- **Why:** Vague texts like "We think things might be okay" shouldn't score 95% positive

### 3. **Length-Normalized**
- Short texts: More aggressive scaling (each word matters more)
- Longer texts: Proportional scaling (sentiment distributed across text)
- **Why:** A single positive word in a 10-word sentence is more significant than 1 positive word in a 200-word paragraph

### 4. **Caps to Prevent Extremes**
- Minimum: 5-10% (very negative)
- Maximum: 90-95% (very positive)
- **Why:** Real management commentary rarely reaches 0% or 100% sentiment

---

## Example Walkthrough

### Example 3: Low Confidence + Negative Sentiment

**Text:** "We might see some revenue growth, but it depends on various factors including macroeconomic conditions and competitive pressures. It's unclear how the market will respond to our new products. We are trying to navigate challenging headwinds, and there are concerns about supply chain disruptions."

**Step 1: Count Words**
- Positive: `growth` (1)
- Negative: `challenging`, `headwinds`, `concerns`, `disruptions`, `trying`, `navigate`, `unclear` (7)
- Neutral: `might`, `some`, `depends`, `various`, `think`, `unclear` (6+)

**Step 2: Neutral Detection**
- Total words: ~50
- Neutral ratio: 6/50 = 12% (< 30%, so no reduction)

**Step 3: Base Score**
- netSentiment = 1 - 7 = -6
- Medium text → baseScore = 50 + (-6 / (50/20)) × 8 = 50 + (-2.4) × 8 = 50 - 19.2 = **30.8**

**Step 4: Tone Adjustment**
- Tone score likely ~0.5 (pessimistic)
- toneAdjustment = (0.5 - 1) × 10 = -5
- finalScore = 30.8 - 5 = **25.8%** ✅

**Result: ~26% sentiment** (Negative, as expected)

---

## Comparison: Sentiment vs Confidence

| Aspect | **Sentiment Score** | **Confidence Score** |
|--------|-------------------|---------------------|
| **Measures** | Emotional tone (optimistic/pessimistic) | Certainty level (how sure they are) |
| **Range** | 0-100 (50 = neutral) | 0-10 |
| **Based On** | Positive/negative words + tone | Certainty language + specificity + risk acknowledgment |
| **Answers** | "Are they talking about opportunities or challenges?" | "How certain are they about their statements?" |
| **Example** | "We face challenging headwinds" → Low sentiment (negative tone) | "We might see growth, depending on factors" → Low confidence (uncertain) |

### Can Have Different Combinations:
- **High Confidence + Low Sentiment:** "We are certain revenue will decline 15%"
  - Confidence: 8/10 (very certain)
  - Sentiment: 30% (negative)
  
- **Low Confidence + High Sentiment:** "We think things might be great!"
  - Confidence: 3/10 (uncertain)
  - Sentiment: 75% (positive)

---

## Why This Matters for Investors

1. **Sentiment Trends:** Track sentiment across quarters - declining sentiment may indicate concerns
2. **Sentiment vs Reality:** If sentiment is high but fundamentals weak → potential disconnect
3. **Risk Assessment:** Low sentiment + low confidence = warning sign
4. **Management Tone:** Consistent negative sentiment may indicate management is being cautious or facing real challenges

---

## Technical Implementation Notes

**File:** `app/lib/sentimentAnalyzer.ts`
- **Function:** `calculateSentimentScore(text: string): number` (Lines 249-313)
- **Dependencies:** `analyzeTone()` for tone adjustment
- **Output:** Number between 5-95 (capped), typically 20-80 for realistic text

**Integration:**
- Used in `analyzeSentiment()` → included in API response
- Displayed in Sentiment & Tone Agent UI (`/sentiment`)
- Included in Report Composer Agent for management commentary analysis

---

## Summary

**Sentiment Score = How positive or negative management sounds**

- **High (70-90%):** Optimistic, talking about growth, opportunities, success
- **Neutral (40-60%):** Balanced, mixed signals, neither strongly positive nor negative
- **Low (10-30%):** Pessimistic, talking about challenges, headwinds, concerns

**Implementation:** Word counting + neutral detection + tone moderation + length normalization

This helps investors understand the **emotional context** of management's communications, separate from how **certain** they sound.

