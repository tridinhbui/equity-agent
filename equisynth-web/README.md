# EquiSynth

EquiSynth is a Next.js web app that provides a multi‑agent equity research copilot.

## Getting Started

1. Create a `.env.local` in `equisynth-web/` with the following:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-strong-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

2. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

3. Configure Google OAuth (console.cloud.google.com):
- Create OAuth Client ID (Web).
- Authorized JavaScript origin: `http://localhost:3000`.
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.

## Features
- Google Sign‑In powered by NextAuth.
- Minimal header with brand and session state.
- Tailwind CSS and App Router.

## Branding
- App name: EquiSynth
- Logo: `public/equisynth-logo.svg`
