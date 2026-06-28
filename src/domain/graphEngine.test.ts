import { describe, expect, it } from 'vitest';
import { createGraphEngine, GraphEngineError } from './graphEngine';
import { createInMemoryGraphRepository } from './graphRepository';

describe('graph engine', () => {
  it('creates, updates, gets and lists entities', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());

    const entity = engine.createEntity({
      type: 'research',
      title: 'Interview notes',
      description: 'User interview source material.',
    });

    expect(engine.getEntity(entity.id)).toEqual(entity);
    expect(
      engine.updateEntity(entity.id, {
        title: 'Customer interview notes',
      }),
    ).toMatchObject({
      id: entity.id,
      title: 'Customer interview notes',
    });
    expect(engine.listEntities()).toHaveLength(1);
  });

  it('creates valid relationships using the fixed ontology rules', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const research = engine.createEntity({
      type: 'research',
      title: 'Interview notes',
      description: 'User interview source material.',
    });
    const insight = engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
    });

    const relationship = engine.createRelationship({
      type: 'produces',
      sourceEntityId: research.id,
      targetEntityId: insight.id,
    });

    expect(relationship).toMatchObject({
      type: 'produces',
      sourceEntityId: research.id,
      targetEntityId: insight.id,
    });
  });

  it('rejects relationships that reference missing entities', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const insight = engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
    });

    expect(() =>
      engine.createRelationship({
        type: 'informs',
        sourceEntityId: 'missing-source-id',
        targetEntityId: insight.id,
      }),
    ).toThrow(GraphEngineError);
    expect(() =>
      engine.createRelationship({
        type: 'informs',
        sourceEntityId: insight.id,
        targetEntityId: 'missing-target-id',
      }),
    ).toThrow(GraphEngineError);
  });

  it('rejects source and target combinations that are not allowed by the ontology', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const research = engine.createEntity({
      type: 'research',
      title: 'Interview notes',
      description: 'User interview source material.',
    });
    const decision = engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding messaging.',
    });

    expect(() =>
      engine.createRelationship({
        type: 'informs',
        sourceEntityId: research.id,
        targetEntityId: decision.id,
      }),
    ).toThrow(
      'Relationship is not allowed: research informs decision',
    );
  });

  it('retrieves relationships and connected entities for an entity', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const insight = engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
    });
    const opportunity = engine.createEntity({
      type: 'opportunity',
      title: 'Clarify onboarding value',
      description: 'A user problem worth addressing.',
    });
    const decision = engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding messaging.',
    });
    const opportunityRelationship = engine.createRelationship({
      type: 'reveals',
      sourceEntityId: insight.id,
      targetEntityId: opportunity.id,
    });
    const decisionRelationship = engine.createRelationship({
      type: 'informs',
      sourceEntityId: insight.id,
      targetEntityId: decision.id,
    });

    expect(engine.getRelationshipsForEntity(insight.id)).toEqual([
      opportunityRelationship,
      decisionRelationship,
    ]);
    expect(engine.getConnectedEntities(insight.id)).toEqual([
      {
        entity: opportunity,
        relationship: opportunityRelationship,
        direction: 'outgoing',
      },
      {
        entity: decision,
        relationship: decisionRelationship,
        direction: 'outgoing',
      },
    ]);
    expect(engine.getConnectedEntities(decision.id)).toEqual([
      {
        entity: insight,
        relationship: decisionRelationship,
        direction: 'incoming',
      },
    ]);
  });

  it('retrieves incoming and outgoing connected knowledge separately', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const insight = engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
    });
    const opportunity = engine.createEntity({
      type: 'opportunity',
      title: 'Clarify onboarding value',
      description: 'A user problem worth addressing.',
    });
    const goal = engine.createEntity({
      type: 'goal',
      title: 'Improve activation',
      description: 'Increase the number of users who understand the product.',
    });
    const solution = engine.createEntity({
      type: 'solution',
      title: 'Rewrite first-run messaging',
      description: 'A proposed way to clarify the product value.',
    });
    const incomingRelationship = engine.createRelationship({
      type: 'reveals',
      sourceEntityId: insight.id,
      targetEntityId: opportunity.id,
    });
    const outgoingGoalRelationship = engine.createRelationship({
      type: 'supports',
      sourceEntityId: opportunity.id,
      targetEntityId: goal.id,
    });
    const outgoingSolutionRelationship = engine.createRelationship({
      type: 'motivates',
      sourceEntityId: opportunity.id,
      targetEntityId: solution.id,
    });

    expect(engine.getIncomingRelationshipsForEntity(opportunity.id)).toEqual([
      incomingRelationship,
    ]);
    expect(engine.getOutgoingRelationshipsForEntity(opportunity.id)).toEqual([
      outgoingGoalRelationship,
      outgoingSolutionRelationship,
    ]);
    expect(engine.getIncomingConnectedEntities(opportunity.id)).toEqual([
      {
        entity: insight,
        relationship: incomingRelationship,
        direction: 'incoming',
      },
    ]);
    expect(engine.getOutgoingConnectedEntities(opportunity.id)).toEqual([
      {
        entity: goal,
        relationship: outgoingGoalRelationship,
        direction: 'outgoing',
      },
      {
        entity: solution,
        relationship: outgoingSolutionRelationship,
        direction: 'outgoing',
      },
    ]);
    expect(engine.getDirectConnectedKnowledge(opportunity.id)).toMatchObject({
      entity: opportunity,
      incomingRelationships: [incomingRelationship],
      outgoingRelationships: [
        outgoingGoalRelationship,
        outgoingSolutionRelationship,
      ],
      relationships: [
        incomingRelationship,
        outgoingGoalRelationship,
        outgoingSolutionRelationship,
      ],
    });
    expect(engine.getDirectConnectedKnowledge('missing-id')).toBe(undefined);
  });

  it('retrieves a simple direct relationship path between connected entities', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const decision = engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding messaging.',
    });
    const outcome = engine.createEntity({
      type: 'outcome',
      title: 'Activation improved',
      description: 'More users understood the product value.',
    });
    const relationship = engine.createRelationship({
      type: 'influences',
      sourceEntityId: decision.id,
      targetEntityId: outcome.id,
    });

    expect(engine.getDirectRelationshipPath(decision.id, outcome.id)).toEqual({
      sourceEntity: decision,
      relationship,
      targetEntity: outcome,
    });
    expect(engine.getDirectRelationshipPath(outcome.id, decision.id)).toBe(
      undefined,
    );
  });

  it('retrieves a backward lineage path to the knowledge that led to an entity', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const lineage = createDecisionLineage(engine);

    const paths = engine.getBackwardLineagePaths(lineage.decision.id);
    const fullPath = paths.find((path) => path.endEntity.id === lineage.research.id);

    expect(fullPath).toBeDefined();
    expect(fullPath?.segments.map((segment) => segment.sourceEntity.type)).toEqual([
      'research',
      'insight',
      'opportunity',
      'solution',
      'experiment',
    ]);
    expect(fullPath?.segments.at(-1)?.targetEntity.type).toBe('decision');
    expect(fullPath?.segments.map((segment) => segment.statement)).toEqual([
      'Research produces Insight: Interview notes -> Users miss onboarding value',
      'Insight reveals Opportunity: Users miss onboarding value -> Clarify onboarding value',
      'Opportunity motivates Solution: Clarify onboarding value -> Rewrite first-run messaging',
      'Solution validated by Experiment: Rewrite first-run messaging -> Prototype test',
      'Experiment informs Decision: Prototype test -> Improve onboarding',
    ]);
  });

  it('retrieves forward lineage paths from an insight to decisions and outcomes', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const insight = engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
    });
    const decision = engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding messaging.',
    });
    const outcome = engine.createEntity({
      type: 'outcome',
      title: 'Activation improved',
      description: 'More users understood the product value.',
    });

    engine.createRelationship({
      type: 'informs',
      sourceEntityId: insight.id,
      targetEntityId: decision.id,
    });
    engine.createRelationship({
      type: 'influences',
      sourceEntityId: decision.id,
      targetEntityId: outcome.id,
    });

    const paths = engine.getForwardLineagePaths(insight.id);

    expect(paths).toHaveLength(2);
    expect(paths.map((path) => path.endEntity.type)).toEqual([
      'decision',
      'outcome',
    ]);
    expect(paths.map((path) => path.segments.length)).toEqual([1, 2]);
    expect(paths.at(-1)?.segments.map((segment) => segment.relationship.type)).toEqual([
      'informs',
      'influences',
    ]);
  });

  it('retrieves direct lineage paths in either direction', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const insight = engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
    });
    const decision = engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding messaging.',
    });
    const relationship = engine.createRelationship({
      type: 'informs',
      sourceEntityId: insight.id,
      targetEntityId: decision.id,
    });

    expect(engine.getForwardLineagePaths(insight.id)).toMatchObject([
      {
        direction: 'forward',
        startEntity: insight,
        endEntity: decision,
        segments: [
          {
            sourceEntity: insight,
            relationship,
            targetEntity: decision,
          },
        ],
      },
    ]);
    expect(engine.getBackwardLineagePaths(decision.id)).toMatchObject([
      {
        direction: 'backward',
        startEntity: decision,
        endEntity: insight,
        segments: [
          {
            sourceEntity: insight,
            relationship,
            targetEntity: decision,
          },
        ],
      },
    ]);
  });

  it('returns no lineage paths when an entity has no relationships in that direction', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const research = engine.createEntity({
      type: 'research',
      title: 'Interview notes',
      description: 'User interview source material.',
    });
    const outcome = engine.createEntity({
      type: 'outcome',
      title: 'Activation improved',
      description: 'More users understood the product value.',
    });

    expect(engine.getBackwardLineagePaths(research.id)).toEqual([]);
    expect(engine.getForwardLineagePaths(outcome.id)).toEqual([]);
    expect(engine.getLineagePaths('missing-id', 'forward')).toEqual([]);
  });

  it('limits lineage traversal by max depth', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const lineage = createDecisionLineage(engine);

    const paths = engine.getBackwardLineagePaths(lineage.decision.id, {
      maxDepth: 2,
    });

    expect(paths.map((path) => path.segments.length)).toEqual([1, 2]);
    expect(paths.map((path) => path.endEntity.type)).toEqual([
      'experiment',
      'solution',
    ]);
  });

  it('prevents infinite lineage traversal when ontology-valid cycles exist', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const insight = engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
    });
    const opportunity = engine.createEntity({
      type: 'opportunity',
      title: 'Clarify onboarding value',
      description: 'A user problem worth addressing.',
    });
    const solution = engine.createEntity({
      type: 'solution',
      title: 'Rewrite first-run messaging',
      description: 'A proposed way to clarify the product value.',
    });
    const experiment = engine.createEntity({
      type: 'experiment',
      title: 'Prototype test',
      description: 'Test revised first-run messaging.',
    });
    const decision = engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding messaging.',
    });
    const outcome = engine.createEntity({
      type: 'outcome',
      title: 'Activation improved',
      description: 'More users understood the product value.',
    });

    engine.createRelationship({
      type: 'reveals',
      sourceEntityId: insight.id,
      targetEntityId: opportunity.id,
    });
    engine.createRelationship({
      type: 'motivates',
      sourceEntityId: opportunity.id,
      targetEntityId: solution.id,
    });
    engine.createRelationship({
      type: 'validated_by',
      sourceEntityId: solution.id,
      targetEntityId: experiment.id,
    });
    engine.createRelationship({
      type: 'informs',
      sourceEntityId: experiment.id,
      targetEntityId: decision.id,
    });
    engine.createRelationship({
      type: 'influences',
      sourceEntityId: decision.id,
      targetEntityId: outcome.id,
    });
    engine.createRelationship({
      type: 'produces',
      sourceEntityId: outcome.id,
      targetEntityId: insight.id,
    });

    const paths = engine.getForwardLineagePaths(insight.id, { maxDepth: 10 });

    expect(paths).toHaveLength(5);
    expect(paths.map((path) => path.endEntity.type)).toEqual([
      'opportunity',
      'solution',
      'experiment',
      'decision',
      'outcome',
    ]);
    expect(
      paths.some((path) => path.endEntity.id === insight.id),
    ).toBe(false);
  });

  it('summarises a well-supported decision with upstream lineage and downstream outcome', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const lineage = createDecisionLineage(engine);
    const outcome = engine.createEntity({
      type: 'outcome',
      title: 'Activation improved',
      description: 'More users understood the product value.',
    });

    engine.createRelationship({
      type: 'influences',
      sourceEntityId: lineage.decision.id,
      targetEntityId: outcome.id,
    });

    const summary = engine.getDecisionTraceabilitySummary(lineage.decision.id);

    expect(summary?.decision).toEqual(lineage.decision);
    expect(summary?.supportingLineagePaths.length).toBeGreaterThan(0);
    expect(
      summary?.supportingLineagePaths.some(
        (path) => path.endEntity.id === lineage.research.id,
      ),
    ).toBe(true);
    expect(summary?.downstreamOutcomePaths).toMatchObject([
      {
        direction: 'forward',
        startEntity: lineage.decision,
        endEntity: outcome,
      },
    ]);
    expect(summary?.traceabilityGaps).toEqual([]);
  });

  it('summarises a decision with direct insight support only', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const insight = engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
    });
    const decision = engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding messaging.',
    });
    const outcome = engine.createEntity({
      type: 'outcome',
      title: 'Activation improved',
      description: 'More users understood the product value.',
    });

    engine.createRelationship({
      type: 'informs',
      sourceEntityId: insight.id,
      targetEntityId: decision.id,
    });
    engine.createRelationship({
      type: 'influences',
      sourceEntityId: decision.id,
      targetEntityId: outcome.id,
    });

    const summary = engine.getDecisionTraceabilitySummary(decision.id);

    expect(summary?.supportingLineagePaths).toHaveLength(1);
    expect(summary?.supportingLineagePaths[0]).toMatchObject({
      direction: 'backward',
      startEntity: decision,
      endEntity: insight,
    });
    expect(summary?.traceabilityGaps).toEqual([]);
  });

  it('summarises a decision with direct experiment support only', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const experiment = engine.createEntity({
      type: 'experiment',
      title: 'Prototype test',
      description: 'A test of the proposed traceability view.',
    });
    const decision = engine.createEntity({
      type: 'decision',
      title: 'Build lineage navigation',
      description: 'Decision to build Phase 4 lineage navigation.',
    });
    const outcome = engine.createEntity({
      type: 'outcome',
      title: 'Reviewers understood rationale',
      description: 'Outcome from reviewing the traceability flow.',
    });

    engine.createRelationship({
      type: 'informs',
      sourceEntityId: experiment.id,
      targetEntityId: decision.id,
    });
    engine.createRelationship({
      type: 'influences',
      sourceEntityId: decision.id,
      targetEntityId: outcome.id,
    });

    const summary = engine.getDecisionTraceabilitySummary(decision.id);

    expect(summary?.supportingLineagePaths).toHaveLength(1);
    expect(summary?.supportingLineagePaths[0]).toMatchObject({
      direction: 'backward',
      startEntity: decision,
      endEntity: experiment,
    });
    expect(summary?.downstreamOutcomePaths).toHaveLength(1);
    expect(summary?.traceabilityGaps).toEqual([]);
  });

  it('identifies traceability gaps for a decision with no supporting lineage', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const decision = engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding messaging.',
    });
    const outcome = engine.createEntity({
      type: 'outcome',
      title: 'Activation improved',
      description: 'More users understood the product value.',
    });

    engine.createRelationship({
      type: 'influences',
      sourceEntityId: decision.id,
      targetEntityId: outcome.id,
    });

    const summary = engine.getDecisionTraceabilitySummary(decision.id);

    expect(summary?.supportingLineagePaths).toEqual([]);
    expect(summary?.downstreamOutcomePaths).toHaveLength(1);
    expect(summary?.traceabilityGaps).toEqual([
      {
        code: 'missing_supporting_lineage',
        label: 'Missing connection',
        message: 'No incoming supporting lineage is connected to this decision.',
      },
      {
        code: 'missing_upstream_knowledge',
        label: 'Lineage gap',
        message:
          'No upstream Research, Insight or Experiment is connected to this decision.',
      },
    ]);
  });

  it('identifies a missing downstream outcome for a decision', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const lineage = createDecisionLineage(engine);

    const summary = engine.getDecisionTraceabilitySummary(lineage.decision.id);

    expect(summary?.supportingLineagePaths.length).toBeGreaterThan(0);
    expect(summary?.downstreamOutcomePaths).toEqual([]);
    expect(summary?.traceabilityGaps).toEqual([
      {
        code: 'missing_downstream_outcome',
        label: 'Missing connection',
        message: 'No downstream Outcome is connected to this decision.',
      },
    ]);
  });

  it('returns undefined for invalid decision traceability entity IDs', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());

    expect(engine.getDecisionTraceabilitySummary('missing-id')).toBe(undefined);
  });

  it('returns undefined when decision traceability is requested for a non-decision entity', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const insight = engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
    });

    expect(engine.getDecisionTraceabilitySummary(insight.id)).toBe(undefined);
  });

  it('prevents deleting entities while relationships exist', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const insight = engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
    });
    const decision = engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding messaging.',
    });
    const relationship = engine.createRelationship({
      type: 'informs',
      sourceEntityId: insight.id,
      targetEntityId: decision.id,
    });

    expect(() => engine.deleteEntity(insight.id)).toThrow(
      `Cannot delete entity with existing relationships: ${insight.id}`,
    );
    expect(engine.deleteRelationship(relationship.id)).toBe(true);
    expect(engine.deleteEntity(insight.id)).toBe(true);
  });
});

