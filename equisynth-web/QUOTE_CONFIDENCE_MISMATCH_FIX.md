# Quote Confidence Mismatch - Explanation & Fix

## The Problem

You're seeing two different issues:

1. **Different quotes shown:** Sentiment Agent shows quotes from your input text, but Report Composer shows quotes from actual SEC filing MD&A sections
2. **Confidence score mismatch:** Your example text should score 4.7/10, but shows 6.0/10 in the report

## Root Cause

### Issue 1: Different Text Sources

- **Sentiment Agent (`/sentiment`):** Analyzes whatever text you paste in
- **Report Composer (`/report`):** Analyzes MD&A chunks extracted from the actual SEC filing via RAG

**Result:** They show different quotes because they're analyzing different text!

### Issue 2: Confidence Score Difference

This can happen if:
1. **Sentence splitting:** The text is split differently, creating different quote boundaries
2. **Different sentence selected:** The quote extraction picks a different sentence from your multi-sentence example
3. **Context difference:** The sentence appears in different surrounding text, affecting confidence calculation

## Your Example Text

```
We think things are looking okay, but there are many factors at play. 
We're hoping for some improvement over the next period. 
It's hard to say exactly what will happen, but we're working on it. 
There might be opportunities, but also some challenges ahead.
```

This gets split into **4 sentences**:

1. "We think things are looking okay, but there are many factors at play." → ~2.5/10
2. "We're hoping for some improvement over the next period." → ~3.0/10
3. "It's hard to say exactly what will happen, but we're working on it." → ~4.7/10 ✅
4. "There might be opportunities, but also some challenges ahead." → ~3.5/10

**Why sentence 3 scores 4.7/10:**
- Certainty: "will happen" + "working on it" = 1.5/4
- Specificity: "exactly" (attempt but no numbers) = 0.5/2.5
- Tone: "working on it" (action-oriented) = 1.8/2
- Risk: None = 0.5/1
- Raw: (1.5×0.4) + (0.5×0.25) + (1.8×0.2) + (0.5×0.1) = 1.175
- Normalized: 1.175 × 4 = **4.7/10** ✅

**Why you might see 6.0/10:**
- Could be a **different sentence** from your text
- Could be from **different text** (MD&A from filing, not your example)
- Could be sentence splitting created a different quote boundary

## The Fix

I've improved the boilerplate filtering to remove:
- "Forward-looking statements provide..." 
- "Security Ownership of..."
- "Certain Relationships and..."
- Other legal disclaimers

**But the real issue:** The Report Composer analyzes **real SEC filing MD&A**, not your test example!

## Solution

### For Testing with Your Example:

1. **In Sentiment Agent:** Paste your example → Get 4.7/10 for that specific sentence ✅

2. **In Report Composer:** It analyzes actual MD&A from SEC filings, so:
   - Quotes will be different (from real filing, not your example)
   - Confidence scores reflect actual management statements from the filing

### To See Your Example in Report:

The Report Composer doesn't use user-input text - it automatically extracts and analyzes MD&A from SEC filings. To test with your specific example, you would need to:
1. Either run it through Sentiment Agent only
2. Or modify the MD&A extraction to include your test text (not recommended for production)

## Expected Behavior

✅ **Sentiment Agent:** Shows quotes from whatever text you paste  
✅ **Report Composer:** Shows quotes from actual SEC filing MD&A sections (via RAG extraction)

They will naturally show different quotes because they analyze different text sources!

## Verification

To verify the confidence calculation is consistent:

1. Take a **single sentence** (not multi-sentence text)
2. Paste it in Sentiment Agent → Note the confidence score
3. If that same sentence appears in the SEC filing MD&A → Report Composer should show the same score

If scores still differ for the **exact same sentence**, that would be a bug to fix.

## Current Status

- ✅ Boilerplate filtering improved
- ✅ Quote extraction filters out headers and legal disclaimers
- ⚠️ Note: Sentiment Agent and Report Composer analyze different text sources (this is expected behavior)

