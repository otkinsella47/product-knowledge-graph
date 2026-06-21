# Phase 4 Handoff

## Purpose

This note captures the Phase 3 graph foundation for Phase 4 lineage navigation.

Phase 4 should turn the direct connected-knowledge foundation into useful lineage views without adding graph visualisation, AI reasoning or configurable ontology work too early.

## Current storage

Entities and relationships are stored through `GraphRepository`.

The current implementation is `createInMemoryGraphRepository` in `src/domain/graphRepository.ts`.

- Entities are stored in an in-memory `Map<string, Entity>`.
- Relationships are stored in an in-memory `Map<string, Relationship>`.
- The repository validates entity and relationship type values against the fixed ontology.
- Data does not persist across browser refreshes yet.

## Relationship validation

Relationship validation happens in `createGraphEngine` in `src/domain/graphEngine.ts`.

Before a relationship is created, the graph engine checks:

- the source entity exists
- the target entity exists
- the source entity type, relationship type and target entity type are allowed by the fixed v0.1 ontology

The fixed ontology rules live in `src/domain/ontology.ts`.

## Connected retrieval

The graph engine exposes direct connected-knowledge retrieval helpers:

- `getRelationshipsForEntity(entityId)`
- `getIncomingRelationshipsForEntity(entityId)`
- `getOutgoingRelationshipsForEntity(entityId)`
- `getConnectedEntities(entityId)`
- `getIncomingConnectedEntities(entityId)`
- `getOutgoingConnectedEntities(entityId)`
- `getDirectConnectedKnowledge(entityId)`
- `getDirectRelationshipPath(sourceEntityId, targetEntityId)`

These helpers are intentionally direct-neighbour retrieval only. They prepare the model for Phase 4 without implementing full lineage navigation in Phase 3.

## Current UI surface

The current app UI in `src/App.tsx` supports:

- creating entities
- editing and deleting entities
- connecting entities with valid outgoing relationships
- filtering target entities based on the selected relationship rule
- viewing relationships for the selected entity
- seeing whether each visible relationship is incoming or outgoing
- removing relationships

The UI is still an in-memory prototype.

## Lineage questions now possible

The current foundation can answer direct questions such as:

- Which entities are directly connected to this entity?
- Which relationships point into this entity?
- Which relationships point out from this entity?
- Which entities directly informed this decision?
- Which outcomes are directly influenced by this decision?
- Is there a direct relationship path between two entities?

## Phase 4 work still needed

Phase 4 should add user-facing lineage navigation and decision traceability.

Open Phase 4 work includes:

- traversing multi-step lineage paths
- tracing backwards from decisions to supporting knowledge
- tracing forwards from research or insight to downstream decisions and outcomes
- presenting relationship context without visual clutter
- distinguishing strong lineage from weak or missing support
- deciding how much of the canonical lineage path should be visible in the UI

## Known gaps

- Data is not browser-persisted.
- The UI does not yet expose multi-hop paths.
- There is no graph visualisation, by design.
- Relationship strength, confidence and evidence quality are not modelled yet.
- The fixed ontology may need refinement after user testing.
