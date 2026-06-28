import {
  type Entity,
  type Relationship,
} from './graph';
import {
  type DecisionTraceabilityGap,
  type GraphEngine,
  type LineageDirection,
  type LineagePath,
} from './graphEngine';
import {
  type EntityType,
  type RelationshipType,
} from './ontology';

export type ReasoningSignalPriority = 'info' | 'gap' | 'important';

export type ReasoningSignalType =
  | 'decision_missing_supporting_lineage'
  | 'decision_missing_upstream_knowledge'
  | 'decision_missing_downstream_outcome'
  | 'opportunity_missing_supporting_insight'
  | 'opportunity_missing_goal_connection'
  | 'solution_missing_opportunity'
  | 'solution_missing_validating_experiment'
  | 'experiment_not_informing_decision'
  | 'outcome_missing_decision';

export type SuggestedNextConnection = {
  relationshipType: RelationshipType;
  sourceEntityId?: string;
  targetEntityId?: string;
  sourceEntityType?: EntityType;
  targetEntityType?: EntityType;
};

export type ReasoningSignal = {
  type: ReasoningSignalType;
  priority: ReasoningSignalPriority;
  message: string;
  relatedEntityIds: string[];
  suggestedNextConnection?: SuggestedNextConnection;
};

export type ReasoningEntity = Pick<
  Entity,
  'id' | 'type' | 'title' | 'description'
>;

export type ReasoningRelationship = Pick<
  Relationship,
  'id' | 'type' | 'sourceEntityId' | 'targetEntityId'
>;

export type DirectReasoningRelationship = {
  relationship: ReasoningRelationship;
  connectedEntity: ReasoningEntity;
};

export type ReasoningLineageSegment = {
  sourceEntityId: string;
  relationshipId: string;
  relationshipType: RelationshipType;
  targetEntityId: string;
  statement: string;
};

export type ReasoningLineagePath = {
  id: string;
  direction: LineageDirection;
  startEntityId: string;
  endEntityId: string;
  entityIds: string[];
  segments: ReasoningLineageSegment[];
};

export type ReasoningDecisionTraceabilitySummary = {
  decisionId: string;
  supportingLineagePathIds: string[];
  downstreamOutcomePathIds: string[];
  traceabilityGaps: DecisionTraceabilityGap[];
};

export type ReasoningContext = {
  selectedEntity: ReasoningEntity;
  entityType: EntityType;
  description: string;
  directIncomingRelationships: DirectReasoningRelationship[];
  directOutgoingRelationships: DirectReasoningRelationship[];
  lineagePaths: ReasoningLineagePath[];
  decisionTraceabilitySummary?: ReasoningDecisionTraceabilitySummary;
  deterministicSignals: ReasoningSignal[];
};

export function buildReasoningContext(
  engine: GraphEngine,
  entityId: string,
): ReasoningContext | undefined {
  const directKnowledge = engine.getDirectConnectedKnowledge(entityId);

  if (!directKnowledge) {
    return undefined;
  }

  const backwardLineagePaths = engine.getBackwardLineagePaths(entityId);
  const forwardLineagePaths = engine.getForwardLineagePaths(entityId);
  const lineagePaths = uniqueReasoningLineagePaths([
    ...backwardLineagePaths,
    ...forwardLineagePaths,
  ]);
  const selectedEntity = toReasoningEntity(directKnowledge.entity);

  return {
    selectedEntity,
    entityType: selectedEntity.type,
    description: selectedEntity.description,
    directIncomingRelationships: directKnowledge.incomingConnectedEntities.map(
      (connectedEntity) => ({
        relationship: toReasoningRelationship(connectedEntity.relationship),
        connectedEntity: toReasoningEntity(connectedEntity.entity),
      }),
    ),
    directOutgoingRelationships: directKnowledge.outgoingConnectedEntities.map(
      (connectedEntity) => ({
        relationship: toReasoningRelationship(connectedEntity.relationship),
        connectedEntity: toReasoningEntity(connectedEntity.entity),
      }),
    ),
    lineagePaths,
    decisionTraceabilitySummary: buildDecisionReasoningContext(engine, entityId),
    deterministicSignals: buildDeterministicReasoningSignals(engine, entityId),
  };
}

export function buildDecisionReasoningContext(
  engine: GraphEngine,
  decisionId: string,
): ReasoningDecisionTraceabilitySummary | undefined {
  const summary = engine.getDecisionTraceabilitySummary(decisionId);

  if (!summary) {
    return undefined;
  }

  return {
    decisionId: summary.decision.id,
    supportingLineagePathIds: summary.supportingLineagePaths.map(createPathId),
    downstreamOutcomePathIds: summary.downstreamOutcomePaths.map(createPathId),
    traceabilityGaps: summary.traceabilityGaps,
  };
}

