import {
  type CreateEntityInput,
  type CreateRelationshipInput,
  type Entity,
  type Relationship,
  type UpdateEntityInput,
} from '../../domain/graph';
import { GraphEngineError } from '../../domain/graphEngine.js';
import {
  isValidEntityType,
  isValidRelationshipType,
} from '../../domain/ontology.js';
import { type PersistentGraphEngine } from '../domain/persistentGraphEngine.js';

export type GraphApiRequest = {
  method: string;
  path: string;
  body?: unknown;
};

export type GraphApiResponse = {
  status: number;
  body?: unknown;
};

export type GraphApiDependencies = {
  engine: PersistentGraphEngine;
};

export async function handleGraphApiRequest(
  request: GraphApiRequest,
  { engine }: GraphApiDependencies,
): Promise<GraphApiResponse> {
  try {
    const route = parseRoute(request.path);

    if (!route) {
      return notFound();
    }

    if (route.resource === 'entities') {
      return await handleEntitiesRequest(request, route.id, engine);
    }

    return await handleRelationshipsRequest(request, route.id, engine);
  } catch (error) {
    return handleApiError(error);
  }
}

async function handleEntitiesRequest(
  request: GraphApiRequest,
  entityId: string | undefined,
  engine: PersistentGraphEngine,
): Promise<GraphApiResponse> {
  if (request.method === 'GET' && !entityId) {
    return ok({ entities: await engine.listEntities() });
  }

  if (request.method === 'POST' && !entityId) {
    const input = parseCreateEntityInput(request.body);

    return created({ entity: await engine.createEntity(input) });
  }

  if (request.method === 'PATCH' && entityId) {
    const input = parseUpdateEntityInput(request.body);
    const entity = await engine.updateEntity(entityId, input);

    return entity ? ok({ entity }) : notFound();
  }

  if (request.method === 'DELETE' && entityId) {
    const deleted = await engine.deleteEntity(entityId);

    return deleted ? noContent() : notFound();
  }

  return notFound();
}

async function handleRelationshipsRequest(
  request: GraphApiRequest,
  relationshipId: string | undefined,
  engine: PersistentGraphEngine,
): Promise<GraphApiResponse> {
  if (request.method === 'GET' && !relationshipId) {
    return ok({ relationships: await engine.listRelationships() });
  }

  if (request.method === 'POST' && !relationshipId) {
    const input = parseCreateRelationshipInput(request.body);

    return created({ relationship: await engine.createRelationship(input) });
  }

  if (request.method === 'DELETE' && relationshipId) {
    const deleted = await engine.deleteRelationship(relationshipId);

    return deleted ? noContent() : notFound();
  }

  return notFound();
}

function parseCreateEntityInput(body: unknown): CreateEntityInput {
  if (!isRecord(body)) {
    throw new ApiInputError('Request body is required.');
  }

  const type = body.type;
  const title = body.title;
  const description = body.description;

  if (typeof type !== 'string' || !isValidEntityType(type)) {
    throw new ApiInputError('Entity type is invalid.');
  }

  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new ApiInputError('Entity title is required.');
  }

  if (typeof description !== 'string' || description.trim().length === 0) {
    throw new ApiInputError('Entity description is required.');
  }

  return {
    type,
    title: title.trim(),
    description: description.trim(),
  };
}

function parseUpdateEntityInput(body: unknown): UpdateEntityInput {
  if (!isRecord(body)) {
    throw new ApiInputError('Request body is required.');
  }

  const input: UpdateEntityInput = {};

  if ('title' in body) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      throw new ApiInputError('Entity title is required.');
    }

    input.title = body.title.trim();
  }

  if ('description' in body) {
    if (
      typeof body.description !== 'string' ||
      body.description.trim().length === 0
    ) {
      throw new ApiInputError('Entity description is required.');
    }

    input.description = body.description.trim();
  }

  return input;
}

function parseCreateRelationshipInput(body: unknown): CreateRelationshipInput {
  if (!isRecord(body)) {
    throw new ApiInputError('Request body is required.');
  }

  const type = body.type;
  const sourceEntityId = body.sourceEntityId;
  const targetEntityId = body.targetEntityId;

  if (typeof type !== 'string' || !isValidRelationshipType(type)) {
    throw new ApiInputError('Relationship type is invalid.');
  }

  if (typeof sourceEntityId !== 'string' || sourceEntityId.length === 0) {
    throw new ApiInputError('Relationship source entity is required.');
  }

  if (typeof targetEntityId !== 'string' || targetEntityId.length === 0) {
    throw new ApiInputError('Relationship target entity is required.');
  }

  return {
    type,
    sourceEntityId,
    targetEntityId,
  };
}

function parseRoute(path: string):
  | {
      resource: 'entities' | 'relationships';
      id?: string;
    }
  | undefined {
  const url = new URL(path, 'http://localhost');
  const segments = url.pathname.split('/').filter(Boolean);

  if (segments[0] !== 'api') {
    return undefined;
  }

  if (segments[1] !== 'entities' && segments[1] !== 'relationships') {
    return undefined;
  }

  if (segments.length > 3) {
    return undefined;
  }

  return {
    resource: segments[1],
    id: segments[2],
  };
}

function handleApiError(error: unknown): GraphApiResponse {
  if (error instanceof ApiInputError || error instanceof GraphEngineError) {
    return {
      status: 400,
      body: {
        error: error.message,
      },
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: {
        error: error.message,
      },
    };
  }

  return {
    status: 500,
    body: {
      error: 'Unexpected API error.',
    },
  };
}

function ok(body: unknown): GraphApiResponse {
  return {
    status: 200,
    body,
  };
}

function created(body: unknown): GraphApiResponse {
  return {
    status: 201,
    body,
  };
}

function noContent(): GraphApiResponse {
  return {
    status: 204,
  };
}

function notFound(): GraphApiResponse {
  return {
    status: 404,
    body: {
      error: 'Not found.',
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

class ApiInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiInputError';
  }
}

export type GraphApiSnapshot = {
  entities: Entity[];
  relationships: Relationship[];
};
