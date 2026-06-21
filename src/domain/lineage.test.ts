import { describe, expect, it } from 'vitest';
import {
  canonicalLineagePath,
  canRelationshipParticipateInDecisionLineage,
  describeRelationship,
  getPossibleNextEntityTypes,
  getPossiblePreviousEntityTypes,
  getRelationshipOptionsGroupedBySource,
  getRelationshipOptionsGroupedByTarget,
} from './lineage';

describe('lineage semantics', () => {
  it('defines the canonical lineage path from research to outcome', () => {
    expect(canonicalLineagePath).toEqual([
      'research',
      'insight',
      'opportunity',
      'solution',
      'experiment',
      'decision',
      'outcome',
    ]);
  });

  it('returns possible next entity types from the fixed relationship model', () => {
    expect(getPossibleNextEntityTypes('research')).toEqual(['insight']);
    expect(getPossibleNextEntityTypes('insight')).toEqual([
      'opportunity',
      'decision',
    ]);
    expect(getPossibleNextEntityTypes('opportunity')).toEqual([
      'goal',
      'solution',
    ]);
    expect(getPossibleNextEntityTypes('outcome')).toEqual(['insight']);
  });

  it('returns possible previous entity types from the fixed relationship model', () => {
    expect(getPossiblePreviousEntityTypes('decision')).toEqual([
      'insight',
      'experiment',
    ]);
    expect(getPossiblePreviousEntityTypes('opportunity')).toEqual([
      'insight',
      'goal',
    ]);
    expect(getPossiblePreviousEntityTypes('research')).toEqual([]);
  });

  it('identifies relationship types that support decision lineage', () => {
    expect(canRelationshipParticipateInDecisionLineage('produces')).toBe(true);
    expect(canRelationshipParticipateInDecisionLineage('informs')).toBe(true);
    expect(canRelationshipParticipateInDecisionLineage('influences')).toBe(true);
    expect(canRelationshipParticipateInDecisionLineage('frames')).toBe(false);
    expect(canRelationshipParticipateInDecisionLineage('supports')).toBe(false);
  });

  it('describes supported relationships in plain language', () => {
    expect(
      describeRelationship('experiment', 'informs', 'decision'),
    ).toMatchObject({
      source: 'experiment',
      relationship: 'informs',
      target: 'decision',
      sourceLabel: 'Experiment',
      relationshipLabel: 'Informs',
      targetLabel: 'Decision',
    });
  });

  it('returns undefined for unsupported relationship descriptions', () => {
    expect(describeRelationship('research', 'informs', 'decision')).toBe(
      undefined,
    );
  });

  it('groups relationship options by source entity type', () => {
    expect(getRelationshipOptionsGroupedBySource().opportunity).toEqual([
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

  it('groups relationship options by target entity type', () => {
    expect(getRelationshipOptionsGroupedByTarget().insight).toEqual([
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
    ]);
  });

  it('supports the main decision lineage review questions at the model level', () => {
    expect(getPossiblePreviousEntityTypes('decision')).toEqual([
      'insight',
      'experiment',
    ]);
    expect(getPossiblePreviousEntityTypes('experiment')).toEqual(['solution']);
    expect(getPossibleNextEntityTypes('decision')).toEqual(['outcome']);

    expect(describeRelationship('insight', 'informs', 'decision')).toBeDefined();
    expect(
      describeRelationship('experiment', 'informs', 'decision'),
    ).toBeDefined();
    expect(
      describeRelationship('solution', 'validated_by', 'experiment'),
    ).toBeDefined();
    expect(
      describeRelationship('decision', 'influences', 'outcome'),
    ).toBeDefined();
  });
});
