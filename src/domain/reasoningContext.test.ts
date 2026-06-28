import { describe, expect, it } from 'vitest';
import { createGraphEngine } from './graphEngine';
import { createInMemoryGraphRepository } from './graphRepository';
import { buildReasoningContext } from './reasoningContext';

describe('reasoning context', () => {
  it('builds context for a decision with upstream lineage and downstream outcome', () => {
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

    const context = buildReasoningContext(engine, lineage.decision.id);

    expect(context).toMatchObject({
      selectedEntity: {
        id: lineage.decision.id,
        type: 'decision',
        title: 'Improve onboarding',
      },
      entityType: 'decision',
      description: 'Decision to improve onboarding messaging.',
      deterministicSignals: [],
    });
    expect(context?.directIncomingRelationships).toHaveLength(1);
    expect(context?.directOutgoingRelationships).toHaveLength(1);
    expect(
      context?.lineagePaths.some((path) =>
        path.entityIds.includes(lineage.research.id),
      ),
    ).toBe(true);
    expect(
      context?.decisionTraceabilitySummary?.downstreamOutcomePathIds,
    ).toHaveLength(1);
  });

  it('identifies a decision with missing upstream support', () => {
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

    const context = buildReasoningContext(engine, decision.id);

    expect(context?.deterministicSignals.map((signal) => signal.type)).toEqual([
      'decision_missing_supporting_lineage',
      'decision_missing_upstream_knowledge',
    ]);
    expect(context?.decisionTraceabilitySummary?.traceabilityGaps).toHaveLength(2);
  });

  it('identifies a decision with no downstream outcome', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const lineage = createDecisionLineage(engine);

    const context = buildReasoningContext(engine, lineage.decision.id);

    expect(context?.deterministicSignals).toMatchObject([
      {
        type: 'decision_missing_downstream_outcome',
        priority: 'gap',
        relatedEntityIds: [lineage.decision.id],
        suggestedNextConnection: {
          relationshipType: 'influences',
          sourceEntityId: lineage.decision.id,
          targetEntityType: 'outcome',
        },
      },
    ]);
  });

  it('builds context for an insight with downstream lineage', () => {
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

    const context = buildReasoningContext(engine, insight.id);

    expect(context?.entityType).toBe('insight');
    expect(context?.directOutgoingRelationships).toHaveLength(1);
    expect(context?.lineagePaths.map((path) => path.endEntityId)).toEqual([
      decision.id,
      outcome.id,
    ]);
    expect(context?.deterministicSignals).toEqual([]);
  });

  it('identifies an opportunity without supporting insight', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const opportunity = engine.createEntity({
      type: 'opportunity',
      title: 'Clarify onboarding value',
      description: 'A user problem worth addressing.',
    });
    const goal = engine.createEntity({
      type: 'goal',
      title: 'Improve activation',
      description: 'Increase users who understand the product.',
    });

    engine.createRelationship({
      type: 'supports',
      sourceEntityId: opportunity.id,
      targetEntityId: goal.id,
    });

    const context = buildReasoningContext(engine, opportunity.id);

    expect(context?.deterministicSignals).toMatchObject([
      {
        type: 'opportunity_missing_supporting_insight',
        priority: 'important',
        relatedEntityIds: [opportunity.id],
      },
    ]);
  });

  it('identifies a solution without a validating experiment', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
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

    engine.createRelationship({
      type: 'motivates',
      sourceEntityId: opportunity.id,
      targetEntityId: solution.id,
    });

    const context = buildReasoningContext(engine, solution.id);

    expect(context?.deterministicSignals).toMatchObject([
      {
        type: 'solution_missing_validating_experiment',
        priority: 'gap',
        relatedEntityIds: [solution.id],
      },
    ]);
  });

  it('builds context for an entity with direct connections but no multi-hop lineage', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const goal = engine.createEntity({
      type: 'goal',
      title: 'Improve activation',
      description: 'Increase users who understand the product.',
    });
    const opportunity = engine.createEntity({
      type: 'opportunity',
      title: 'Clarify onboarding value',
      description: 'A user problem worth addressing.',
    });

    engine.createRelationship({
      type: 'frames',
      sourceEntityId: goal.id,
      targetEntityId: opportunity.id,
    });

    const context = buildReasoningContext(engine, goal.id);

    expect(context?.directOutgoingRelationships).toHaveLength(1);
    expect(context?.lineagePaths).toMatchObject([
      {
        direction: 'forward',
        startEntityId: goal.id,
        endEntityId: opportunity.id,
      },
    ]);
    expect(context?.lineagePaths[0].segments).toHaveLength(1);
  });

  it('builds compact empty context for an entity with no connections', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const research = engine.createEntity({
      type: 'research',
      title: 'Interview notes',
      description: 'User interview source material.',
    });

    const context = buildReasoningContext(engine, research.id);

    expect(context).toMatchObject({
      selectedEntity: {
        id: research.id,
        type: 'research',
        title: 'Interview notes',
      },
      directIncomingRelationships: [],
      directOutgoingRelationships: [],
      lineagePaths: [],
      deterministicSignals: [],
    });
  });

  it('returns undefined for an invalid entity id', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());

    expect(buildReasoningContext(engine, 'missing-id')).toBe(undefined);
  });

  it('returns compact serialisable output', () => {
    const engine = createGraphEngine(createInMemoryGraphRepository());
    const lineage = createDecisionLineage(engine);

    const context = buildReasoningContext(engine, lineage.decision.id);
    const parsedContext = JSON.parse(JSON.stringify(context));

    expect(parsedContext.selectedEntity).toEqual({
      id: lineage.decision.id,
      type: 'decision',
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding messaging.',
    });
    expect(parsedContext.lineagePaths[0]).toEqual(
      expect.not.objectContaining({
        startEntity: expect.anything(),
        endEntity: expect.anything(),
      }),
    );
    expect(parsedContext.lineagePaths[0].segments[0]).toEqual(
      expect.not.objectContaining({
        sourceEntity: expect.anything(),
        targetEntity: expect.anything(),
        relationship: expect.anything(),
      }),
    );
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
