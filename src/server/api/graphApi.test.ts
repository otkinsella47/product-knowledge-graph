import { describe, expect, it } from 'vitest';
import {
  type CreateEntityInput,
  type CreateRelationshipInput,
  type Relationship,
  type UpdateEntityInput,
} from '../../domain/graph';
import {
  createInMemoryGraphRepository,
  type GraphRepository,
} from '../../domain/graphRepository';
import { createPersistentGraphEngine } from '../domain/persistentGraphEngine';
import { type PersistentGraphRepository } from '../persistence/postgresGraphRepository';
import { handleGraphApiRequest } from './graphApi';

describe('graph API handler', () => {
  it('creates and lists persisted entities', async () => {
    const engine = createTestPersistentEngine();

    const createResponse = await handleGraphApiRequest(
      {
        method: 'POST',
        path: '/api/entities',
        body: {
          type: 'insight',
          title: 'Teams lose decision context',
          description: 'Decision rationale gets scattered.',
        },
      },
      { engine },
    );

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      entity: {
        type: 'insight',
        title: 'Teams lose decision context',
      },
    });

    const listResponse = await handleGraphApiRequest(
      {
        method: 'GET',
        path: '/api/entities',
      },
      { engine },
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toMatchObject({
      entities: [
        {
          type: 'insight',
          title: 'Teams lose decision context',
        },
      ],
    });
  });

  it('creates valid relationships and rejects invalid relationship combinations', async () => {
    const engine = createTestPersistentEngine();
    const researchResponse = await handleGraphApiRequest(
      {
        method: 'POST',
        path: '/api/entities',
        body: {
          type: 'research',
          title: 'Interview notes',
          description: 'Raw source material.',
        },
      },
      { engine },
    );
    const insightResponse = await handleGraphApiRequest(
      {
        method: 'POST',
        path: '/api/entities',
        body: {
          type: 'insight',
          title: 'Users miss onboarding value',
          description: 'An interpreted research finding.',
        },
      },
      { engine },
    );
    const research = getEntityFromResponse(researchResponse.body);
    const insight = getEntityFromResponse(insightResponse.body);

    const relationshipResponse = await handleGraphApiRequest(
      {
        method: 'POST',
        path: '/api/relationships',
        body: {
          type: 'produces',
          sourceEntityId: research.id,
          targetEntityId: insight.id,
        },
      },
      { engine },
    );

    expect(relationshipResponse.status).toBe(201);

    const invalidRelationshipResponse = await handleGraphApiRequest(
      {
        method: 'POST',
        path: '/api/relationships',
        body: {
          type: 'informs',
          sourceEntityId: research.id,
          targetEntityId: insight.id,
        },
      },
      { engine },
    );

    expect(invalidRelationshipResponse.status).toBe(400);
    expect(invalidRelationshipResponse.body).toMatchObject({
      error: 'Relationship is not allowed: research informs insight',
    });
  });

  it('deletes relationships before deleting connected entities', async () => {
    const engine = createTestPersistentEngine();
    const insight = await engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'An interpreted research finding.',
    });
    const decision = await engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding messaging',
      description: 'Revise first-run copy.',
    });
    const relationship = await engine.createRelationship({
      type: 'informs',
      sourceEntityId: insight.id,
      targetEntityId: decision.id,
    });

    const blockedDeleteResponse = await handleGraphApiRequest(
      {
        method: 'DELETE',
        path: `/api/entities/${insight.id}`,
      },
      { engine },
    );

    expect(blockedDeleteResponse.status).toBe(400);

    const deleteRelationshipResponse = await handleGraphApiRequest(
      {
        method: 'DELETE',
        path: `/api/relationships/${relationship.id}`,
      },
      { engine },
    );

    expect(deleteRelationshipResponse.status).toBe(204);

    const deleteEntityResponse = await handleGraphApiRequest(
      {
        method: 'DELETE',
        path: `/api/entities/${insight.id}`,
      },
      { engine },
    );

    expect(deleteEntityResponse.status).toBe(204);
  });
});

function createTestPersistentEngine() {
  const repository = createInMemoryGraphRepository({
    createId: createTestIdGenerator(),
    now: () => '2026-06-21T10:00:00.000Z',
  });

  return createPersistentGraphEngine(createAsyncRepository(repository));
}

function createAsyncRepository(
  repository: GraphRepository,
): PersistentGraphRepository {
  return {
    createEntity(input: CreateEntityInput) {
      return Promise.resolve(repository.createEntity(input));
    },
    updateEntity(id: string, input: UpdateEntityInput) {
      return Promise.resolve(repository.updateEntity(id, input));
    },
    deleteEntity(id: string) {
      return Promise.resolve(repository.deleteEntity(id));
    },
    getEntity(id: string) {
      return Promise.resolve(repository.getEntity(id));
    },
    listEntities() {
      return Promise.resolve(repository.listEntities());
    },
    createRelationship(input: CreateRelationshipInput) {
      return Promise.resolve(repository.createRelationship(input));
    },
    updateRelationship(id: string, input: Partial<Relationship>) {
      return Promise.resolve(repository.updateRelationship(id, input));
    },
    deleteRelationship(id: string) {
      return Promise.resolve(repository.deleteRelationship(id));
    },
    getRelationship(id: string) {
      return Promise.resolve(repository.getRelationship(id));
    },
    listRelationships() {
      return Promise.resolve(repository.listRelationships());
    },
  };
}

function getEntityFromResponse(body: unknown) {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('entity' in body) ||
    typeof body.entity !== 'object' ||
    body.entity === null ||
    !('id' in body.entity) ||
    typeof body.entity.id !== 'string'
  ) {
    throw new Error('Expected entity response body.');
  }

  return body.entity;
}

function createTestIdGenerator(): () => string {
  let nextId = 1;

  return () => `test-id-${nextId++}`;
}
