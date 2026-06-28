# Phase 4 Completion

## What was built

Phase 4 turned the Phase 3 connected-knowledge foundation into user-facing lineage navigation and decision traceability.

The app now supports:

- multi-hop lineage traversal in both directions
- lineage chains from upstream knowledge to downstream decisions and outcomes
- decision traceability summaries for supporting lineage and downstream outcomes
- traceability gap checks for unsupported decisions and decisions without outcomes
- demo data for manual Phase 4 validation
- collapsible lineage and direct-connection panels that keep the UI focused for product users

Phase 4 intentionally does not add AI reasoning, graph visualisation, configurable ontology work, relationship strength scoring or evidence-quality modelling.

## Important APIs and Components

- `src/domain/graphEngine.ts`
  - `getBackwardLineagePaths(entityId, options)`
  - `getForwardLineagePaths(entityId, options)`
  - `getLineagePaths(entityId, direction, options)`
  - `getDecisionTraceabilitySummary(decisionId)`
- `src/domain/lineage.ts`
  - fixed v0.1 lineage semantics and relationship descriptions
  - canonical lineage path helper
  - relationship option grouping helpers
- `src/App.tsx`
  - `LineageTrackerSection`
  - `LineageChainGroup`
  - `TraceabilityGapGroup`
  - demo workspace loading and reset actions

## How to Manually Test

1. Run the app with `npm run dev`.
2. Use **Load demo data**.
3. Select **Build Phase 4 lineage navigation**.
4. Open **Lineage tracker** and confirm **Lineage chains** shows the route from research through insight, opportunity, solution and experiment to the selected decision, then onward to the outcome.
5. Confirm **Traceability gaps** says there are no gaps for the supported demo decision.
6. Select **Teams lose decision rationale** and confirm forward lineage reaches the downstream decision and outcome.
7. Select **Pilot unsupported prioritisation view** and confirm **Traceability gaps** identifies missing support and missing downstream outcome.
8. Create, edit, connect, disconnect and delete entities to confirm Phase 3 direct relationship workflows still work.

See `docs/PHASE_4_VALIDATION.md` for the shorter validation checklist.

## Known Limitations

- Data remains in memory and is lost on browser refresh.
- Lineage traversal is bounded by a max depth rather than optimised for large graphs.
- Traceability gaps are structural checks only; they do not judge relationship strength, confidence or evidence quality.
- The ontology remains fixed for v0.1.
- The UI uses readable lineage chains and direct connections rather than a graph visualisation.

## Recommended Phase 5 Starting Point

Start Phase 5 with a narrow AI reasoning experiment that consumes the existing lineage APIs and explains decision context from connected knowledge.

The first useful experiment should be read-only and relationship-grounded, such as:

- explain what supports a selected decision
- summarise missing structural connections
- list the lineage paths used as source context

Do not start with configurable ontologies, evidence scoring or generic artefact generation.
