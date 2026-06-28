import {
  type CreateEntityInput,
  type CreateRelationshipInput,
  type Entity,
  type Relationship,
  type UpdateEntityInput,
  type UpdateRelationshipInput,
} from './graph';
import {
  isValidEntityType,
  isValidRelationshipType,
} from './ontology.js';

export type GraphRepository = {
  createEntity(input: CreateEntityInput): Entity;
  updateEntity(id: string, input: UpdateEntityInput): Entity | undefined;
  deleteEntity(id: string): boolean;
  getEntity(id: string): Entity | undefined;
  listEntities(): Entity[];
  createRelationship(input: CreateRelationshipInput): Relationship;
  updateRelationship(
    id: string,
    input: UpdateRelationshipInput,
  ): Relationship | undefined;
  deleteRelationship(id: string): boolean;
  getRelationship(id: string): Relationship | undefined;
  listRelationships(): Relationship[];
};

type InMemoryGraphRepositoryOptions = {
  now?: () => string;
  createId?: () => string;
  entities?: Entity[];
  relationships?: Relationship[];
};

export function createInMemoryGraphRepository(
  options: InMemoryGraphRepositoryOptions = {},
): GraphRepository {
  const entities = new Map<string, Entity>(
    options.entities?.map((entity) => [entity.id, entity]),
  );
  const relationships = new Map<string, Relationship>(
    options.relationships?.map((relationship) => [
      relationship.id,
      relationship,
    ]),
  );
  const now = options.now ?? (() => new Date().toISOString());
  const createId = options.createId ?? createSequentialId();

  return {
    createEntity(input) {
      if (!isValidEntityType(input.type)) {
        throw new Error(`Invalid entity type: ${input.type}`);
      }

      const timestamp = now();
      const entity: Entity = {
        id: createId(),
        type: input.type,
        title: input.title,
        description: input.description,
        metadata: input.metadata,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      entities.set(entity.id, entity);

      return entity;
    },

    updateEntity(id, input) {
      const existingEntity = entities.get(id);

      if (!existingEntity) {
        return undefined;
      }

      const updatedEntity: Entity = {
        ...existingEntity,
        ...input,
        updatedAt: now(),
      };

      entities.set(id, updatedEntity);

      return updatedEntity;
    },

    deleteEntity(id) {
      return entities.delete(id);
    },

    getEntity(id) {
      return entities.get(id);
    },

    listEntities() {
      return [...entities.values()];
    },

    createRelationship(input) {
      if (!isValidRelationshipType(input.type)) {
        throw new Error(`Invalid relationship type: ${input.type}`);
      }

      const timestamp = now();
      const relationship: Relationship = {
        id: createId(),
        type: input.type,
        sourceEntityId: input.sourceEntityId,
        targetEntityId: input.targetEntityId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      relationships.set(relationship.id, relationship);

      return relationship;
    },

    updateRelationship(id, input) {
      const existingRelationship = relationships.get(id);

      if (!existingRelationship) {
        return undefined;
      }

      if (input.type && !isValidRelationshipType(input.type)) {
        throw new Error(`Invalid relationship type: ${input.type}`);
      }

      const updatedRelationship: Relationship = {
        ...existingRelationship,
        ...input,
        updatedAt: now(),
      };

      relationships.set(id, updatedRelationship);

      return updatedRelationship;
    },

    deleteRelationship(id) {
      return relationships.delete(id);
    },

    getRelationship(id) {
      return relationships.get(id);
    },

    listRelationships() {
      return [...relationships.values()];
    },
  };
}

function createSequentialId(): () => string {
  let nextId = 1;

  return () => String(nextId++);
}
