# Decisions

## Purpose

This document records important project decisions and the reasoning behind them.

It should help future humans and AI agents understand why the project evolved in a particular direction.

## Decision Criteria

Architecture and product decisions should consider:

- User value
- Development effort
- Maintenance cost
- Context cost
- Long-term development velocity
- Learning value

Avoid decisions that significantly increase complexity without clear evidence of benefit.

---

# ADR-001: Repository-First Context Strategy

## Decision

Stable project knowledge should live in repository documentation rather than being repeatedly included in prompts.

## Context

The project uses ChatGPT for planning and Codex for implementation. AI agents lose context between sessions, so repeatedly explaining the same vision, domain model and workflow creates prompt bloat and increases the risk of inconsistency.

## Alternatives Considered

### Keep context in prompts

Pros:

- Flexible
- Easy to change quickly

Cons:

- Repetitive
- Token-heavy
- Easy for context to drift
- Harder for new agents to onboard

### Store stable context in repository documentation

Pros:

- Durable
- Self-documenting
- Easier for agents to inspect
- Reduces repeated prompting
- Improves consistency

Cons:

- Requires documentation maintenance

## Consequences

The repository should include durable context files such as:

- PRODUCT_VISION.md
- PROJECT_OVERVIEW.md
- DOMAIN_MODEL.md
- ARCHITECTURE.md
- DECISIONS.md
- ROADMAP.md
- AGENT_GUIDE.md

---

# ADR-002: Personal AI Workflow Files Remain Private

## Decision

Project context should be public in `docs/`, while personal AI workflow files should remain private in `.ai-private/`.

## Context

Some information explains the project. Other information explains how Owen personally works with Codex and ChatGPT.

These should not be mixed.

## Reasoning

Project context belongs in the repository because future contributors and AI agents need it.

Personal workflow preferences do not need to be shared publicly.

## Consequences

Use:

```text
docs/
```

for public project context.

Use:

```text
.ai-private/
```

for personal workflow files.

Add `.ai-private/` to `.gitignore`.

---

# ADR-003: Prototype-First, Validation-First Development

## Decision

Product Knowledge Graph v0.1 should prioritise learning and validation over production-grade architecture.

## Context

The project is a side project exploring whether graph-based product knowledge management is valuable.

The core risk is not technical scalability. The core risk is whether the concept is useful.

## Reasoning

A validation-first approach supports:

- Faster iteration
- Lower maintenance
- Less over-engineering
- More user feedback
- Better learning

## Consequences

Prefer:

- Working software
- Simple solutions
- Fast iteration
- Lightweight prototypes

Avoid:

- Enterprise infrastructure
- Premature optimisation
- Overly complex architecture
- Heavy abstractions before validation

---

# ADR-004: Knowledge Graph Modelling Precedes Feature Development

## Decision

The domain model and graph relationships should guide feature development.

## Context

The central idea of the product is that product knowledge is relational.

If the project starts by building generic documents, boards or CRUD screens, it risks recreating existing tools rather than exploring the graph-based insight.

## Reasoning

The graph is not a technical implementation detail. It is the product's core concept.

## Consequences

Before building major features, agents should understand:

- Core entities
- Relationships
- Graph semantics
- Domain language

---

# ADR-005: Domain Model as Conceptual Foundation

## Decision

The domain model should act as the conceptual contract of the system.

## Context

The project repeatedly returns to a common set of entities:

- Research
- Insight
- Goal
- Opportunity
- Solution
- Experiment
- Decision
- Outcome

This language should guide the product, architecture and AI reasoning.

## Reasoning

A clear domain model reduces ambiguity and helps agents make consistent decisions.

## Consequences

Changes to core terminology should be reflected in DOMAIN_MODEL.md.

Agents should avoid introducing duplicate terms without explaining why.

---

# ADR-006: Insights as First-Class Knowledge Objects

## Decision

Insights should be modelled as reusable first-class graph entities.

## Context

Insights can originate from research, experiments or outcomes. They can also inform multiple opportunities, decisions and future investigations.

## Reasoning

Treating insights as first-class entities supports non-linear product learning.

For example:

```text
Experiment
  produces → Insight

Insight
  informs → Decision
```

This is more accurate than modelling experiments as directly informing decisions.

## Consequences

Insights can:

- Be reused across contexts
- Inform decisions
- Reveal opportunities
- Originate from multiple sources
- Support richer AI reasoning
