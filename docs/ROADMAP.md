# Roadmap

## Purpose

This roadmap describes the current learning path for Product Knowledge Graph.

It is a guide for sequencing work, not a fixed delivery commitment.

## North Star

Improve product decisions through explainable knowledge lineage.

## Roadmap principles

The roadmap should prioritise:

1. knowledge lineage
2. relationship modelling
3. explainability
4. user feedback
5. AI reasoning foundations
6. ontology flexibility after validation
7. trust and governance after core value is proven

## Phase 1: Context and North Star alignment

### Goal

Ensure the project documentation, agent guidance and roadmap align around explainable knowledge lineage.

### Focus

- product vision
- domain language
- repository documentation
- development principles
- AI agent guidance

### Outputs

- clear North Star
- updated context files
- shared terminology
- repository structure

## Phase 2: Fixed ontology and relationship model

### Goal

Define the smallest useful ontology and relationship model needed for decision lineage.

### Focus

- core entities
- core relationships
- relationship semantics
- lineage paths
- open modelling questions

### Outputs

- fixed v0.1 ontology
- relationship definitions
- initial lineage model

## Phase 3: Core graph and lineage foundation

### Goal

Build the minimum system for creating connected product knowledge.

### Focus

- entity creation
- relationship creation
- basic graph operations
- simple persistence
- retrieving connected knowledge

### Outputs

- create entities
- connect entities
- retrieve relationship paths
- basic lineage-ready data structure

## Phase 4: Knowledge lineage navigation

### Goal

Make lineage useful to users.

### Focus

- trace from decision to supporting knowledge
- trace from insight to downstream decisions
- trace from decision to outcome
- show relationship context
- identify weak or missing links

### Questions to support

- Why are we doing this?
- What supports this decision?
- What changed our direction?
- What happened afterwards?
- Where is the reasoning weak?

### Outputs

- lineage navigation
- decision traceability views
- early user feedback

## Phase 5: Hosted alpha foundation and AI reasoning

### Goal

Build the persistent hosted alpha needed for real user testing, then test
whether AI can reason usefully over saved connected product knowledge.

### Focus

- hosted alpha persistence
- entities and relationships stored over time
- basic workspace/user separation
- graph API routes
- frontend persistence integration
- reasoning context assembly
- deterministic missing-link signals
- server-side LLM endpoint
- read-only in-app AI reasoning assistant
- explain decision context
- identify missing relationships
- surface unsupported decisions
- summarise lineage paths

### Outputs

- persistent hosted alpha
- local developer/self-host setup notes
- lightweight in-app AI reasoning experiment
- useful and non-useful AI use cases
- updated roadmap based on evidence

### Sequencing

Part A should establish the hosted alpha foundation:

- minimal persistence
- persisted entities and relationships
- basic workspace/user separation
- graph API routes
- frontend persistence integration
- deterministic lineage and missing-link context assembly

Part B should add AI reasoning on top of that foundation:

- server-side LLM endpoint
- read-only in-app assistant
- grounded answers over connected graph context
- hosted alpha usage messaging
- local BYOK documentation for developers and self-hosters

Phase 5 should avoid:

- complex permissions
- team roles
- billing
- enterprise governance
- audit logs
- configurable ontology
- graph visualisation
- vector databases
- embeddings
- AI memory
- autonomous agents
- AI graph mutation
- generic PRD or user-story generation
- relationship strength or evidence-quality scoring

## Phase 6: Workflow templates and ontology flexibility

### Goal

Explore whether teams need configurable workflows and ontologies.

### Focus

- Opportunity Solution Trees
- Jobs To Be Done
- data product workflows
- domain-specific workflows
- configurable relationship types

### Outputs

- template concepts
- ontology flexibility requirements
- architecture implications

## Phase 7: Trust and governance exploration

### Goal

Understand trust and governance requirements for product knowledge and AI reasoning.

### Focus

- workspace ownership
- entity ownership
- classification metadata
- permission-aware reasoning
- auditability
- explainability

### Outputs

- governance requirements
- trust model
- long-term architecture considerations