function createDecisionLineage(engine: ReturnType<typeof createGraphEngine>) {
  const research = engine.createEntity({
    type: 'research',
    title: 'Interview notes',
    description: 'User interview source material.',
  });
  const insight = engine.createEntity({
    type: 'insight',
    title: 'Users miss onboarding value',
    description: 'An interpreted research finding.',
  });
  const opportunity = engine.createEntity({
    type: 'opportunity',
    title: 'Clarify onboarding value',
    description: 'A user problem worth addressing.',
  });
  const solution = engine.createEntity({
    type: 'solution',
    title: 'Rewrite first-run messaging',
    description: 'A proposed way to clarify the product value.',
  });
  const experiment = engine.createEntity({
    type: 'experiment',
    title: 'Prototype test',
    description: 'Test revised first-run messaging.',
  });
  const decision = engine.createEntity({
    type: 'decision',
    title: 'Improve onboarding',
    description: 'Decision to improve onboarding messaging.',
  });

  engine.createRelationship({
    type: 'produces',
    sourceEntityId: research.id,
    targetEntityId: insight.id,
  });
  engine.createRelationship({
    type: 'reveals',
    sourceEntityId: insight.id,
    targetEntityId: opportunity.id,
  });
  engine.createRelationship({
    type: 'motivates',
    sourceEntityId: opportunity.id,
    targetEntityId: solution.id,
  });
  engine.createRelationship({
    type: 'validated_by',
    sourceEntityId: solution.id,
    targetEntityId: experiment.id,
  });
  engine.createRelationship({
    type: 'informs',
    sourceEntityId: experiment.id,
    targetEntityId: decision.id,
  });

  return {
    research,
    insight,
    opportunity,
    solution,
    experiment,
    decision,
  };
}
