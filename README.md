# Capital Desk

Capital Desk is a Phase 1 MVP for real estate investment deal management, investor CRM, AI-generated investment documents, investor matching, and deal pipeline tracking.

## Stack

- React, TypeScript, Tailwind CSS.
- Next.js (App Router), deployable to Vercel.
- SQLite/libsql-compatible relational database with Drizzle schema (local file by default, Turso for production).
- OpenAI Responses API integration through server routes.

## Local Setup

```bash
npm install
npm run dev
```

Optional configuration (`.env.local`):

```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4.1-mini

# Database (defaults to a local SQLite file if unset)
DATABASE_URL=file:./local.db
DATABASE_AUTH_TOKEN=
```

Without an API key, the app still produces structured editable investment documents using the local fallback generator.

## Deploying to Vercel

1. Push the project to a Git repository and import it in Vercel.
2. Set the `DATABASE_URL` (and `DATABASE_AUTH_TOKEN` if using Turso) environment variables in the Vercel project settings. A managed libsql/Turso database is recommended since Vercel's filesystem is ephemeral/read-only at runtime.
3. Optionally set `OPENAI_API_KEY` and `OPENAI_MODEL` for AI-generated documents.
4. Deploy — Vercel will run `npm run build` automatically.

## MVP Scope

- Dashboard.
- Project CRUD.
- Investor and partner CRM CRUD.
- Executive Summary generation in English and German.
- Investment Overview generation in English and German.
- Rule-based matching by asset class, geography, ticket size, risk profile, and notes.
- Project-contact pipeline tracking.
- Editable document versions.
- Word download and PDF print export.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run db:generate
```

Architecture notes live in `docs/architecture.md`.
