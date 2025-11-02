# EquiSynth

EquiSynth is a Next.js web app that provides a multi‑agent equity research copilot.

## Getting Started

1. `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-strong-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
SEC_USER_AGENT=EquiSynth (your_email@example.com)
ALPHAVANTAGE_API_KEY=your-alphavantage-api-key
FINNHUB_API_KEY=your-finnhub-api-key
DATABASE_URL=postgresql://user:password@localhost:5432/equisynth
```

**Getting API Keys:**
- Google OAuth: [Google Cloud Console](https://console.cloud.google.com/)
- AlphaVantage (free): [Get API Key](https://www.alphavantage.co/support/#api-key)
- **Finnhub (free, 60 calls/min)**: [Register here](https://finnhub.io/register) - for real-time stock quotes

**Database (Optional):**
- Without `DATABASE_URL`: App uses file-based storage (works fine for development)
- With Postgres: Enables filing metadata tracking, metrics storage, and better scaling
- To initialize database: `POST /api/db/init` after setting DATABASE_URL

2. Install deps and run:
```bash
npm install
npm run dev
```

## Retrieval (local embeddings)
- We use `@xenova/transformers` (JS-only), model `Xenova/all-MiniLM-L6-v2`.
- No OpenAI key needed. Embeddings are saved to `embeddings.json` beside chunks.

Workflow:
1) Fetch filing → Download & parse → Section + chunk
2) Embed (local) → Ask (semantic search)

## Output tree
```
/data/{TICKER}/{FORM}_{FILED}/
  raw.html|raw.txt|raw.bin
  text.txt
  tables.json
  sections.json
  chunks.jsonl
  embeddings.json
```

Chunk metadata example:
```json
{
  "text": "...",
  "metadata": {
    "ticker": "AAPL",
    "form": "10-K",
    "filed": "2024-11-01",
    "section": "Risk Factors",
    "char_start": 123456,
    "char_end": 125321
  }
}
```

## Branding
- App name: EquiSynth
