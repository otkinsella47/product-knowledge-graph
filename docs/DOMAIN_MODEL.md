# Domain Model

## Purpose

This document defines the initial domain model for Product Knowledge Graph.

The domain model is the conceptual foundation of the system. It defines the language that should guide product thinking, architecture, UI design, data modelling and AI reasoning.

## Core Principle

> Product knowledge is a graph of connected concepts.

The system should not assume that product work follows a linear process. Product knowledge evolves through feedback loops, many-to-many relationships and repeated learning cycles.

## Core Entities

### Research

Research is structured or unstructured activity that generates knowledge about users, customers, markets, products or systems.

Examples:

- User interviews
- Surveys
- Analytics review
- Desk research
- Usability testing
- Market research

### Insight

An insight is a reusable knowledge object derived from research, experiments, outcomes or other evidence.

Insights are first-class entities because they can inform multiple downstream concepts.

Examples:

- Users do not understand the value proposition during onboarding.
- Teams repeatedly lose decision context after discovery.
- Marketers struggle to connect campaign planning to activation data.

### Goal

A goal is an intended future state.

Goals frame which opportunities matter and help determine whether an opportunity is valuable.

Examples:

- Increase activation
- Improve retention
- Reduce time to decision
- Improve confidence in prioritisation

### Opportunity

An opportunity is a user or customer need, pain point, unmet desire or problem area that could help achieve a goal if addressed.

Opportunities connect customer/user value with intended outcomes.

### Solution

A solution is a proposed way to address an opportunity.

Examples:

- A feature
- A workflow
- A prototype
- A product change
- A process change

### Experiment

An experiment is an intentional activity designed to generate evidence about a solution, opportunity or assumption.

Examples:

- Prototype test
- Landing page test
- Usability test
- A/B test
- Manual concierge test
- Internal workflow trial

### Decision

A decision is a chosen direction, trade-off or commitment based on available context.

Examples:

- Prioritise an opportunity
- Build a solution
- Stop work on an idea
- Change product direction
- Accept a trade-off

### Outcome

An outcome is a realised result.

Outcomes represent what actually happened, not what was intended.

Examples:

- Retention increased
- Adoption remained flat
- User comprehension improved
- A workflow was not adopted
- A decision created unexpected maintenance cost

## Core Relationships

```text
Research
  produces → Insight

Experiment
  produces → Insight

Outcome
  produces → Insight

Insight
  reveals → Opportunity

Insight
  informs → Decision

Goal
  frames → Opportunity

Opportunity
  supports → Goal

Opportunity
  motivates → Solution

Solution
  validated_by → Experiment

Decision
  influences → Outcome
```

## Value Hypothesis

A value hypothesis is currently treated as a derived concept rather than a first-class entity.

```text
Value Hypothesis = Goal + Opportunity
```

This means an opportunity becomes valuable when:

1. It represents an important user or customer need.
2. Addressing it could help achieve a goal.

## Graph Semantics

Relationships are not assumed to be linear.

Entities may:

- Connect to many other entities
- Participate in feedback loops
- Be reused across different contexts
- Support or contradict other knowledge
- Change meaning as more evidence is gathered

## Feedback Loops

Product learning often creates loops.

Example:

```text
Insight
  reveals → Opportunity

Opportunity
  motivates → Solution

Solution
  validated_by → Experiment

Experiment
  produces → Insight
```

This allows the model to represent product discovery as an ongoing learning system rather than a one-way pipeline.

## Open Questions

The following questions should be explored through validation:

- Which entities need to be first-class in v0.1?
- Which relationships are most useful to users?
- How much graph complexity can users comfortably understand?
- Should value hypotheses eventually become first-class entities?
- How should confidence, evidence strength or priority be represented?
