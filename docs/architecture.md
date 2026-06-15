# Capital Desk Architecture

## Product Requirements Summary

Capital Desk is an internal platform for real estate investment teams that manage projects, investors, partners, generated investment documents, matching, and deal pipeline status.

Phase 1 includes:

- Workspace authentication with local fallback.
- Dashboard with project, CRM, matching, and pipeline indicators.
- Project CRUD for core underwriting fields.
- Investor and partner CRM CRUD.
- Executive Summary generation in English and German.
- Investment Overview generation in English and German.
- Rule-based investor matching from structured fields.
- Deal status tracking per project and contact.
- Editable generated documents.
- Word download and browser PDF print export.

The schema already reserves the core entities needed for Phases 2 to 4 so document extraction, Google Drive, outreach, interactions, and analytics can be added without rebuilding the data model.

## Technical Architecture

- Frontend: React, TypeScript, Tailwind CSS, app router structure.
- Runtime: Next.js App Router, deployable to Vercel.
- Database: SQLite/libsql-compatible schema with Drizzle ORM (local file in development, Turso/libsql in production).
- Authentication: OpenAI workspace headers in production and a local demo identity in development.
- AI: Server-side OpenAI Responses API integration through `OPENAI_API_KEY`, with a structured fallback generator.
- Document exports: editable text area, `.doc` HTML download, and browser PDF print flow.
- Future file storage: external object storage (e.g. S3-compatible) for uploaded/generated files or Google Drive references depending on deployment choice.

## Database Schema

Core tables:

- `users`: authenticated internal users.
- `projects`: deal and underwriting data.
- `contacts`: investor, partner, advisor, and bank CRM records.
- `project_contacts`: project-specific relationship, match, NDA, and pipeline state.
- `generated_documents`: versioned AI output by project, type, and language.
- `interactions`: future-ready relationship history.

Important indexes:

- Project asset class and geography.
- Contact type and company.
- Project-contact project and contact lookups.
- Unique project-contact pair.
- Generated document project lookup.
- Interaction project/contact lookups.

## API Routes

- `GET /api/me`: current user from workspace headers or local fallback.
- `GET /api/projects`: list projects.
- `POST /api/projects`: create project.
- `PUT /api/projects`: update project.
- `GET /api/contacts`: list contacts.
- `POST /api/contacts`: create contact.
- `PUT /api/contacts`: update contact.
- `POST /api/matching`: calculate and persist project matches.
- `GET /api/project-contacts`: list pipeline rows.
- `POST /api/project-contacts`: create or update pipeline row.
- `GET /api/documents`: list generated document versions.
- `POST /api/documents`: save edited document version.
- `POST /api/documents/generate`: generate document through OpenAI or fallback.

## Folder Structure

- `app/`: pages, layout, global CSS, and API routes.
- `db/`: Drizzle schema and D1 bootstrap.
- `lib/`: shared types, constants, matching, serializers, API utilities, and document generation.
- `docs/`: architecture and implementation notes.
- `.openai/hosting.json`: Sites resource declarations.

## Development Roadmap

### Phase 1

- Implement current MVP with CRUD, document generation, matching, and pipeline tracking.
- Keep outputs editable before saving.
- Keep matching transparent and rule-based.

### Phase 2

- Add Google Drive folder links per project.
- Store upload/document references.
- Extract structured data from PDFs and Excel files.
- Detect missing project information for AI-assisted completion.

### Phase 3

- Add advanced matching signals.
- Generate personalized outreach emails in English and German.
- Add follow-up reminders, interaction history, NDA tracking, and data room status.

### Phase 4

- Add full Google Drive integration.
- Save generated documents automatically.
- Add email integration, campaign tracking, analytics, and multi-user roles.
