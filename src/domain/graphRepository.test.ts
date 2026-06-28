import { describe, expect, it } from 'vitest';
import { createInMemoryGraphRepository } from './graphRepository';

describe('in-memory graph repository', () => {
  it('stores and retrieves entities', () => {
    const repository = createInMemoryGraphRepository({
      createId: createTestIdGenerator(),
      now: () => '2026-06-21T10:00:00.000Z',
    });

    const entity = repository.createEntity({
      type: 'insight',
      title: 'Teams lose decision context',
      description: 'Decision rationale often becomes scattered after discovery.',
      metadata: {
        sourceCount: 3,
        reviewed: true,
      },
    });

    expect(repository.getEntity(entity.id)).toEqual({
      id: 'test-id-1',
      type: 'insight',
      title: 'Teams lose decision context',
      description: 'Decision rationale often becomes scattered after discovery.',
      metadata: {
        sourceCount: 3,
        reviewed: true,
      },
      createdAt: '2026-06-21T10:00:00.000Z',
      updatedAt: '2026-06-21T10:00:00.000Z',
    });
    expect(repository.listEntities()).toEqual([entity]);
  });

  it('updates entities without changing their created timestamp', () => {
    const timestamps = [
      '2026-06-21T10:00:00.000Z',
      '2026-06-21T11:00:00.000Z',
    ];
    const repository = createInMemoryGraphRepository({
      createId: createTestIdGenerator(),
      now: () => timestamps.shift() ?? '2026-06-21T12:00:00.000Z',
    });

    const entity = repository.createEntity({
      type: 'decision',
      title: 'Prioritise onboarding',
      description: 'Initial decision',
    });

    expect(
      repository.updateEntity(entity.id, {
        title: 'Prioritise onboarding clarity',
      }),
    ).toEqual({
      ...entity,
      title: 'Prioritise onboarding clarity',
      updatedAt: '2026-06-21T11:00:00.000Z',
    });
  });

  it('stores and retrieves relationships between entities', () => {
    const repository = createInMemoryGraphRepository({
      createId: createTestIdGenerator(),
      now: () => '2026-06-21T10:00:00.000Z',
    });
    const sourceEntity = repository.createEntity({
      type: 'insight',
      title: 'Users miss the value proposition',
      description: 'Research shows onboarding copy is unclear.',
    });
    const targetEntity = repository.createEntity({
      type: 'decision',
      title: 'Improve onboarding messaging',
      description: 'Decision to revise first-run copy.',
    });

    const relationship = repository.createRelationship({
      type: 'informs',
      sourceEntityId: sourceEntity.id,
      targetEntityId: targetEntity.id,
    });

    expect(repository.getRelationship(relationship.id)).toEqual({
      id: 'test-id-3',
      type: 'informs',
      sourceEntityId: 'test-id-1',
      targetEntityId: 'test-id-2',
      createdAt: '2026-06-21T10:00:00.000Z',
      updatedAt: '2026-06-21T10:00:00.000Z',
    });
    expect(repository.listRelationships()).toEqual([relationship]);
  });

  it('updates relationships without changing their created timestamp', () => {
    const timestamps = [
      '2026-06-21T10:00:00.000Z',
      '2026-06-21T11:00:00.000Z',
    ];
    const repository = createInMemoryGraphRepository({
      createId: createTestIdGenerator(),
      now: () => timestamps.shift() ?? '2026-06-21T12:00:00.000Z',
    });
    const relationship = repository.createRelationship({
      type: 'informs',
      sourceEntityId: 'source-id',
      targetEntityId: 'target-id',
    });

    expect(
      repository.updateRelationship(relationship.id, {
        targetEntityId: 'new-target-id',
      }),
    ).toEqual({
      ...relationship,
      targetEntityId: 'new-target-id',
      updatedAt: '2026-06-21T11:00:00.000Z',
    });
  });

  it('returns undefined when updating missing records', () => {
    const repository = createInMemoryGraphRepository();

    expect(repository.updateEntity('missing-id', { title: 'Updated' })).toBe(
      undefined,
    );
    expect(
      repository.updateRelationship('missing-id', { sourceEntityId: 'new-id' }),
    ).toBe(undefined);
  });

  it('rejects invalid entity and relationship type values at runtime', () => {
    const repository = createInMemoryGraphRepository();

    expect(() =>
      repository.createEntity({
        type: 'assumption' as never,
        title: 'Invalid entity',
        description: 'This type is not part of the fixed ontology.',
      }),
    ).toThrow('Invalid entity type: assumption');

    expect(() =>
      repository.createRelationship({
        type: 'blocks' as never,
        sourceEntityId: 'source-id',
        targetEntityId: 'target-id',
      }),
    ).toThrow('Invalid relationship type: blocks');
  });
});

function createTestIdGenerator(): () => string {
  let nextId = 1;

  return () => `test-id-${nextId++}`;
}
