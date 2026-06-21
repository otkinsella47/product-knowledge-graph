import {
  type CreateEntityInput,
  type CreateRelationshipInput,
  type Entity,
  type Relationship,
  type UpdateEntityInput,
} from './graph';
import { type GraphRepository } from './graphRepository';
import { isAllowedRelationship } from './ontology';

export class GraphEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphEngineError';
  }
}

export type ConnectedEntity = {
  entity: Entity;
  relationship: Relationship;
  direction: 'incoming' | 'outgoing';
};

export type GraphEngine = {
  createEntity(input: CreateEntityInput): Entity;
  updateEntity(id: string, input: UpdateEntityInput): Entity | undefined;
  deleteEntity(id: string): boolean;
  getEntity(id: string): Entity | undefined;
  listEntities(): Entity[];
  createRelationship(input: CreateRelationshipInput): Relationship;
  deleteRelationship(id: string): boolean;
  getRelationshipsForEntity(entityId: string): Relationship[];
  getConnectedEntities(entityId: string): ConnectedEntity[];
  validateRelationship(input: CreateRelationshipInput): void;
};

export function createGraphEngine(repository: GraphRepository): GraphEngine {
  return {
    createEntity(input) {
      return repository.createEntity(input);
    },

    updateEntity(id, input) {
      return repository.updateEntity(id, input);
    },

    deleteEntity(id) {
      const relationships = getRelationshipsForEntity(repository, id);

      if (relationships.length > 0) {
        throw new GraphEngineError(
          `Cannot delete entity with existing relationships: ${id}`,
        );
      }

      return repository.deleteEntity(id);
    },

    getEntity(id) {
      return repository.getEntity(id);
    },

    listEntities() {
      return repository.listEntities();
    },

    createRelationship(input) {
      this.validateRelationship(input);

      return repository.createRelationship(input);
    },

    deleteRelationship(id) {
      return repository.deleteRelationship(id);
    },

    getRelationshipsForEntity(entityId) {
      return getRelationshipsForEntity(repository, entityId);
    },

    getConnectedEntities(entityId) {
      return getRelationshipsForEntity(repository, entityId).flatMap(
        (relationship): ConnectedEntity[] => {
          if (relationship.sourceEntityId === entityId) {
            const entity = repository.getEntity(relationship.targetEntityId);

            return entity
              ? [
                  {
                    entity,
                    relationship,
                    direction: 'outgoing' as const,
                  },
                ]
              : [];
          }

          const entity = repository.getEntity(relationship.sourceEntityId);

          return entity
            ? [
                {
                  entity,
                  relationship,
                  direction: 'incoming' as const,
                },
              ]
            : [];
        },
      );
    },

    validateRelationship(input) {
      const sourceEntity = repository.getEntity(input.sourceEntityId);

      if (!sourceEntity) {
        throw new GraphEngineError(
          `Relationship source entity does not exist: ${input.sourceEntityId}`,
        );
      }

      const targetEntity = repository.getEntity(input.targetEntityId);

      if (!targetEntity) {
        throw new GraphEngineError(
          `Relationship target entity does not exist: ${input.targetEntityId}`,
        );
      }

      if (!isAllowedRelationship(sourceEntity.type, input.type, targetEntity.type)) {
        throw new GraphEngineError(
          `Relationship is not allowed: ${sourceEntity.type} ${input.type} ${targetEntity.type}`,
        );
      }
    },
  };
}

function getRelationshipsForEntity(
  repository: GraphRepository,
  entityId: string,
): Relationship[] {
  return repository
    .listRelationships()
    .filter(
      (relationship) =>
        relationship.sourceEntityId === entityId ||
        relationship.targetEntityId === entityId,
    );
}
