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

Local development can use an anonymous httpOnly browser cookie to separate
workspaces when `ALPHA_AUTH_ENABLED` is not set to `true`. This is a lightweight
fallback for local and anonymous testing, not the hosted alpha identity model.
Clearing browser cookies creates a new anonymous workspace.

## Deployed Persistence

The hosted alpha expects graph API routes to run server-side. On Vercel, set
`DATABASE_URL` as an environment variable and apply `db/schema.sql` to that
database before using the app.

For hosted alpha testing, enable minimal alpha authentication:

1. Set `ALPHA_AUTH_ENABLED=true`.
2. Set `ALPHA_ANONYMOUS_WORKSPACE_ENABLED=false`.
3. Configure either `ALPHA_ACCESS_TOKEN` with `ALPHA_USER_EMAIL`, or
   `ALPHA_AUTH_TOKENS` as comma-separated `token:email` pairs.
4. Share an alpha URL that includes `?alpha_access_token=<token>` once. The
   server stores that token in an httpOnly cookie and maps it to the user's
   default workspace on later visits.

This is intentionally not a full SaaS account system. It gives each alpha user
one recoverable default workspace without roles, teams, billing or enterprise
permissions.

If `DATABASE_URL` is missing, or if the schema has not been applied, `/api/*`
graph routes return a diagnostic error instead of silently falling back to
browser-only storage. This preserves the Phase 5 persistence model while making
deployment issues easier to diagnose.
