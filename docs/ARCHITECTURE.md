# Architecture

## Purpose

This document describes the high-level architecture for Product Knowledge Graph.

The architecture should remain lightweight and technology-agnostic until the core product value is validated.

## Architectural Principles

- Relationship-first modelling
- Simple before sophisticated
- Technology-agnostic until needed
- Incremental evolution
- Clear separation of responsibilities
- Support for future AI-assisted reasoning
- Avoid premature infrastructure decisions

## Conceptual Architecture

```text
User Interface
↓
Application Layer
↓
Knowledge Graph Engine
↓
Persistence Layer
```

## Layers

### User Interface

The user interface allows users to create, view, connect and navigate product knowledge.

Responsibilities may include:

- Creating nodes
- Creating relationships
- Viewing connected concepts
- Navigating the graph
- Supporting lightweight workflows
- Making graph concepts understandable to users

### Application Layer

The application layer coordinates product workflows and use cases.

Responsibilities may include:

- Handling user actions
- Enforcing business rules
- Coordinating graph operations
- Preparing data for the UI
- Managing validation logic

### Knowledge Graph Engine

The knowledge graph engine is responsible for graph-specific behaviour.

Responsibilities may include:

- Managing nodes
- Managing relationships
- Validating relationship types
- Traversing the graph
- Querying connected concepts
- Supporting future reasoning workflows

### Persistence Layer

The persistence layer stores and retrieves the graph and supporting artefacts.

It may store:

- Nodes
- Relationships
- Metadata
- User-generated artefacts
- Version history
- Context documents

The persistence layer is an abstraction. It does not imply a specific database technology.

Possible future implementations could include:

- Relational database with graph-like tables
- Graph database
- Document database
- Hybrid graph, document and vector storage

No specific persistence technology should be assumed until the project has enough evidence to justify the choice.

## Future Direction: AI Reasoning Layer

A future architecture may include an AI reasoning layer.

Potential responsibilities:

- Summarising connected knowledge
- Identifying missing links
- Detecting contradictions
- Suggesting related entities
- Helping users reason from evidence to decisions

This should not be overbuilt in v0.1.

## Current Architectural Stance

For v0.1, the architecture should prioritise:

- Fast learning
- Simple implementation
- Easy refactoring
- Clear domain concepts
- Minimal infrastructure

## Open Questions

- What persistence approach best supports the first useful prototype?
- How should graph traversal be exposed to users?
- How much structure should be enforced at the application layer?
- Which AI reasoning capabilities are useful enough to build?
