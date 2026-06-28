import {
  type AllowedRelationship,
  type EntityType,
  type RelationshipType,
  allowedRelationships,
  entityTypeConfigs,
  relationshipTypeConfigs,
} from './ontology.js';

export const canonicalLineagePath = [
  'research',
  'insight',
  'opportunity',
  'solution',
  'experiment',
  'decision',
  'outcome',
] as const satisfies readonly EntityType[];

const decisionLineageRelationships = new Set<RelationshipType>([
  'produces',
  'reveals',
  'informs',
  'motivates',
  'validated_by',
  'influences',
]);

export type RelationshipDescription = AllowedRelationship & {
  sourceLabel: string;
  relationshipLabel: string;
  targetLabel: string;
  description: string;
};

export function getPossibleNextEntityTypes(entityType: EntityType): EntityType[] {
  return uniqueEntityTypes(
    allowedRelationships
      .filter((relationship) => relationship.source === entityType)
      .map((relationship) => relationship.target),
  );
}

export function getPossiblePreviousEntityTypes(
  entityType: EntityType,
): EntityType[] {
  return uniqueEntityTypes(
    allowedRelationships
      .filter((relationship) => relationship.target === entityType)
      .map((relationship) => relationship.source),
  );
}

export function canRelationshipParticipateInDecisionLineage(
  relationship: RelationshipType,
): boolean {
  return decisionLineageRelationships.has(relationship);
}

export function describeRelationship(
  source: EntityType,
  relationship: RelationshipType,
  target: EntityType,
): RelationshipDescription | undefined {
  const allowedRelationship = allowedRelationships.find(
    (candidate) =>
      candidate.source === source &&
      candidate.relationship === relationship &&
      candidate.target === target,
  );

  if (!allowedRelationship) {
    return undefined;
  }

  const sourceConfig = entityTypeConfigs[source];
  const relationshipConfig = relationshipTypeConfigs[relationship];
  const targetConfig = entityTypeConfigs[target];

  return {
    source,
    relationship,
    target,
    sourceLabel: sourceConfig.label,
    relationshipLabel: relationshipConfig.label,
    targetLabel: targetConfig.label,
    description: `${sourceConfig.label} ${relationshipConfig.label.toLowerCase()} ${targetConfig.label}. ${relationshipConfig.description}`,
  };
}

export function getRelationshipOptionsGroupedBySource(): Record<
  EntityType,
  AllowedRelationship[]
> {
  return allowedRelationships.reduce(
    (groupedRelationships, relationship) => ({
      ...groupedRelationships,
      [relationship.source]: [
        ...groupedRelationships[relationship.source],
        relationship,
      ],
    }),
    createEmptyRelationshipGroups(),
  );
}

export function getRelationshipOptionsGroupedByTarget(): Record<
  EntityType,
  AllowedRelationship[]
> {
  return allowedRelationships.reduce(
    (groupedRelationships, relationship) => ({
      ...groupedRelationships,
      [relationship.target]: [
        ...groupedRelationships[relationship.target],
        relationship,
      ],
    }),
    createEmptyRelationshipGroups(),
  );
}

function uniqueEntityTypes(entityTypes: EntityType[]): EntityType[] {
  return [...new Set(entityTypes)];
}

function createEmptyRelationshipGroups(): Record<EntityType, AllowedRelationship[]> {
  return {
    research: [],
    insight: [],
    goal: [],
    opportunity: [],
    solution: [],
    experiment: [],
    decision: [],
    outcome: [],
  };
}
