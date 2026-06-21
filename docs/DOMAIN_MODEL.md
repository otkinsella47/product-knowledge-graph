# Domain Model

## Purpose

The domain model defines the core concepts and relationships used by Product Knowledge Graph.

It exists to support explainable knowledge lineage. The model should make it possible to trace how product knowledge moves from research and insight to opportunities, solutions, decisions and outcomes.

## Modelling principles

- Product knowledge is relational.
- Relationships are as important as entities.
- Product work is non-linear.
- Entities can connect to many other entities.
- Lineage is created by traversing relationships.
- v0.1 should use a fixed ontology.
- Future versions may support configurable ontologies.

## Core entities

### Research

Research is activity or source material that helps the team understand users, customers, markets, products or systems.

Examples:

- interview
- survey
- analytics review
- usability test
- desk research
- market research
- support ticket review

### Insight

An insight is a reusable interpretation of knowledge.

Insights can come from research, experiments, outcomes or other product context. They are first-class entities because they may inform many opportunities, decisions or future investigations.

Examples:

- Users do not understand the value proposition during onboarding.
- Teams lose decision context after discovery.
- A workflow is too slow for high-frequency product decisions.

### Goal

A goal is an intended future state.

Goals help frame which opportunities matter.

Examples:

- increase activation
- improve retention
- reduce time to decision
- improve confidence in prioritisation
- reduce operational risk

### Opportunity

An opportunity is a user need, customer problem, pain point, unmet desire or improvement area that could help achieve a goal if addressed.

Opportunities connect user or customer value with product direction.

### Solution

A solution is a proposed way to address an opportunity.

Examples:

- feature
- workflow
- prototype
- product change
- process change
- AI-assisted capability

### Experiment

An experiment is an intentional activity that generates learning.

Examples:

- prototype test
- landing page test
- usability test
- A/B test
- manual concierge test
- internal workflow trial

### Decision

A decision is an explicit choice, trade-off or commitment.

Decisions connect interpretation to action. They are important because they mark the point where the team chooses a direction.

Examples:

- prioritise an opportunity
- choose one solution over another
- stop work on an idea
- change product direction
- accept a trade-off
- act on an AI recommendation

### Outcome

An outcome is a realised result.

Outcomes describe what happened after a decision, solution, experiment or product change.

Examples:

- adoption increased
- retention stayed flat
- onboarding comprehension improved
- the workflow was not adopted
- a decision created unexpected maintenance cost

## Core relationships

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

Experiment
  informs → Decision

Decision
  influences → Outcome
```

## Relationship notes

### Research produces Insight

Research does not automatically create decisions. It creates source knowledge that is interpreted into insights.

### Insight reveals Opportunity

An insight may reveal more than one opportunity. An opportunity may be supported by more than one insight.

### Goal frames Opportunity

An opportunity is stronger when it connects a meaningful user or customer need to a goal the team wants to achieve.

### Opportunity motivates Solution

A solution should be traceable back to the opportunity it aims to address.

### Experiment produces Insight

Experiments create learning. They may validate, invalidate or reshape the team's understanding.

### Experiment informs Decision

Experiments produce learning that can inform decisions. A decision may be informed by one or more experiments, either directly or through insights produced by those experiments.

### Insight informs Decision

Decisions should be informed by interpreted knowledge, not only raw material.

### Decision influences Outcome

Outcomes should be traceable back to the decisions that influenced them.

## Knowledge lineage

Knowledge lineage is an emergent capability of the graph.

It is created by traversing relationships between entities.

Example:

```text
Research
→ Insight
→ Opportunity
→ Solution
→ Experiment
→ Decision
→ Outcome
```

The system should support lineage questions such as:

- Why was this decision made?
- Which insights informed it?
- Which opportunity did it relate to?
- Which solution or experiment changed the direction?
- What outcome followed?
- Where is the reasoning weak?

Knowledge lineage is not modelled as a separate entity in v0.1.

## Explainability

AI recommendations should be explainable through the same relationships used by humans.

An AI-generated recommendation should be able to reference:

- relevant research
- supporting insights
- related opportunities
- previous decisions
- observed outcomes
- missing or weak connections

## Value hypothesis

A value hypothesis is currently a derived concept.

```text
Value Hypothesis = Goal + Opportunity
```

An opportunity is valuable when:

1. it represents an important user or customer need
2. addressing it could help achieve a goal

Value hypothesis does not need to be a first-class entity in v0.1.

## Open questions

Questions to validate:

- Which relationships are most useful for decision lineage?
- How much structure can users tolerate before capture becomes burdensome?
- Should assumptions become first-class entities later?
- Should value hypotheses become first-class entities later?
- How should evidence strength or confidence be represented?
- How should configurable ontologies work in future versions?
