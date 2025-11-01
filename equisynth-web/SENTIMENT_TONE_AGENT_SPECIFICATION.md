# Sentiment & Tone Agent - Specification

## Confidence Score Methodology

### **What is Confidence Score?**

A 0-10 numerical score representing management's confidence level in forward-looking statements, based on linguistic analysis of earnings calls, transcripts, and management commentary.

---

## **Confidence Scoring Criteria**

### **1. Certainty Language Patterns (Weight: 40%)**

**High Confidence Indicators (Score: +2 to +3 each):**
- Direct commitment words: "will", "expect", "confident", "certain", "guarantee"
- Specific numerical targets: "8-10% growth", "$50B revenue target"
- Strong affirmative: "absolutely", "definitely", "clearly"
- Past-tense commitment: "we achieved", "we delivered"

**Examples:**
- "We **will** exceed our revenue targets" → +3
- "We **expect** 10% growth this quarter" → +2
- "We are **confident** in our guidance" → +2

**Medium Confidence Indicators (Score: +0.5 to +1 each):**
- Conditional language: "should", "likely", "probably", "anticipate"
- General statements: "we believe", "we hope", "we aim"

**Examples:**
- "We **should** meet our targets" → +1
- "We **anticipate** continued growth" → +0.5

**Low Confidence Indicators (Score: -1 to -2 each):**
- Uncertainty words: "might", "possibly", "potentially", "could"
- Vague terms: "hope", "trying", "working towards"
- Defensive language: "we'll see", "it depends", "subject to"

**Examples:**
- "We **might** see some improvement" → -2
- "We're **hoping** for better results" → -1

**Scoring Formula:**
```
Certainty Score = (High indicators × 2.5) + (Medium indicators × 0.75) - (Low indicators × 1.5)
Normalized to 0-4 scale
```

---

### **2. Specificity Level (Weight: 25%)**

**High Specificity (+2.5 points):**
- Exact numbers: "10.5% growth", "$52.3 billion revenue"
- Time-bound commitments: "by Q2 2025", "in the next 6 months"
- Detailed breakdowns: "Services will grow 15%, Products 5%"

**Medium Specificity (+1.25 points):**
- Ranges: "8-10% growth", "mid-single digits"
- General timeframes: "this year", "next quarter"

**Low Specificity (-0.5 points):**
- Vague statements: "some growth", "improvements expected"
- No numbers: "better than last year", "strong performance"

**Scoring Formula:**
```
Specificity Score = (High × 2.5) + (Medium × 1.25) - (Low × 0.5)
Normalized to 0-2.5 scale
```

---

### **3. Tone & Emotional Indicators (Weight: 20%)**

**Positive Tone Indicators (+1 to +2 each):**
- Enthusiasm: "excited", "thrilled", "optimistic", "strong momentum"
- Success language: "exceeded", "outperformed", "record-breaking"
- Future optimism: "significant opportunities", "strong pipeline"

**Neutral Tone (0 points):**
- Factual statements: "revenue was X", "we are monitoring Y"

**Negative Tone Indicators (-1 to -2 each):**
- Concern language: "challenging", "headwinds", "uncertainty", "caution"
- Defensive: "we're doing our best", "trying to navigate"
- Pessimism: "concerns", "worries", "risks"

**Scoring Formula:**
```
Tone Score = (Positive indicators × 1.5) - (Negative indicators × 1.5)
Normalized to 0-2 scale (can go negative, then adjusted)
```

---

### **4. Risk Acknowledgment (Weight: 10%)**

**High Confidence (+1 point):**
- Acknowledges risks but provides mitigation: "We face supply chain risks, but have diversified suppliers"
- Balanced transparency: "While macro is uncertain, our fundamentals remain strong"

**Medium Confidence (0 points):**
- Acknowledges risks without solutions: "We're monitoring risks"
- Generic statements: "Subject to market conditions"

**Low Confidence (-1 point):**
- Avoids discussing risks: Deflects questions, gives non-answers
- Overly cautious: "Many risks could impact results"

**Scoring Formula:**
```
Risk Score = High acknowledgment +1, Medium 0, Low -1
Normalized to 0-1 scale
```

---

### **5. Historical Consistency Track Record (Weight: 5%)**

**Note:** This requires tracking over time (can be added in Phase 2)

**High Confidence (+0.5 points):**
- Management consistently beats guidance
- Track record of accurate forecasts

**Low Confidence (-0.5 points):**
- Frequently misses guidance
- Track record of overly optimistic projections

**Scoring Formula:**
```
Consistency Score = (Beat rate - Miss rate) / 2
Normalized to 0-0.5 scale
```

---

## **Final Confidence Score Calculation**

