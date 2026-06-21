import { describe, expect, it } from 'vitest';
import {
  allowedRelationships,
  entityTypeConfigs,
  entityTypes,
  getAllowedRelationshipsForSource,
  getAllowedRelationshipsForTarget,
  isAllowedRelationship,
  isValidEntityType,
  isValidRelationshipType,
  relationshipTypeConfigs,
  relationshipTypes,
} from './ontology';

describe('ontology', () => {
  it('defines the fixed v0.1 entity types', () => {
    expect(entityTypes).toEqual([
      'research',
      'insight',
      'goal',
      'opportunity',
      'solution',
      'experiment',
      'decision',
      'outcome',
    ]);

    expect(Object.keys(entityTypeConfigs)).toEqual([...entityTypes]);
  });

  it('defines the fixed v0.1 relationship types', () => {
    expect(relationshipTypes).toEqual([
      'produces',
      'reveals',
      'informs',
      'frames',
      'supports',
      'motivates',
      'validated_by',
      'influences',
    ]);

    expect(Object.keys(relationshipTypeConfigs)).toEqual([...relationshipTypes]);
  });

  it('defines the allowed source and target relationship combinations', () => {
    expect(allowedRelationships).toEqual([
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
    ]);
  });

  it('validates known entity and relationship type values', () => {
    expect(isValidEntityType('research')).toBe(true);
    expect(isValidEntityType('assumption')).toBe(false);
    expect(isValidRelationshipType('informs')).toBe(true);
    expect(isValidRelationshipType('blocks')).toBe(false);
  });

  it('accepts valid relationships and rejects invalid combinations', () => {
    expect(isAllowedRelationship('research', 'produces', 'insight')).toBe(true);
    expect(isAllowedRelationship('experiment', 'informs', 'decision')).toBe(
      true,
    );
    expect(isAllowedRelationship('decision', 'influences', 'outcome')).toBe(
      true,
    );

    expect(isAllowedRelationship('research', 'informs', 'decision')).toBe(false);
    expect(isAllowedRelationship('solution', 'produces', 'insight')).toBe(false);
    expect(isAllowedRelationship('decision', 'supports', 'goal')).toBe(false);
  });

  it('gets allowed relationships by source entity type', () => {
    expect(getAllowedRelationshipsForSource('opportunity')).toEqual([
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
    ]);
  });

  it('gets allowed relationships by target entity type', () => {
    expect(getAllowedRelationshipsForTarget('decision')).toEqual([
      {
        source: 'insight',
        relationship: 'informs',
        target: 'decision',
      },
      {
        source: 'experiment',
        relationship: 'informs',
        target: 'decision',
      },
    ]);
  });
});
