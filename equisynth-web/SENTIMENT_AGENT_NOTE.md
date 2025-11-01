# Important Note: Sentiment Agent vs Report Composer

## ⚠️ Output Difference Notice

**The Sentiment & Tone Agent and Report Composer Agent produce different outputs because they analyze different text sources.**

### Sentiment & Tone Agent (`/sentiment`)
- **Input:** User-provided text (paste your own text)
- **Output:** Quotes and confidence scores based on your input text
- **Use Case:** Testing, custom analysis, analyzing specific statements

### Report Composer Agent (`/report`)
- **Input:** Automatically extracted MD&A sections from SEC filings (via RAG)
- **Output:** Quotes and confidence scores from actual management commentary in the filing
- **Use Case:** Generating equity research reports from real SEC filing data

## Why Different Outputs?

1. **Different Text Sources:**
   - Sentiment Agent: Your pasted text
   - Report Composer: Real SEC filing MD&A chunks

2. **Different Quotes Shown:**
   - Sentiment Agent: Quotes from your input
   - Report Composer: Quotes from filing content (may include boilerplate/legal text)

3. **Different Confidence Scores:**
   - Because they analyze different quotes/text
   - Same sentence should have same score (consistent calculation)

## Expected Behavior

✅ **Different quotes** = Normal (different text sources)  
✅ **Different overall scores** = Normal (different content being analyzed)  
✅ **Same sentence = Same score** = Should be consistent (calculation is deterministic)

## Example

**Your Input:** "We think things are looking okay, but there are many factors at play..."

- **Sentiment Agent:** Shows quotes from your text with confidence scores
- **Report Composer:** Shows quotes from actual Apple SEC filing MD&A (not your text)

**Result:** Different quotes and scores (expected, because different text sources)

---

**This is expected behavior, not a bug.** The agents serve different purposes:
- Sentiment Agent = Custom text analysis
- Report Composer = Real filing analysis for reports

