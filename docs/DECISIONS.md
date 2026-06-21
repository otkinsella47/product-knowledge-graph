# Decisions

## Purpose

This file records project decisions that shape the product, architecture and development approach.

It should help a future contributor or AI agent understand the current direction without needing the full conversation history.

## Decision criteria

Product and architecture decisions should be evaluated against:

- North Star alignment
- decision quality
- knowledge lineage
- explainability
- user value
- development effort
- maintenance cost
- context cost
- future governance extensibility

## ADR-001: Repository-first context strategy

### Decision

Stable project knowledge belongs in repository documentation.

### Rationale

AI-assisted development works better when durable context is inspectable in the repo rather than repeatedly copied into prompts.

### Consequences

Core context lives in `docs/`.

Personal workflow notes live in `.ai-private/`.

## ADR-002: Personal AI workflow files remain private

### Decision

Personal prompting and Codex workflow notes should not be committed.

### Consequences

Use `.ai-private/` for personal workflow files and ignore it in Git.

## ADR-003: Prototype-first, validation-first development

### Decision

v0.1 should prioritise learning and validation over production-grade architecture.

### Consequences

Prefer small vertical slices, simple implementation and fast user feedback.

## ADR-004: Relationship modelling precedes feature depth

### Decision

The product should first prove that connected product knowledge and lineage are useful.

### Consequences

Features should be designed around relationships and lineage rather than generic document or artefact creation.

## ADR-005: Domain model as conceptual foundation

### Decision

The domain model acts as the shared language for the product, architecture and AI reasoning.

### Consequences

Changes to core terminology should be reflected in `DOMAIN_MODEL.md`.

## ADR-006: Insights as first-class knowledge objects

### Decision

Insights should be modelled as reusable entities.

### Consequences

Insights can originate from research, experiments or outcomes and inform multiple opportunities or decisions.

## ADR-007: Knowledge lineage as core capability

### Decision

Knowledge lineage is a core product capability.

### Consequences

Lineage is created by traversing relationships. It should not be modelled as a separate entity in v0.1.

## ADR-008: AI reasoning over AI generation

### Decision

The primary AI focus is reasoning over connected product knowledge.

### Consequences

AI work should prioritise explanations, gap detection, recommendation rationale and decision support over generic artefact generation.

## ADR-009: Fixed ontology for v0.1

### Decision

v0.1 should use an opinionated fixed ontology.

### Consequences

The first version should prioritise validation and clarity over configurability.

## ADR-010: Flexible ontology as long-term direction

### Decision

Future versions should support configurable ontologies and relationship types.

### Consequences

The architecture should avoid decisions that make ontology flexibility difficult later.

## ADR-011: Trust and governance as future architectural concerns

### Decision

Trust, ownership, classification, permission-aware reasoning and auditability are future architectural concerns.

### Consequences

They are not v0.1 implementation priorities, but the system should avoid choices that block them.

## ADR-012: North Star is explainable knowledge lineage

### Decision

The project should optimise for improving product decisions through explainable knowledge lineage.

### Consequences

Graphs, AI and ontology flexibility should be treated as means to improve decisions, not as ends in themselves.

## ADR-013: Knowledge graph is an implementation approach

### Decision

The knowledge graph is the primary implementation approach for now, not the product vision itself.

### Consequences

The project should stay focused on decision quality, lineage and explainability rather than graph features for their own sake.
