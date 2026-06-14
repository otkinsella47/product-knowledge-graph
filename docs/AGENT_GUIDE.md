# Agent Guide

## Purpose

This document provides guidance for AI agents working on the Product Knowledge Graph repository.

Agents should optimise for safe, focused, maintainable and context-aware changes.

## Project Philosophy

Product Knowledge Graph models product knowledge as a graph of connected concepts rather than a set of isolated documents.

The core thesis is:

> Product knowledge is fundamentally relational rather than hierarchical.

## Project Context Loading

Before proposing architecture or implementation changes, inspect project context documents where available.

Prioritise reading:

1. PRODUCT_VISION.md
2. PROJECT_OVERVIEW.md
3. DOMAIN_MODEL.md
4. ARCHITECTURE.md
5. DECISIONS.md
6. AGENT_GUIDE.md
7. ROADMAP.md

Do not make assumptions that contradict documented project context.

If implementation ideas conflict with existing documentation:

1. Highlight the conflict.
2. Explain the trade-offs.
3. Ask whether documentation should be updated before implementation proceeds.

## Repository-First Development

Prefer stable documentation over repeated prompting.

Move durable knowledge into repository context files whenever possible.

Examples:

- Product vision → PRODUCT_VISION.md
- Domain concepts → DOMAIN_MODEL.md
- Architecture decisions → DECISIONS.md
- Development standards and workflows → AGENT_GUIDE.md
- Roadmap and future plans → ROADMAP.md

> Prefer stable documentation and small implementation prompts over repeatedly explaining the same concepts.

Implementation prompts should reference repository documentation rather than restating it.

## Context Ownership

The repository uses dedicated context files with clear ownership.

| Document | Purpose |
|---|---|
| PRODUCT_VISION.md | Why the project exists |
| PROJECT_OVERVIEW.md | Current scope and objectives |
| DOMAIN_MODEL.md | Concepts and relationships |
| ARCHITECTURE.md | System boundaries and major components |
| DECISIONS.md | Important decisions and trade-offs |
| ROADMAP.md | Future direction |
| PRINCIPLES.md | Cross-cutting principles |
| USER_PERSONAS.md | Hypothesised users and needs |
| AGENT_GUIDE.md | Instructions for AI agents |

Do not duplicate information across files unless necessary.

Recommend documentation updates whenever information appears outdated, inconsistent or missing.

## Domain Language

Treat project terminology as part of the system.

Avoid introducing new terms that duplicate existing concepts.

Prefer using language defined in:

- DOMAIN_MODEL.md
- PRODUCT_VISION.md
- PRINCIPLES.md

If new concepts are introduced:

1. Define them clearly.
2. Explain how they relate to existing concepts.
3. Recommend updates to DOMAIN_MODEL.md where appropriate.

## Task Sizing and Incremental Delivery

Classify implementation work as:

### Small

Can be implemented and validated in a single session.

### Medium

Requires several coordinated changes but remains independently testable.

### Large

Requires multiple implementation sessions and should be split into sequential tasks.

Prefer:

- The smallest independently testable increment
- Vertical slices
- Frequent validation
- Sequential delivery

Avoid:

- Large architectural changes in one step
- Broad refactors without validation checkpoints
- Multi-session work without explicit decomposition

## Incremental Development

Prefer:

- Small changes
- Vertical slices
- Working software over scaffolding
- Proving assumptions through implementation
- Simple solutions before abstractions

Avoid:

- Infrastructure for hypothetical requirements
- Unused abstractions
- Implementing entire systems in one step
- Speculative optimisation

> Build the next smallest thing that increases confidence in the product direction.

## Complexity Guardrails

Prefer the simplest solution that satisfies current requirements.

Challenge:

- YAGNI violations
- Premature abstractions
- Additional frameworks
- Enterprise patterns
- Future-proofing assumptions
- Excessive configurability

Avoid introducing complexity unless there is evidence it is required.

Every abstraction introduces:

- Maintenance cost
- Context cost
- Learning cost
- Future constraints

## Context Placement Rules

Place information in the location that minimises future context requirements.

Preferred locations:

### Repository documentation

Use for:

- Stable concepts
- Domain knowledge
- Architecture decisions
- Long-term plans

### Source code comments

Use for:

- Local implementation reasoning
- Non-obvious technical decisions

### Tests

Use for:

- Expected behaviour
- Edge cases
- Business rules

### Commit messages

Use for:

- Why a change was made

### Pull requests

Use for:

- Implementation trade-offs
- Review context

### Codex prompts

Use for:

- Temporary task-specific requirements

### ChatGPT planning discussions

Use for:

- Exploration and brainstorming

> Stable information belongs in the repository. Temporary information belongs in prompts and conversations.

## Work Prioritisation and AI ROI

Evaluate new work against:

- User value
- Development effort
- Maintenance cost
- Context cost

Challenge work that creates:

- Large maintenance burden
- Additional complexity
- High context requirements
- Limited user value

Prefer solutions with a high value-to-complexity ratio.

## Prototype Mindset

Assume the project is in an experimental stage unless documentation states otherwise.

Prefer:

- Simplicity
- Speed of learning
- Low maintenance solutions
- Minimal dependencies
- Easy refactoring

Do not introduce production-grade complexity unless there is a demonstrated need.

## Architecture Decisions

When a change introduces:

- New dependencies
- New architectural patterns
- Changes to system boundaries
- Data model changes
- Public API changes
- Significant trade-offs

recommend updating DECISIONS.md.

Do not assume undocumented decisions are intentional.

## Documentation Rules

Update documentation when changes affect:

- Product concepts
- Domain language
- Architecture
- System boundaries
- Configuration
- User behaviour
- APIs
- Setup requirements
- Development workflows

Documentation should remain concise, accurate and close to the changed behaviour.

## Communication Style

Communicate clearly and briefly.

For each task:

1. Explain the current understanding.
2. Explain the intended approach.
3. State assumptions and risks.
4. Summarise what changed and why.
5. Report validation steps and results.
6. Propose the next sensible step if blocked.

Prefer practical summaries over long explanations.

## Core Principle

Optimise for:

- Safe changes
- Minimal changes
- Reviewable changes
- Explicit reasoning
- Consistency with project context

When uncertain:

1. Inspect first.
2. Ask questions.
3. Prefer simplicity.
4. Preserve context integrity.
