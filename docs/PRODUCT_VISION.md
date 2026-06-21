# Product Vision

## North Star

Improve product decisions through explainable knowledge lineage.

## Vision

Product Knowledge Graph is a trusted knowledge and reasoning layer for product teams.

It helps people and AI systems make better product decisions by preserving the relationships between product knowledge, decisions and outcomes.

## Problem

Product work is rarely linear.

A research interview can lead to several insights. An insight can reveal multiple opportunities. A solution can create new questions, experiments and trade-offs. A decision can lead to outcomes that change how the team understands the original problem.

Most product knowledge is stored in documents, tickets, roadmaps, meeting notes and research repositories. These tools are useful, but they often lose the relationships between information.

Common problems:

- teams forget why a decision was made
- research becomes disconnected from delivery
- opportunities lose their link to goals
- solutions are chosen without preserving the trade-offs
- outcomes are not connected back to earlier decisions
- new team members have to rebuild context manually
- AI tools lack the structured context needed for reliable reasoning

The result is weaker decision-making, repeated context-setting and lower trust in both human and AI recommendations.

## Core idea

Product knowledge is relational.

The value of the system is not just storing research, insights or decisions. The value comes from making the relationships between them explicit.

A product team should be able to move through the knowledge network and answer:

- What led us to this decision?
- Which insights support this opportunity?
- Which goal does this work support?
- What alternatives were considered?
- Which experiment changed our direction?
- What happened after we made the decision?
- What did we learn?

## Knowledge lineage

Knowledge lineage is the traceable path between product knowledge objects.

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

Lineage is not a separate artefact. It is created by the relationships between entities.

The system should make lineage easy to inspect from either direction:

- backwards from a decision to its supporting knowledge
- forwards from research or insight to the decisions and outcomes it influenced

## AI reasoning

The main AI opportunity is reasoning over connected product knowledge.

The product should not be centred on generic artefact generation. PRDs, user stories and summaries may be useful outputs, but they are not the differentiating capability.

The stronger opportunity is to help AI answer questions such as:

- Which decisions have weak support?
- Which opportunities have the strongest lineage?
- Which assumptions remain untested?
- Which outcomes contradict earlier expectations?
- Why is this solution being recommended?
- What knowledge is missing before a decision can be made?

AI recommendations should be explainable through the graph relationships used to produce them.

## Trust and governance

Product knowledge can include customer research, personal data, strategy, commercial information and executive decisions.

The first version does not need enterprise governance, but the product should be designed with future trust requirements in mind.

Future capabilities may include:

- workspace ownership
- entity ownership
- classification metadata
- permission-aware AI reasoning
- audit trails
- explainable recommendations
- configurable governance rules

## Ontology direction

Different teams structure product work differently.

Examples include:

- Opportunity Solution Trees
- Jobs To Be Done
- product discovery workflows
- data product workflows
- domain-specific operating models

The long-term product should support configurable ontologies and relationship types.

The first version should not start there. It should use a fixed, opinionated ontology so the team can validate the core product value before adding flexibility.

## v0.1 product stance

v0.1 should prove whether explainable knowledge lineage is valuable.

The first version should favour:

- clear relationships
- simple workflows
- fast iteration
- user feedback
- useful lineage views
- grounded AI reasoning experiments

It should avoid:

- broad AI toolkit features
- fully configurable ontologies
- enterprise governance
- complex infrastructure
- graph visualisation that does not improve decision traceability
- automation before the underlying reasoning workflow is clear
