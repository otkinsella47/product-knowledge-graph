# Phase 4 Validation

Use the in-app **Load demo data** action to seed the in-memory workspace with a
small v0.1 ontology scenario. Use **Reset workspace** to return to an empty
workspace.

## Manual Checklist

- Load the demo data and select **Build Phase 4 lineage navigation**.
- Confirm **Lineage tracker > Lineage chains** shows supporting lineage from
  **Interview notes: decision context loss** through Insight, Opportunity,
  Solution and Experiment to the selected Decision.
- Confirm the same lineage chain continues to the downstream outcome
  **Reviewers understood decision context** where connected.
- Collapse and expand the lineage tracker subsections to confirm the Details
  panel can hide and show lineage content without losing context.
- Select **Teams lose decision rationale** and confirm **Lineage tracker >
  Lineage chains** reaches downstream Opportunity, Solution, Experiment,
  Decision and Outcome entities.
- Select **Pilot unsupported prioritisation view** and confirm **Lineage tracker
  > Traceability gaps** identifies missing incoming support and no downstream
  outcome.
- Create a new entity, use **Connect this entity** to add a valid direct
  connection, remove the connection, edit the entity and delete it to confirm
  the direct connection workflows still work after loading or resetting demo
  data.
