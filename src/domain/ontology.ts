export const entityTypes = [
  'research',
  'insight',
  'goal',
  'opportunity',
  'solution',
  'experiment',
  'decision',
  'outcome',
] as const;

export type EntityType = (typeof entityTypes)[number];

export type EntityTypeConfig = {
  type: EntityType;
  label: string;
  description: string;
};

export const entityTypeConfigs: Record<EntityType, EntityTypeConfig> = {
  research: {
    type: 'research',
    label: 'Research',
    description:
      'Activity or source material that helps the team understand users, customers, markets, products or systems.',
  },
  insight: {
    type: 'insight',
    label: 'Insight',
    description:
      'A reusable interpretation of knowledge that may inform opportunities, decisions or future investigations.',
  },
  goal: {
    type: 'goal',
    label: 'Goal',
    description: 'An intended future state that helps frame which opportunities matter.',
  },
  opportunity: {
    type: 'opportunity',
    label: 'Opportunity',
    description:
      'A user need, customer problem, pain point, unmet desire or improvement area that could help achieve a goal.',
  },
  solution: {
    type: 'solution',
    label: 'Solution',
    description: 'A proposed way to address an opportunity.',
  },
  experiment: {
    type: 'experiment',
    label: 'Experiment',
    description: 'An intentional activity that generates learning.',
  },
  decision: {
    type: 'decision',
    label: 'Decision',
    description: 'An explicit choice, trade-off or commitment.',
  },
  outcome: {
    type: 'outcome',
    label: 'Outcome',
    description: 'A realised result after a decision, solution, experiment or product change.',
  },
};

export const relationshipTypes = [
  'produces',
  'reveals',
  'informs',
  'frames',
  'supports',
  'motivates',
  'validated_by',
  'influences',
] as const;

export type RelationshipType = (typeof relationshipTypes)[number];

export type RelationshipConfig = {
  type: RelationshipType;
  label: string;
  description: string;
};

export const relationshipTypeConfigs: Record<
  RelationshipType,
  RelationshipConfig
> = {
  produces: {
    type: 'produces',
    label: 'Produces',
    description: 'Creates source knowledge or learning that can be interpreted downstream.',
  },
  reveals: {
    type: 'reveals',
    label: 'Reveals',
    description: 'Makes a related opportunity visible.',
  },
  informs: {
    type: 'informs',
    label: 'Informs',
    description: 'Provides interpreted knowledge or evidence for a decision.',
  },
  frames: {
    type: 'frames',
    label: 'Frames',
    description: 'Provides strategic context for an opportunity.',
  },
  supports: {
    type: 'supports',
    label: 'Supports',
    description: 'Connects an opportunity back to a goal it may help achieve.',
  },
  motivates: {
    type: 'motivates',
    label: 'Motivates',
    description: 'Explains why a solution should exist.',
  },
  validated_by: {
    type: 'validated_by',
    label: 'Validated by',
    description: 'Connects a solution to an experiment that tests or reshapes it.',
  },
  influences: {
    type: 'influences',
    label: 'Influences',
    description: 'Connects a decision to an outcome that followed from it.',
  },
};

export type AllowedRelationship = {
  source: EntityType;
  relationship: RelationshipType;
  target: EntityType;
};

export const allowedRelationships = [
  {
    source: 'research',
    relationship: 'produces',
    target: 'insight',
  },
  {
    source: 'experiment',
    relationship: 'produces',
    target: 'insight',
  },
  {
    source: 'outcome',
    relationship: 'produces',
    target: 'insight',
  },
  {
    source: 'insight',
    relationship: 'reveals',
    target: 'opportunity',
  },
  {
    source: 'insight',
    relationship: 'informs',
    target: 'decision',
  },
  {
    source: 'goal',
    relationship: 'frames',
    target: 'opportunity',
  },
  {
    source: 'opportunity',
    relationship: 'supports',
    target: 'goal',
  },
  {
    source: 'opportunity',
    relationship: 'motivates',
    target: 'solution',
  },
  {
    source: 'solution',
    relationship: 'validated_by',
    target: 'experiment',
  },
  {
    source: 'experiment',
    relationship: 'informs',
    target: 'decision',
  },
  {
    source: 'decision',
    relationship: 'influences',
    target: 'outcome',
  },
] as const satisfies readonly AllowedRelationship[];

export function isValidEntityType(value: string): value is EntityType {
  return entityTypes.includes(value as EntityType);
}

export function isValidRelationshipType(
  value: string,
): value is RelationshipType {
  return relationshipTypes.includes(value as RelationshipType);
}

export function isAllowedRelationship(
  source: EntityType,
  relationship: RelationshipType,
  target: EntityType,
): boolean {
  return allowedRelationships.some(
    (allowedRelationship) =>
      allowedRelationship.source === source &&
      allowedRelationship.relationship === relationship &&
      allowedRelationship.target === target,
  );
}

export function getAllowedRelationshipsForSource(
  entityType: EntityType,
): AllowedRelationship[] {
  return allowedRelationships.filter(
    (allowedRelationship) => allowedRelationship.source === entityType,
  );
}

export function getAllowedRelationshipsForTarget(
  entityType: EntityType,
): AllowedRelationship[] {
  return allowedRelationships.filter(
    (allowedRelationship) => allowedRelationship.target === entityType,
  );
}
