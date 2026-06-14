# Principles

## Purpose

This document captures cross-cutting principles for Product Knowledge Graph.

These principles should guide product thinking, architecture, development and AI-assisted workflows.

## Product Principles

### Knowledge is relational

Product knowledge gains meaning through relationships between concepts.

### Relationships are first-class entities

The system should make relationships explicit, meaningful and navigable.

### Insights are reusable knowledge objects

Insights should not be trapped inside research notes, experiments or outcomes. They should be reusable entities that can inform many downstream concepts.

### Goals and outcomes are distinct

Goals are intended future states. Outcomes are realised results.

### Context should be durable

Important context should be persisted where future humans and AI agents can find it.

## Development Principles

### Build the simplest thing that enables learning

Avoid building for hypothetical scale or future requirements before the core value is validated.

### Prefer working software over perfect architecture

Architecture should support learning, not slow it down.

### Prefer vertical slices

Build small, independently testable increments.

### Avoid premature abstractions

Every abstraction adds maintenance cost, learning cost and context cost.

### Repository context beats prompt repetition

Stable knowledge should live in documentation rather than being repeatedly included in prompts.

## AI Principles

### Minimise future context requirements

Place information where future agents can retrieve it without repeated explanation.

### Preserve conceptual integrity

Agents should maintain consistent domain language and avoid introducing duplicate concepts casually.

### Optimise useful output per token

Prompts should be small but sufficient. Repository documentation should carry stable context.

### Challenge complexity

AI agents should challenge over-engineering, unnecessary frameworks and speculative architecture.
