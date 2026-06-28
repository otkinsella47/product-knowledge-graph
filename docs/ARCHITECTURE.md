# Architecture

## Purpose

The architecture should support the project North Star:

> Improve product decisions through explainable knowledge lineage.

The system should remain simple in v0.1 while leaving room for AI reasoning, configurable ontologies and governance in later versions.

## Architectural principles

- Preserve knowledge lineage.
- Make reasoning explainable.
- Keep the ontology fixed in v0.1.
- Avoid coupling the system to one product methodology.
- Prefer simple architecture until value is validated.
- Leave room for future governance and ontology flexibility.

## Conceptual architecture

```text
User Interface
↓
Application Layer
↓
Knowledge Graph Engine
↓
Persistence Layer
```

A future version may add an AI reasoning layer.

```text
AI Reasoning Layer
↓
Application Layer
↓
Knowledge Graph Engine
↓
Persistence Layer
```

## User Interface

The user interface should help users create, connect and navigate product knowledge.

Responsibilities:

- create entities
- create relationships
- show related concepts
- support lineage navigation
- help users understand why a decision exists
- avoid exposing unnecessary graph complexity

The UI should make the graph useful without requiring users to think like graph database experts.

## Application Layer

The application layer coordinates product workflows and business rules.

Responsibilities:

- handle user actions
- validate allowed relationships
- coordinate graph operations
- prepare data for the UI
- support lineage queries
- prepare structured context for AI reasoning

## Knowledge Graph Engine

The graph engine manages entities, relationships and traversal.

Responsibilities:

- create and update nodes
- create and update relationships
- validate relationship types
- traverse connected knowledge
- retrieve lineage paths
- identify missing or weak connections
- support future ontology configuration

The graph engine is a product capability, not necessarily a specific graph database.

## Persistence Layer

The persistence layer stores and retrieves graph data and supporting artefacts.

It may store:

- entities
- relationships
- metadata
- user-generated content
- version history
- context documents

The persistence layer is an abstraction. It does not imply a specific database technology.

Possible future implementations:

- relational database with graph-like tables
- graph database
- document database
- hybrid graph, document and vector storage

The project should not commit to a heavy persistence choice before the core product value is validated.

For the Phase 5 hosted alpha, the persistence layer should use a minimal
relational model with graph-like tables for entities and relationships. The
goal is durable product knowledge for real user testing, not production-scale
infrastructure.

Phase 5 persistence should include:

- persisted entities
- persisted relationships
- a workspace or project ownership field
- created and updated timestamps

Lineage should not be stored as its own table or entity in v0.1. It should
remain derived by traversing persisted relationships through the graph engine.

For the hosted alpha, workspace separation is currently an anonymous browser
cookie boundary. The server issues an httpOnly workspace cookie when one is
missing, then scopes graph API reads and writes to that workspace. This avoids
one shared public graph for testing, but it is not authentication,
permissioning, team management or governance. Clearing browser cookies creates
a new anonymous workspace until a later authenticated workspace model exists.

## AI Reasoning Layer

The AI reasoning layer should reason over connected product knowledge.

Responsibilities may include:

- summarising connected context
- explaining recommendations
- identifying missing links
- detecting contradictions
- highlighting weakly supported decisions
- tracing recommendations back to source knowledge
- suggesting relevant entities or relationships

This should not be overbuilt before useful lineage workflows exist.

For the Phase 5 hosted alpha, AI integration should be server-side and
read-only. The hosted app may use a limited project-owner LLM key configured in
server environment variables. Local developer and self-host setups may use BYOK
through environment variables. LLM keys must not be committed or exposed in
client-side code.

## Trust and governance

Product knowledge may include sensitive research, personal data, strategy and commercial information.

The architecture should remain open to:

- workspace ownership
- entity ownership
- classification metadata
- permission-aware AI reasoning
- auditability
- explainability
- configurable governance rules

These are future concerns, not v0.1 implementation requirements.

## v0.1 architecture stance

v0.1 should prioritise:

- simple implementation
- fast iteration
- clear domain concepts
- relationship modelling
- lineage navigation
- easy refactoring

It should avoid:

- enterprise architecture
- premature graph database commitments
- complex permission models
- generic AI orchestration
- deep configurability before validation

## Open questions

- What persistence model best supports the first useful prototype?
- How should users navigate lineage without visual clutter?
- Which relationship rules should be enforced in v0.1?
- What minimum metadata is needed for future governance?
- Which AI reasoning use case should be tested first?
