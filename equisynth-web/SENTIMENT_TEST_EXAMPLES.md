# Sentiment & Tone Agent - Test Examples

Use these 5 examples to test different confidence levels, sentiments, and tones.

---

## Example 1: High Confidence + Positive Sentiment (Should score ~8-9/10)

**Expected:** High confidence (8-9/10), Positive sentiment (75-85%), Optimistic tone

```
We are confident that we will achieve our target of $500 million in revenue this quarter. We have exceeded our guidance in the past three quarters and we are committed to delivering strong results. Our AI strategy is generating exceptional momentum, with record-breaking customer acquisition. We believe this growth trajectory will continue throughout the fiscal year.
```

**Why this scores high:**
- "confident", "will achieve", "committed" (high certainty)
- "$500 million", "three quarters", "fiscal year" (high specificity)
- "exceeded", "exceptional", "record-breaking", "strong" (positive tone)
- No hedging language

---

## Example 2: Medium Confidence + Neutral Sentiment (Should score ~5-6/10)

**Expected:** Medium confidence (5-6/10), Neutral sentiment (45-55%), Cautious tone

```
We anticipate that revenue should grow in the coming quarters, likely in the range of 5% to 8%. We believe our current strategy positions us well, though we are monitoring market conditions closely. We hope to see improvement in our margins as we scale operations. However, we acknowledge that macroeconomic headwinds could impact our performance.
```

**Why this scores medium:**
- "anticipate", "should", "likely", "believe" (medium certainty - not "will")
- "5% to 8%" (some specificity - range, not exact)
- "improvement" but also "headwinds" (mixed tone)
- Acknowledges risks but no clear solutions

---

## Example 3: Low Confidence + Negative Sentiment (Should score ~2-3/10)

**Expected:** Low confidence (2-3/10), Negative sentiment (25-35%), Pessimistic tone

```
We might see some revenue growth, but it depends on various factors including macroeconomic conditions and competitive pressures. It's unclear how the market will respond to our new products. We are trying to navigate challenging headwinds, and there are concerns about supply chain disruptions. We'll have to wait and see how the next quarter unfolds.
```

**Why this scores low:**
- "might", "depends", "unclear", "trying", "wait and see" (low certainty)
- "some", "various", "unclear" (low specificity - no numbers)
- "challenging", "headwinds", "concerns" (negative tone)
- Avoids commitments, very vague

---

## Example 4: High Confidence + Negative Sentiment (Should score ~6-7/10)

**Expected:** Medium-High confidence (6-7/10), Negative sentiment (30-40%), Cautious tone

```
We are certain that we will face significant headwinds this quarter due to supply chain disruptions and regulatory changes. We have clearly identified the challenges and have implemented robust mitigation strategies. While we expect revenue to decline by approximately 15%, we are confident our cost reduction initiatives will preserve profitability. We have diversified our supplier base and strengthened our risk management framework.
```

**Why this scores medium-high confidence despite negative sentiment:**
- "certain", "clearly", "confident", "expect" (high certainty language)
- "15%" (specific number), "quarter" (specific timeframe)
- Acknowledges risks ("headwinds", "decline") BUT provides solutions ("mitigation", "diversified")
- Very specific and actionable - shows management competence

---

## Example 5: Extremely Vague + Neutral (Should score ~2-4/10)

**Expected:** Very low confidence (2-4/10), Neutral sentiment (45-55%), Cautious tone

```
We think things are looking okay, but there are many factors at play. We're hoping for some improvement over the next period. It's hard to say exactly what will happen, but we're working on it. There might be opportunities, but also some challenges ahead.
```

**Why this scores very low:**
- "think", "hoping", "hard to say", "might" (very low certainty)
- "some", "many", "okay" (extremely vague, no specifics)
- "might be opportunities... but also challenges" (neutral, hedging language)
- No concrete statements or commitments

---

## How to Test

1. Go to `/sentiment` page
2. Copy and paste each example one at a time
3. Click "Analyze Sentiment & Tone"
4. Compare results with expected scores above

## What to Look For

✅ **Example 1:** Should show HIGH confidence (8-9/10), POSITIVE sentiment (75-85%), OPTIMISTIC tone

✅ **Example 2:** Should show MEDIUM confidence (5-6/10), NEUTRAL sentiment (45-55%), CAUTIOUS tone

✅ **Example 3:** Should show LOW confidence (2-3/10), NEGATIVE sentiment (25-35%), PESSIMISTIC tone

✅ **Example 4:** Should show MEDIUM-HIGH confidence (6-7/10) despite negative sentiment, because of high certainty + specificity + risk acknowledgment

✅ **Example 5:** Should show VERY LOW confidence (2-4/10), NEUTRAL sentiment (45-55%), CAUTIOUS tone

---

## Notes

- These examples test different combinations of the 4 scoring factors:
  1. Certainty Language (high vs low confidence words)
  2. Specificity (exact numbers vs vague terms)
  3. Tone (positive vs negative vs neutral)
  4. Risk Acknowledgment (addresses risks with solutions vs avoids them)

- Real earnings transcripts will have more nuance, but these capture the core patterns.

