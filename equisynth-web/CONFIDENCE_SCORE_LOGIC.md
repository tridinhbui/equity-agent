# Confidence Score Calculation Logic

**File:** `app/lib/sentimentAnalyzer.ts`

## Formula

The confidence score (0-10) is calculated using this weighted formula:

```
Confidence = (Certainty × 40%) + (Specificity × 25%) + (Tone × 20%) + (RiskAck × 10%)
```

## 1. Certainty Language (0-4 scale, 40% weight)

**Location:** Lines 35-84 in `sentimentAnalyzer.ts`

### How it works:
Scans the text for specific word patterns:

**HIGH CONFIDENCE WORDS** (+2.5 points each):
- `will`, `expect`, `confident`, `certain`, `guarantee`, `committed`, `assured`, `definitely`, `absolutely`, `clearly`, `obviously`
- `achieved`, `delivered`, `exceeded`, `outperformed`
- Phrases: `we are certain`, `we will`, `we expect`, `we are confident`

**MEDIUM CONFIDENCE WORDS** (+0.75 points each):
- `should`, `likely`, `probably`, `anticipate`, `believe`, `hope`, `aim`, `target`
- Phrases: `we should`, `we likely`, `we anticipate`, `we believe`

**LOW CONFIDENCE WORDS** (-1.5 points each):
- `might`, `possibly`, `potentially`, `could`, `may`, `uncertain`, `unclear`, `hopefully`, `trying`, `working towards`
- Phrases: `we'll see`, `it depends`, `subject to`, `monitoring`, `hope`, `wish`

**Calculation:**
```
rawScore = (highCount × 2.5) + (mediumCount × 0.75) - (lowCount × 1.5)
```

**For short texts (< 20 words):**
```
Certainty = min(3.5, max(0, rawScore / 1.5))
```

**For longer texts:**
```
Certainty = min(4, max(0, rawScore / (textLength / 100)))
```

### Example:
Text: "We are confident we will achieve 10% revenue growth this quarter"
- `confident` → +2.5
- `will` → +2.5
- `achieve` → +2.5 (from "achieved" pattern)
- Total rawScore = 7.5
- For 9 words: Certainty = min(3.5, 7.5/1.5) = **3.5/4**

---

## 2. Specificity (0-2.5 scale, 25% weight)

**Location:** Lines 86-119 in `sentimentAnalyzer.ts`

### How it works:
Counts specific numbers, dates, and dollar amounts:

**High Specificity (2.5/2.5):**
- 2+ percentages OR 2+ dollar amounts OR (1 percentage + 1 date)

**Medium Specificity (1.25/2.5):**
- 1 percentage OR 1 dollar amount OR 1 date

**Low Specificity (-0.5):**
- 3+ vague terms: `some`, `several`, `various`, `many`, `few`, `improvement`, `better`, `growth`, `increase`

### Example:
Text: "We are confident we will achieve 10% revenue growth this quarter"
- Has 1 percentage (`10%`) → **Specificity = 1.25/2.5**

---

## 3. Tone Score (0-2 scale, 20% weight)

**Location:** Lines 121-161 in `sentimentAnalyzer.ts`

### How it works:
Counts positive vs negative emotional words:

**POSITIVE WORDS** (+1.5 each):
- `excited`, `thrilled`, `optimistic`, `confident`, `strong`, `excellent`, `outstanding`, `record`, `growth`, `momentum`, `opportunity`, `success`, `exceeded`, `beat`
- Phrases: `strong demand`, `strong momentum`, `record-breaking`, `exceptional`, `significant opportunities`

**NEGATIVE WORDS** (-1.5 each):
- `challenging`, `headwinds`, `uncertainty`, `caution`, `concern`, `worries`, `risks`, `difficult`, `struggling`, `decline`, `decrease`, `missed`, `shortfall`
- Phrases: `challenging environment`, `significant headwinds`, `uncertain outlook`, `concerns about`

