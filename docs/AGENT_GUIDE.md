# Agent Guide

## Purpose

This guide explains how AI agents should work in the Product Knowledge Graph repository.

Agents should preserve the project direction, use the repository context, and avoid changes that weaken lineage, explainability or long-term maintainability.

## North Star

Improve product decisions through explainable knowledge lineage.

## Context loading

Before proposing architecture or implementation changes, inspect the relevant project context.

Recommended order:

1. `PRODUCT_VISION.md`
2. `PROJECT_OVERVIEW.md`
3. `DOMAIN_MODEL.md`
4. `ARCHITECTURE.md`
5. `DECISIONS.md`
6. `ROADMAP.md`
7. `PRINCIPLES.md`

Do not make assumptions that conflict with documented context.

If implementation ideas conflict with the docs, highlight the conflict and recommend which file should be updated.

## Product direction

Agents should treat knowledge graphs, ontologies and AI features as implementation approaches.

They are not the vision.

The product value is improving decisions through explainable lineage.

## Domain language

Use the terms defined in `DOMAIN_MODEL.md`.

Avoid introducing duplicate concepts casually.

When adding or changing a core concept, recommend an update to `DOMAIN_MODEL.md`.

## Implementation principles

Prefer:

- small vertical slices
- simple solutions
- relationship-preserving changes
- clear lineage paths
- easy refactoring
- tests for meaningful behaviour

Avoid:

- broad rewrites
- speculative abstractions
- generic AI generation features without lineage value
- graph features that do not improve decision traceability
- premature governance or configurability

## AI feature guidance

When proposing AI capabilities, prefer reasoning over connected knowledge.

Useful AI capabilities include:

- explaining decision context
- identifying missing links
- surfacing weakly supported decisions
- tracing recommendations back to source knowledge
- detecting contradictions
- summarising lineage paths

Avoid making generic artefact generation the centre of the product.

## Documentation guidance

Update documentation when changes affect:

- product vision
- domain language
- relationship model
- architecture
- roadmap
- AI reasoning approach
- trust or governance assumptions

Stable knowledge belongs in repository documentation, not repeated prompts.

## Review checklist

Before completing work, check:

- Does this support the North Star?
- Does it preserve or improve knowledge lineage?
- Does it keep reasoning explainable?
- Does it stay within the fixed v0.1 ontology unless explicitly changing it?
- Does it avoid unnecessary complexity?
- Does documentation need updating?
