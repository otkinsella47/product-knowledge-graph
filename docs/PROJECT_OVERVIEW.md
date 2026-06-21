# Project Overview

## Summary

Product Knowledge Graph is a product knowledge and reasoning platform.

It is designed to improve product decisions by making the relationships between knowledge, decisions and outcomes explicit.

## North Star

Improve product decisions through explainable knowledge lineage.

## Current phase

The project is in v0.1.

This phase is about validation, not scale. The goal is to test whether connected product knowledge helps people understand, explain and improve product decisions.

## Primary hypothesis

Teams make better product decisions when they can trace how knowledge flows from research and insight to opportunities, solutions, decisions and outcomes.

## Secondary hypothesis

AI reasoning is more useful when it is grounded in connected product knowledge rather than isolated documents or prompts.

## v0.1 scope

In scope:

- fixed product ontology
- entity creation
- relationship creation
- lineage navigation
- decision traceability
- lightweight AI reasoning experiments
- simple persistence
- user testing

Out of scope:

- fully configurable ontologies
- enterprise permissioning
- advanced governance
- production-scale infrastructure
- generic AI artefact generation
- complex graph visualisation before lineage value is proven

## Working model

The project uses a repository-first context strategy.

Stable project knowledge belongs in documentation. Temporary planning and implementation details belong in prompts, conversations or private notes.

Public project context belongs in `docs/`.

Personal AI workflow notes belong in `.ai-private/`.

## Repository structure

```text
docs/
├── PRODUCT_VISION.md
├── PROJECT_OVERVIEW.md
├── DOMAIN_MODEL.md
├── ARCHITECTURE.md
├── DECISIONS.md
├── ROADMAP.md
├── PRINCIPLES.md
├── USER_PERSONAS.md
└── AGENT_GUIDE.md

.ai-private/
├── codex-workflow.md
├── personal-prompts.md
└── scratch-notes.md
```

## Development approach

The project is built through a supervised AI-assisted workflow:

```text
ChatGPT
→ planning, product thinking and architecture

Codex
→ implementation

Manual review
→ validation, testing and quality control
```

## Success signals

v0.1 is working if users can:

- understand how product knowledge is connected
- trace a decision back to the knowledge that informed it
- trace knowledge forward to decisions and outcomes
- identify gaps in reasoning or support
- see how AI reasoning is grounded in connected context

## Risks

Known risks:

- the graph model may feel too abstract
- relationship capture may add too much manual overhead
- users may prefer immediate artefact generation over lineage
- the fixed ontology may not fit every workflow
- AI reasoning may be weak until enough knowledge exists
- governance needs may emerge earlier than expected