### **Formula:**
```
Final Confidence Score = 
    (Certainty Score × 0.40) +
    (Specificity Score × 0.25) +
    (Tone Score × 0.20) +
    (Risk Acknowledgment × 0.10) +
    (Consistency Score × 0.05)

Then normalize to 0-10 scale
```

### **Interpretation:**

| Score | Level | Interpretation |
|-------|-------|----------------|
| 8-10 | Very High | Strong, specific commitments with positive tone |
| 6-7.9 | High | Clear expectations with moderate certainty |
| 4-5.9 | Medium | Conditional statements, some uncertainty |
| 2-3.9 | Low | Vague language, significant uncertainty |
| 0-1.9 | Very Low | Highly uncertain, defensive or evasive |

---

## **Implementation Approach**

### **Phase 1 (Current): Rule-Based Scoring**

1. **Text Preprocessing:**
   - Clean transcript text (remove timestamps, speaker labels)
   - Extract management statements (filter analyst questions)
   - Segment into statements/sentences

2. **Pattern Matching:**
   - Regex patterns for certainty words
   - Number extraction for specificity
   - Sentiment keyword matching for tone

3. **Scoring Algorithm:**
   ```typescript
   function calculateConfidenceScore(text: string): number {
       const certainty = analyzeCertaintyLanguage(text);      // 0-4
       const specificity = analyzeSpecificity(text);           // 0-2.5
       const tone = analyzeTone(text);                         // -2 to +2
       const riskAck = analyzeRiskAcknowledgment(text);        // -1 to +1
       
       const rawScore = 
           (certainty * 0.40) +
           (specificity * 0.25) +
           (Math.max(0, tone + 2) * 0.20) + // Normalize tone to 0-2
           (Math.max(0, riskAck + 1) * 0.10) + // Normalize risk to 0-1
           0; // Consistency (Phase 2)
       
       // Normalize to 0-10
       return Math.min(10, Math.max(0, (rawScore / 1.0) * 10));
   }
   ```

### **Phase 2 (Future): ML-Based Enhancement**

- Use local FinBERT model for sentiment classification
- Train on earnings call transcripts
- Combine rule-based + ML predictions
- Add historical accuracy tracking

---

## **Example Scoring**

### **Example 1: High Confidence (Score: 8.5/10)**

**Statement:**
> "We are confident that we will achieve 10% revenue growth in Q2, driven by strong demand across all segments. Our order book is at record levels, and we've already secured 70% of our Q2 target."

**Analysis:**
- Certainty: "confident", "will achieve" → +3 (+2.5)
- Specificity: "10%", "Q2", "70%" → +2.5
- Tone: "confident", "strong demand", "record levels" → +2
- Risk: Not addressed but positive context → +0.5

**Calculation:**
```
(2.5 × 0.40) + (2.5 × 0.25) + (2.0 × 0.20) + (0.5 × 0.10) = 1.0 + 0.625 + 0.4 + 0.05 = 2.075
Normalized: (2.075 / 2.075) × 10 = 8.5/10
```

### **Example 2: Low Confidence (Score: 3.2/10)**

**Statement:**
> "We hope to see some improvement next quarter, though there are many variables that could impact results. We're monitoring the situation closely."

**Analysis:**
- Certainty: "hope", "could impact" → -2 (-1.5)
- Specificity: "some improvement", "next quarter" (vague) → -0.5
- Tone: "hope", "variables", "monitoring" → -1
- Risk: Acknowledged but no mitigation → 0

**Calculation:**
```
(-1.5 × 0.40) + (-0.5 × 0.25) + (1.0 × 0.20) + (0 × 0.10) = -0.6 - 0.125 + 0.2 + 0 = -0.525
Adjusted: max(0, -0.525 + 1.0) = 0.475
Normalized: (0.475 / 1.5) × 10 = 3.2/10
```

---

## **Output Metrics for Report**

The Sentiment & Tone Agent will produce:

1. **Overall Confidence Score:** 0-10
2. **Confidence by Topic:**
   - Revenue Guidance: 8.5/10
   - Margin Outlook: 7.0/10
   - AI Strategy: 5.5/10
3. **Key Quotes with Confidence:**
   - "We will exceed targets" (Confidence: 9/10)
   - "We hope for improvement" (Confidence: 4/10)
4. **Confidence Trend:** vs. previous quarters
5. **Sentiment Score:** Positive/Neutral/Negative (0-100)
6. **Tone Classification:** Optimistic/Cautious/Pessimistic

---

## **Data Sources**

1. **Earnings Call Transcripts:**
   - SeekingAlpha, Earnings transcripts from SEC filings
   - Extract Q&A sections (management responses)

2. **Management Commentary:**
   - MD&A sections from 10-K/10-Q
   - CEO letters, investor presentations

3. **News Articles (Future):**
   - Financial news sentiment
   - Analyst commentary sentiment

---

**Status:** Specification Complete - Ready for Implementation