export function buildDeterministicReasoningSignals(
  engine: GraphEngine,
  entityId: string,
): ReasoningSignal[] {
  const entity = engine.getEntity(entityId);

  if (!entity) {
    return [];
  }

  switch (entity.type) {
    case 'decision':
      return buildDecisionSignals(engine, entity);
    case 'opportunity':
      return buildOpportunitySignals(engine, entity);
    case 'solution':
      return buildSolutionSignals(engine, entity);
    case 'experiment':
      return buildExperimentSignals(engine, entity);
    case 'outcome':
      return buildOutcomeSignals(engine, entity);
    default:
      return [];
  }
}

function buildDecisionSignals(
  engine: GraphEngine,
  decision: Entity,
): ReasoningSignal[] {
  const backwardLineagePaths = engine.getBackwardLineagePaths(decision.id);
  const downstreamOutcomePaths = engine
    .getForwardLineagePaths(decision.id)
    .filter((path) => path.endEntity.type === 'outcome');
  const signals: ReasoningSignal[] = [];

  if (backwardLineagePaths.length === 0) {
    signals.push({
      type: 'decision_missing_supporting_lineage',
      priority: 'important',
      message: 'Decision has no upstream supporting lineage.',
      relatedEntityIds: [decision.id],
      suggestedNextConnection: {
        relationshipType: 'informs',
        targetEntityId: decision.id,
        sourceEntityType: 'insight',
      },
    });
  }

  if (!hasUpstreamEntityType(backwardLineagePaths, ['research', 'insight', 'experiment'])) {
    signals.push({
      type: 'decision_missing_upstream_knowledge',
      priority: 'important',
      message: 'Decision has no upstream Research, Insight or Experiment.',
      relatedEntityIds: [decision.id],
      suggestedNextConnection: {
        relationshipType: 'informs',
        targetEntityId: decision.id,
        sourceEntityType: 'insight',
      },
    });
  }

  if (downstreamOutcomePaths.length === 0) {
    signals.push({
      type: 'decision_missing_downstream_outcome',
      priority: 'gap',
      message: 'Decision has no downstream Outcome.',
      relatedEntityIds: [decision.id],
      suggestedNextConnection: {
        relationshipType: 'influences',
        sourceEntityId: decision.id,
        targetEntityType: 'outcome',
      },
    });
  }

  return signals;
}

function buildOpportunitySignals(
  engine: GraphEngine,
  opportunity: Entity,
): ReasoningSignal[] {
  const incomingRelationships = engine.getIncomingRelationshipsForEntity(
    opportunity.id,
  );
  const outgoingRelationships = engine.getOutgoingRelationshipsForEntity(
    opportunity.id,
  );
  const signals: ReasoningSignal[] = [];

  if (
    !incomingRelationships.some((relationship) => relationship.type === 'reveals')
  ) {
    signals.push({
      type: 'opportunity_missing_supporting_insight',
      priority: 'important',
      message: 'Opportunity has no supporting Insight.',
      relatedEntityIds: [opportunity.id],
      suggestedNextConnection: {
        relationshipType: 'reveals',
        targetEntityId: opportunity.id,
        sourceEntityType: 'insight',
      },
    });
  }

  if (
    !incomingRelationships.some((relationship) => relationship.type === 'frames') &&
    !outgoingRelationships.some((relationship) => relationship.type === 'supports')
  ) {
    signals.push({
      type: 'opportunity_missing_goal_connection',
      priority: 'gap',
      message: 'Opportunity is not connected to a Goal.',
      relatedEntityIds: [opportunity.id],
      suggestedNextConnection: {
        relationshipType: 'supports',
        sourceEntityId: opportunity.id,
        targetEntityType: 'goal',
      },
    });
  }

  return signals;
}

