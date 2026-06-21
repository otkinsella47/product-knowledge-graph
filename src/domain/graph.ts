import { type EntityType, type RelationshipType } from './ontology';

export type GraphMetadata = Record<string, string | number | boolean | null>;

export type Entity = {
  id: string;
  type: EntityType;
  title: string;
  description: string;
  metadata?: GraphMetadata;
  createdAt: string;
  updatedAt: string;
};

export type Relationship = {
  id: string;
  type: RelationshipType;
  sourceEntityId: string;
  targetEntityId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateEntityInput = {
  type: EntityType;
  title: string;
  description: string;
  metadata?: GraphMetadata;
};

export type UpdateEntityInput = Partial<
  Pick<Entity, 'title' | 'description' | 'metadata'>
>;

export type CreateRelationshipInput = {
  type: RelationshipType;
  sourceEntityId: string;
  targetEntityId: string;
};

export type UpdateRelationshipInput = Partial<
  Pick<Relationship, 'type' | 'sourceEntityId' | 'targetEntityId'>
>;
