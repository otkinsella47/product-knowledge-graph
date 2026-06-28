# Product Knowledge Graph

Product Knowledge Graph helps teams improve product decisions through explainable knowledge lineage.

The project explores how product knowledge can be captured as connected concepts rather than isolated documents. The aim is to make the reasoning behind product decisions easier to trace, explain and reuse.

## Current focus

The current version is focused on proving the core workflow:

- capture product knowledge as connected entities
- preserve the relationships between research, insights, opportunities, solutions, experiments, decisions and outcomes
- trace decisions back to the knowledge that informed them
- trace outcomes back to the decisions and assumptions that led to them
- create a foundation for AI reasoning over connected product context

## Documentation

Project context is kept in `docs/`.

Recommended reading order:

1. `PRODUCT_VISION.md`
2. `PROJECT_OVERVIEW.md`
3. `DOMAIN_MODEL.md`
4. `ARCHITECTURE.md`
5. `ROADMAP.md`
6. `DECISIONS.md`
7. `PRINCIPLES.md`
8. `USER_PERSONAS.md`
9. `AGENT_GUIDE.md`

Personal AI workflow files belong in `.ai-private/` and should not be committed.

## Local Persistence

Phase 5 adds thin graph API routes to the Vite dev server. To use persisted
data locally:

1. Create a Postgres database.
2. Apply `db/schema.sql`.
3. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
4. Run `npm run dev`.

The Phase 5 alpha uses an anonymous httpOnly browser cookie to separate
workspaces. This is a lightweight testing boundary, not authentication or
permissioning. Clearing browser cookies creates a new anonymous workspace.

## Deployed Persistence

The hosted alpha expects graph API routes to run server-side. On Vercel, set
`DATABASE_URL` as an environment variable and apply `db/schema.sql` to that
database before using the app.

If `DATABASE_URL` is missing, or if the schema has not been applied, `/api/*`
graph routes return a diagnostic error instead of silently falling back to
browser-only storage. This preserves the Phase 5 persistence model while making
deployment issues easier to diagnose.
