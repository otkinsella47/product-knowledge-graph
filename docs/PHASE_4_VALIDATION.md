# Phase 4 Validation

Use the in-app **Load demo data** action to seed the in-memory workspace with a
small v0.1 ontology scenario. Use **Reset workspace** to return to an empty
workspace.

## Manual Checklist

- Load the demo data and select **Build Phase 4 lineage navigation**.
- Confirm the decision traceability view shows supporting lineage from
  **Interview notes: decision context loss** through Insight, Opportunity,
  Solution and Experiment.
- Confirm the same decision shows a downstream outcome:
  **Reviewers understood decision context**.
- Select **Teams lose decision rationale** and confirm **Lineage > What
  followed** reaches downstream Opportunity, Solution, Experiment, Decision and
  Outcome entities.
- Select **Pilot unsupported prioritisation view** and confirm the lineage gap
  messages identify missing incoming support and no downstream outcome.
- Create a new entity, add a valid relationship, remove the relationship, edit
  the entity and delete it to confirm the direct relationship workflows still
  work after loading or resetting demo data.
