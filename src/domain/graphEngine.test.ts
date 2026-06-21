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