**Calculation:**
```
toneScore = (positiveCount × 1.5) - (negativeCount × 1.5)
```

**Normalized to 0-2 scale:**
- For short texts: `normalized = max(-2, min(2, toneScore / max(2, textLength/10)))`
- Then shifted: `Tone = max(0, min(2, normalized + 2))`

### Example:
Text: "We are confident we will achieve 10% revenue growth this quarter"
- `confident` → +1.5
- `growth` → +1.5
- `achieve` → +1.5 (positive)
- Total toneScore = 4.5
- For 9 words: normalized = 4.5 / max(2, 9/10) = 4.5/2 = 2.25 → capped at 2
- Tone = max(0, min(2, 2.25 + 2 - 2)) = **2.0/2** (maxed out)

---

## 4. Risk Acknowledgment (0-1 scale, 10% weight)

**Location:** Lines 163-203 in `sentimentAnalyzer.ts`

### How it works:
Checks if management acknowledges risks AND provides solutions:

**HIGH (+1):** Risk mentioned + solution mentioned
- Pattern: `(risk|challenge) ... but ... (solution|mitigated|addressed)`

**MEDIUM (0):** Risk mentioned but no solution

**LOW (-1):** Avoids or deflects
- Phrases: `we'll see`, `it depends`, `cannot comment`, `no comment`

**Final score normalized to 0-1:**
```
RiskAck = max(0, min(1, rawScore + 1))
```

### Example:
Text: "We are confident we will achieve 10% revenue growth this quarter"
- No risk mentioned → **RiskAck = 0/1** (no penalty, but no bonus)

---

## Final Confidence Calculation

**Location:** Lines 345-358 in `sentimentAnalyzer.ts`

### Example Calculation:
Text: "We are confident we will achieve 10% revenue growth this quarter"

1. **Certainty:** 3.5/4 = 3.5
2. **Specificity:** 1.25/2.5 = 1.25
3. **Tone:** 2.0/2 = 2.0
4. **RiskAck:** 0/1 = 0 (normalized: max(0, 0+1) = 1.0, but since no risk mentioned, likely 0.5 default)

```
rawScore = (3.5 × 0.40) + (1.25 × 0.25) + (2.0 × 0.20) + (0.5 × 0.10)
         = 1.40 + 0.31 + 0.40 + 0.05
         = 2.16

Confidence = min(10, max(0, 2.16 / 1.0 × 10))
           = 21.6 (capped at 10)
           = 10.0/10 ❌ TOO HIGH!
```

## Problem Identified

The issue is in the normalization formula at line 358:

```typescript
const overall = Math.min(10, Math.max(0, (rawScore / 1.0) * 10));
```

This assumes `rawScore` should be in the 0-1 range, but it's actually in a 0-3+ range (since Certainty can be up to 3.5, and the weighted sum can exceed 1).

**The formula should be:**
Since the maximum possible rawScore is approximately:
- Certainty: 3.5 × 0.40 = 1.40
- Specificity: 2.5 × 0.25 = 0.625
- Tone: 2.0 × 0.20 = 0.40
- RiskAck: 1.0 × 0.10 = 0.10
- **Max total = ~2.525**

So we should divide by 2.525, not 1.0:

```typescript
const overall = Math.min(10, Math.max(0, (rawScore / 2.525) * 10));
```

Or better, since we want a 0-10 scale and rawScore maxes at ~2.5:
```typescript
const overall = Math.min(10, Math.max(0, rawScore * 4)); // 2.5 * 4 = 10
```

---

## Summary

The confidence score is **100% based on word patterns** - it doesn't use any ML/AI. It's a **rule-based pattern matching system** that:

1. Counts specific words (confidence indicators)
2. Counts numbers/dates (specificity)
3. Counts positive/negative words (tone)
4. Checks for risk acknowledgment patterns
5. Combines them with fixed weights
6. Normalizes to 0-10 scale

The bug causing 10/10 scores is the normalization divisor (`/1.0`) being too small.

