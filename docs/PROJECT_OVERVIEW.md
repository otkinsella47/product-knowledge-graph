# Project Overview

## Summary

Product Knowledge Graph is a side project focused on building an AI-native product knowledge system.

The project explores whether product management knowledge can be better captured, connected and reasoned about as a graph of concepts rather than as isolated documents or linear workflows.

## Current Phase

The project is currently in v0.1.

The focus is on:

- Establishing durable project context
- Defining the initial domain model
- Building a simple prototype
- Validating the core concept
- Learning quickly through feedback

## Current Objective

The primary objective of v0.1 is learning and validation.

The project should answer:

> Is modelling product knowledge as a graph useful enough to justify further development?

## Working Model

The development workflow is:

1. ChatGPT for planning, architecture and product thinking
2. Codex for implementation
3. Manual review and testing
4. Repository documentation as durable shared context

## In Scope for v0.1

- Core domain model
- Basic graph representation
- Relationship-first workflows
- Lightweight UI or prototype
- AI-assisted reasoning experiments
- Manual testing and validation
- Documentation that helps future AI agents understand the project

## Out of Scope for v0.1

- Enterprise infrastructure
- Complex permissions
- Production deployment guarantees
- Advanced integrations
- Large-scale performance optimisation
- Heavy graph database commitments before validation
- Overly detailed schemas before user needs are clearer

## Repository Context Strategy

Stable project knowledge should live in repository documentation, not repeated prompts.

Public project documentation belongs in `docs/`.

Personal AI workflow guidance belongs in `.ai-private/` and should be ignored by Git.

## Proposed Repository Structure

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
├── token-optimisation.md
├── personal-prompts.md
└── scratch-notes.md
```

## Current Assumptions

- Product knowledge is better represented as connected concepts than isolated documents.
- Product teams need stronger traceability between insights, opportunities, decisions and outcomes.
- AI agents will be more useful when product context is explicit and structured.
- The first version should optimise for learning, not completeness.
- The domain model should evolve through validation.

## Known Risks

- The model may become too abstract for users.
- The graph may add complexity without enough workflow value.
- The project may over-engineer before validating the core use case.
- AI agents may misinterpret project context if documentation is unclear or duplicated.
- The user experience may need to simplify graph concepts for practical adoption.

## Success Measures

Potential success measures include:

- Users can understand the product concept quickly.
- Users can create and navigate meaningful relationships.
- Users can trace decisions back to supporting knowledge.
- The system reduces repeated context-building.
- AI agents can use repository context effectively.
