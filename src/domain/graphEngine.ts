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

export type DirectConnectedKnowledge = {
  entity: Entity;
  incomingRelationships: Relationship[];
  outgoingRelationships: Relationship[];
  relationships: Relationship[];
  incomingConnectedEntities: ConnectedEntity[];
  outgoingConnectedEntities: ConnectedEntity[];
  connectedEntities: ConnectedEntity[];
};

export type DirectRelationshipPath = {
  sourceEntity: Entity;
  relationship: Relationship;
  targetEntity: Entity;
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
  getIncomingRelationshipsForEntity(entityId: string): Relationship[];
  getOutgoingRelationshipsForEntity(entityId: string): Relationship[];
  getConnectedEntities(entityId: string): ConnectedEntity[];
  getIncomingConnectedEntities(entityId: string): ConnectedEntity[];
  getOutgoingConnectedEntities(entityId: string): ConnectedEntity[];
  getDirectConnectedKnowledge(entityId: string): DirectConnectedKnowledge | undefined;
  getDirectRelationshipPath(
    sourceEntityId: string,
    targetEntityId: string,
  ): DirectRelationshipPath | undefined;
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

    getIncomingRelationshipsForEntity(entityId) {
      return getIncomingRelationshipsForEntity(repository, entityId);
    },

    getOutgoingRelationshipsForEntity(entityId) {
      return getOutgoingRelationshipsForEntity(repository, entityId);
    },

    getConnectedEntities(entityId) {
      return [
        ...getIncomingConnectedEntities(repository, entityId),
        ...getOutgoingConnectedEntities(repository, entityId),
      ];
    },

    getIncomingConnectedEntities(entityId) {
      return getIncomingConnectedEntities(repository, entityId);
    },

    getOutgoingConnectedEntities(entityId) {
      return getOutgoingConnectedEntities(repository, entityId);
    },

    getDirectConnectedKnowledge(entityId) {
      const entity = repository.getEntity(entityId);

      if (!entity) {
        return undefined;
      }

      const incomingRelationships = getIncomingRelationshipsForEntity(
        repository,
        entityId,
      );
      const outgoingRelationships = getOutgoingRelationshipsForEntity(
        repository,
        entityId,
      );
      const incomingConnectedEntities = getIncomingConnectedEntities(
        repository,
        entityId,
      );
      const outgoingConnectedEntities = getOutgoingConnectedEntities(
        repository,
        entityId,
      );

      return {
        entity,
        incomingRelationships,
        outgoingRelationships,
        relationships: [...incomingRelationships, ...outgoingRelationships],
        incomingConnectedEntities,
        outgoingConnectedEntities,
        connectedEntities: [
          ...incomingConnectedEntities,
          ...outgoingConnectedEntities,
        ],
      };
    },

    getDirectRelationshipPath(sourceEntityId, targetEntityId) {
      const relationship = repository
        .listRelationships()
        .find(
          (candidateRelationship) =>
            candidateRelationship.sourceEntityId === sourceEntityId &&
            candidateRelationship.targetEntityId === targetEntityId,
        );

      if (!relationship) {
        return undefined;
      }

      const sourceEntity = repository.getEntity(sourceEntityId);
      const targetEntity = repository.getEntity(targetEntityId);

      if (!sourceEntity || !targetEntity) {
        return undefined;
      }

      return {
        sourceEntity,
        relationship,
        targetEntity,
      };
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

function getIncomingRelationshipsForEntity(
  repository: GraphRepository,
  entityId: string,
): Relationship[] {
  return repository
    .listRelationships()
    .filter((relationship) => relationship.targetEntityId === entityId);
}

function getOutgoingRelationshipsForEntity(
  repository: GraphRepository,
  entityId: string,
): Relationship[] {
  return repository
    .listRelationships()
    .filter((relationship) => relationship.sourceEntityId === entityId);
}

function getIncomingConnectedEntities(
  repository: GraphRepository,
  entityId: string,
): ConnectedEntity[] {
  return getIncomingRelationshipsForEntity(repository, entityId).flatMap(
    (relationship): ConnectedEntity[] => {
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
}

function getOutgoingConnectedEntities(
  repository: GraphRepository,
  entityId: string,
): ConnectedEntity[] {
  return getOutgoingRelationshipsForEntity(repository, entityId).flatMap(
    (relationship): ConnectedEntity[] => {
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
    },
  );
}