function buildSolutionSignals(
  engine: GraphEngine,
  solution: Entity,
): ReasoningSignal[] {
  const incomingRelationships = engine.getIncomingRelationshipsForEntity(
    solution.id,
  );
  const outgoingRelationships = engine.getOutgoingRelationshipsForEntity(
    solution.id,
  );
  const signals: ReasoningSignal[] = [];

  if (
    !incomingRelationships.some(
      (relationship) => relationship.type === 'motivates',
    )
  ) {
    signals.push({
      type: 'solution_missing_opportunity',
      priority: 'important',
      message: 'Solution is not connected to an Opportunity.',
      relatedEntityIds: [solution.id],
      suggestedNextConnection: {
        relationshipType: 'motivates',
        targetEntityId: solution.id,
        sourceEntityType: 'opportunity',
      },
    });
  }

  if (
    !outgoingRelationships.some(
      (relationship) => relationship.type === 'validated_by',
    )
  ) {
    signals.push({
      type: 'solution_missing_validating_experiment',
      priority: 'gap',
      message: 'Solution has no validating Experiment.',
      relatedEntityIds: [solution.id],
      suggestedNextConnection: {
        relationshipType: 'validated_by',
        sourceEntityId: solution.id,
        targetEntityType: 'experiment',
      },
    });
  }

  return signals;
}

function buildExperimentSignals(
  engine: GraphEngine,
  experiment: Entity,
): ReasoningSignal[] {
  const hasInformedDecision = engine
    .getOutgoingRelationshipsForEntity(experiment.id)
    .some((relationship) => relationship.type === 'informs');

  if (hasInformedDecision) {
    return [];
  }

  return [
    {
      type: 'experiment_not_informing_decision',
      priority: 'gap',
      message: 'Experiment has not informed a Decision.',
      relatedEntityIds: [experiment.id],
      suggestedNextConnection: {
        relationshipType: 'informs',
        sourceEntityId: experiment.id,
        targetEntityType: 'decision',
      },
    },
  ];
}

function buildOutcomeSignals(
  engine: GraphEngine,
  outcome: Entity,
): ReasoningSignal[] {
  const hasUpstreamDecision = engine
    .getIncomingRelationshipsForEntity(outcome.id)
    .some((relationship) => relationship.type === 'influences');

  if (hasUpstreamDecision) {
    return [];
  }

  return [
    {
      type: 'outcome_missing_decision',
      priority: 'important',
      message: 'Outcome is not connected back to a Decision.',
      relatedEntityIds: [outcome.id],
      suggestedNextConnection: {
        relationshipType: 'influences',
        targetEntityId: outcome.id,
        sourceEntityType: 'decision',
      },
    },
  ];
}

function uniqueReasoningLineagePaths(
  lineagePaths: LineagePath[],
): ReasoningLineagePath[] {
  const uniquePaths = new Map<string, ReasoningLineagePath>();

  lineagePaths.forEach((path) => {
    const reasoningPath = toReasoningLineagePath(path);

    uniquePaths.set(reasoningPath.id, reasoningPath);
  });

  return [...uniquePaths.values()];
}

function toReasoningLineagePath(path: LineagePath): ReasoningLineagePath {
  const segments = path.segments.map((segment) => ({
    sourceEntityId: segment.sourceEntity.id,
    relationshipId: segment.relationship.id,
    relationshipType: segment.relationship.type,
    targetEntityId: segment.targetEntity.id,
    statement: segment.statement,
  }));

  return {
    id: createPathId(path),
    direction: path.direction,
    startEntityId: path.startEntity.id,
    endEntityId: path.endEntity.id,
    entityIds: getLineageEntityIds(path),
    segments,
  };
}

function createPathId(path: LineagePath): string {
  return [
    path.direction,
    path.startEntity.id,
    ...path.segments.map((segment) => segment.relationship.id),
    path.endEntity.id,
  ].join(':');
}

function getLineageEntityIds(path: LineagePath): string[] {
  if (path.segments.length === 0) {
    return [path.startEntity.id];
  }

  if (path.direction === 'forward') {
    return [
      path.startEntity.id,
      ...path.segments.map((segment) => segment.targetEntity.id),
    ];
  }

  return [
    ...path.segments.map((segment) => segment.sourceEntity.id),
    path.startEntity.id,
  ];
}

function hasUpstreamEntityType(
  paths: LineagePath[],
  entityTypes: EntityType[],
): boolean {
  return paths.some((path) =>
    path.segments.some((segment) =>
      entityTypes.includes(segment.sourceEntity.type),
    ),
  );
}

function toReasoningEntity(entity: Entity): ReasoningEntity {
  return {
    id: entity.id,
    type: entity.type,
    title: entity.title,
    description: entity.description,
  };
}

function toReasoningRelationship(
  relationship: Relationship,
): ReasoningRelationship {
  return {
    id: relationship.id,
    type: relationship.type,
    sourceEntityId: relationship.sourceEntityId,
    targetEntityId: relationship.targetEntityId,
  };
}
