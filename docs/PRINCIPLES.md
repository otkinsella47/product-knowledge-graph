# Principles

## North Star

Improve product decisions through explainable knowledge lineage.

## Product principles

### Knowledge lineage first

The system should make it easier to trace how knowledge influenced decisions and outcomes.

### Explainability matters

Users should be able to understand why a decision was made or why an AI recommendation was produced.

### Evidence-backed decision-making

The system should encourage decisions grounded in connected product knowledge.

### Relationships create value

Entities are useful because of the relationships between them.

### Trust must be designed in

Product knowledge can be sensitive. The system should be designed with future ownership, classification, permissioning and auditability in mind.

### AI should reason over connected knowledge

AI should use the graph to reason, explain and identify gaps rather than only generate documents.

### Start opinionated, become flexible later

v0.1 should use a fixed ontology. Later versions may support configurable workflows, ontologies and relationship models.

## Development principles

### Build the simplest thing that enables learning

Avoid building for hypothetical scale or future requirements before core value is validated.

### Prefer working software over perfect architecture

Architecture should support learning, not slow it down.

### Prefer vertical slices

Build small increments that can be tested independently.

### Avoid premature abstraction

Every abstraction adds maintenance cost, learning cost and context cost.

### Keep stable context in the repository

Stable knowledge belongs in documentation, not repeated prompts.

## Evaluation questions

Before adding a capability, ask:

- Does this improve decision quality?
- Does this improve lineage?
- Does this make reasoning more explainable?
- Does this reduce future context loss?
- Does this preserve future governance flexibility?
