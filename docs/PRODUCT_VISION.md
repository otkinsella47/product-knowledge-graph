# Product Vision

## Vision

Product Knowledge Graph is an AI-native product knowledge system that models the relationships between product concepts such as research, insights, goals, opportunities, solutions, experiments, decisions and outcomes.

Rather than treating product knowledge as a set of documents, folders, boards or linear workflows, the system treats knowledge as a graph of connected concepts.

## Problem Statement

Product managers and product teams need to move from insight to decision to implementation. This process includes research, sense-making, prioritisation, solution exploration, experimentation, decision-making and outcome tracking.

In practice, this work is non-linear and varies across individuals, teams and domains. Existing tools often force this knowledge into documents, tickets, canvases or hierarchies. These formats can capture information, but they rarely capture the relationships between pieces of information.

As a result:

- Research becomes disconnected from decisions.
- Decisions lose their original context.
- Opportunities are separated from the goals they support.
- Experiments and outcomes are hard to trace back to the thinking that created them.
- Product knowledge is repeatedly recreated in meetings, documents and prompts.
- AI agents lack durable context for reasoning about product work.

## Core Thesis

> Product knowledge is fundamentally relational rather than hierarchical.

Product teams do not only need to store information. They need to preserve the relationships between information.

The value of the system comes from making those relationships explicit, navigable and reusable.

## Why Existing Tools Fall Short

Existing product tools tend to optimise for specific artefacts:

- Documents
- Roadmaps
- Tickets
- Research repositories
- Opportunity trees
- Experiment logs
- Decision records

These tools are useful, but they often fragment context. They make it difficult to answer questions such as:

- Which insights led to this opportunity?
- Which goal does this opportunity support?
- Which solution was chosen and why?
- Which experiment validated or invalidated the idea?
- Which decision was made based on which evidence?
- Which outcome resulted from the decision?
- What did we learn?

Product Knowledge Graph aims to make these connections visible and durable.

## Long-Term Vision

The long-term vision is to build an AI-native product operating system that helps teams:

- Capture product knowledge as connected concepts
- Navigate relationships between product artefacts
- Preserve decision context over time
- Reason from evidence to action
- Identify gaps, contradictions and assumptions
- Support AI-assisted product discovery and delivery
- Reduce repeated context-building across teams and tools

## Core Concepts

The initial domain model focuses on:

- Research
- Insight
- Goal
- Opportunity
- Solution
- Experiment
- Decision
- Outcome

These concepts are expected to evolve through validation.

## Design Principles

### Knowledge is relational

The system should prioritise relationships between concepts, not just the concepts themselves.

### Relationships are first-class

Relationships should be explicit, meaningful and navigable.

### Insights are reusable knowledge objects

Insights can originate from research, experiments, outcomes or other sources. They can inform multiple opportunities, decisions and future investigations.

### Goals and outcomes are distinct

Goals represent intended future states. Outcomes represent realised states.

### The system should explain itself

Repository documentation, domain language and architecture should allow a new human or AI agent to understand the project with minimal prompting.

### Simplicity before completeness

The system should avoid exhaustive modelling before there is evidence that additional complexity is needed.

## Development Philosophy

The primary objective of Product Knowledge Graph v0.1 is learning and validation.

Prefer:

- Working software
- Fast iteration
- User feedback
- Simple solutions
- Rapid experimentation

Over:

- Perfect architecture
- Scalability assumptions
- Enterprise-grade infrastructure
- Premature optimisation

> Build the simplest version that enables learning.

## Success Criteria for v0.1

v0.1 is successful if it helps validate whether graph-based product knowledge management is useful.

Success may include:

- Users understand the value of modelling product knowledge as relationships.
- Users can navigate from insights to opportunities, solutions, decisions and outcomes.
- The system helps reduce repeated context recreation.
- The graph structure supports useful AI-assisted reasoning.
- The project produces enough learning to guide the next phase.

## Non-Goals for v0.1

v0.1 should not aim to deliver:

- Enterprise-grade infrastructure
- Complex permissions
- Large-scale deployment
- Exhaustive domain modelling
- Advanced automation before core workflows are validated
- Production-grade scalability before product value is proven
