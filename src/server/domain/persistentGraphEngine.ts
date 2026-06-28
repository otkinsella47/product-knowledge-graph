import {
  type CreateEntityInput,
  type CreateRelationshipInput,
  type Entity,
  type Relationship,
  type UpdateEntityInput,
} from '../../domain/graph';
import { GraphEngineError } from '../../domain/graphEngine.js';
import { isAllowedRelationship } from '../../domain/ontology.js';
import { type PersistentGraphRepository } from '../persistence/postgresGraphRepository.js';

export type PersistentGraphEngine = {
  createEntity(input: CreateEntityInput): Promise<Entity>;
  updateEntity(id: string, input: UpdateEntityInput): Promise<Entity | undefined>;
  deleteEntity(id: string): Promise<boolean>;
  getEntity(id: string): Promise<Entity | undefined>;
  listEntities(): Promise<Entity[]>;
  createRelationship(input: CreateRelationshipInput): Promise<Relationship>;
  deleteRelationship(id: string): Promise<boolean>;
  listRelationships(): Promise<Relationship[]>;
  validateRelationship(input: CreateRelationshipInput): Promise<void>;
};

export function createPersistentGraphEngine(
  repository: PersistentGraphRepository,
): PersistentGraphEngine {
  return {
    createEntity(input) {
      return repository.createEntity(input);
    },

    updateEntity(id, input) {
      return repository.updateEntity(id, input);
    },

    async deleteEntity(id) {
      const relationships = await repository.listRelationships();

      if (
        relationships.some(
          (relationship) =>
            relationship.sourceEntityId === id ||
            relationship.targetEntityId === id,
        )
      ) {
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

    async createRelationship(input) {
      await this.validateRelationship(input);

      return repository.createRelationship(input);
    },

    deleteRelationship(id) {
      return repository.deleteRelationship(id);
    },

    listRelationships() {
      return repository.listRelationships();
    },

    async validateRelationship(input) {
      const sourceEntity = await repository.getEntity(input.sourceEntityId);

      if (!sourceEntity) {
        throw new GraphEngineError(
          `Relationship source entity does not exist: ${input.sourceEntityId}`,
        );
      }

      const targetEntity = await repository.getEntity(input.targetEntityId);

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
