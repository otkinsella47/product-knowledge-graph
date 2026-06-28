import {
  type CreateEntityInput,
  type CreateRelationshipInput,
  type Entity,
  type Relationship,
  type UpdateEntityInput,
} from './graph';
import { type GraphRepository } from './graphRepository.js';
import {
  entityTypeConfigs,
  isAllowedRelationship,
  relationshipTypeConfigs,
} from './ontology.js';

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

export type LineageDirection = 'backward' | 'forward';

export type LineageTraversalOptions = {
  maxDepth?: number;
};

export type LineagePathSegment = {
  sourceEntity: Entity;
  relationship: Relationship;
  targetEntity: Entity;
  sourceLabel: string;
  relationshipLabel: string;
  targetLabel: string;
  statement: string;
};

export type LineagePath = {
  direction: LineageDirection;
  startEntity: Entity;
  endEntity: Entity;
  segments: LineagePathSegment[];
};

export type DecisionTraceabilityGapCode =
  | 'missing_supporting_lineage'
  | 'missing_upstream_knowledge'
  | 'missing_downstream_outcome';

export type DecisionTraceabilityGap = {
  code: DecisionTraceabilityGapCode;
  label: string;
  message: string;
};

export type DecisionTraceabilitySummary = {
  decision: Entity;
  supportingLineagePaths: LineagePath[];
  downstreamOutcomePaths: LineagePath[];
  traceabilityGaps: DecisionTraceabilityGap[];
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
  getBackwardLineagePaths(
    entityId: string,
    options?: LineageTraversalOptions,
  ): LineagePath[];
  getForwardLineagePaths(
    entityId: string,
    options?: LineageTraversalOptions,
  ): LineagePath[];
  getLineagePaths(
    entityId: string,
    direction: LineageDirection,
    options?: LineageTraversalOptions,
  ): LineagePath[];
  getDecisionTraceabilitySummary(
    decisionId: string,
  ): DecisionTraceabilitySummary | undefined;
  validateRelationship(input: CreateRelationshipInput): void;
};

const defaultLineageMaxDepth = 6;

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

    getBackwardLineagePaths(entityId, options) {
      return getLineagePaths(repository, entityId, 'backward', options);
    },

    getForwardLineagePaths(entityId, options) {
      return getLineagePaths(repository, entityId, 'forward', options);
    },

    getLineagePaths(entityId, direction, options) {
      return getLineagePaths(repository, entityId, direction, options);
    },

    getDecisionTraceabilitySummary(decisionId) {
      return getDecisionTraceabilitySummary(repository, decisionId);
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

function getDecisionTraceabilitySummary(
  repository: GraphRepository,
  decisionId: string,
): DecisionTraceabilitySummary | undefined {
  const decision = repository.getEntity(decisionId);

  if (!decision || decision.type !== 'decision') {
    return undefined;
  }

  const supportingLineagePaths = getLineagePaths(
    repository,
    decisionId,
    'backward',
  );
  const downstreamOutcomePaths = getLineagePaths(
    repository,
    decisionId,
    'forward',
  ).filter((path) => path.endEntity.type === 'outcome');

  return {
    decision,
    supportingLineagePaths,
    downstreamOutcomePaths,
    traceabilityGaps: getDecisionTraceabilityGaps(
      supportingLineagePaths,
      downstreamOutcomePaths,
    ),
  };
}

function getDecisionTraceabilityGaps(
  supportingLineagePaths: LineagePath[],
  downstreamOutcomePaths: LineagePath[],
): DecisionTraceabilityGap[] {
  const gaps: DecisionTraceabilityGap[] = [];

  if (supportingLineagePaths.length === 0) {
    gaps.push({
      code: 'missing_supporting_lineage',
      label: 'Missing connection',
      message: 'No incoming supporting lineage is connected to this decision.',
    });
  }

  if (!hasUpstreamKnowledgeEntity(supportingLineagePaths)) {
    gaps.push({
      code: 'missing_upstream_knowledge',
      label: 'Lineage gap',
      message:
        'No upstream Research, Insight or Experiment is connected to this decision.',
    });
  }

  if (downstreamOutcomePaths.length === 0) {
    gaps.push({
      code: 'missing_downstream_outcome',
      label: 'Missing connection',
      message: 'No downstream Outcome is connected to this decision.',
    });
  }

  return gaps;
}

function hasUpstreamKnowledgeEntity(paths: LineagePath[]): boolean {
  return paths.some((path) =>
    path.segments.some(
      (segment) =>
        segment.sourceEntity.type === 'research' ||
        segment.sourceEntity.type === 'insight' ||
        segment.sourceEntity.type === 'experiment',
    ),
  );
}

function getLineagePaths(
  repository: GraphRepository,
  entityId: string,
  direction: LineageDirection,
  options: LineageTraversalOptions = {},
): LineagePath[] {
  const startEntity = repository.getEntity(entityId);

  if (!startEntity) {
    return [];
  }

  const maxDepth = normaliseMaxDepth(options.maxDepth);

  if (maxDepth === 0) {
    return [];
  }

  const paths: LineagePath[] = [];

  visitLineagePaths({
    repository,
    direction,
    startEntity,
    currentEntityId: entityId,
    maxDepth,
    segments: [],
    visitedEntityIds: new Set([entityId]),
    paths,
  });

  return paths;
}

type VisitLineagePathsInput = {
  repository: GraphRepository;
  direction: LineageDirection;
  startEntity: Entity;
  currentEntityId: string;
  maxDepth: number;
  segments: LineagePathSegment[];
  visitedEntityIds: Set<string>;
  paths: LineagePath[];
};

function visitLineagePaths({
  repository,
  direction,
  startEntity,
  currentEntityId,
  maxDepth,
  segments,
  visitedEntityIds,
  paths,
}: VisitLineagePathsInput) {
  if (segments.length >= maxDepth) {
    return;
  }

  const relationships =
    direction === 'forward'
      ? getOutgoingRelationshipsForEntity(repository, currentEntityId)
      : getIncomingRelationshipsForEntity(repository, currentEntityId);

  relationships.forEach((relationship) => {
    const sourceEntity = repository.getEntity(relationship.sourceEntityId);
    const targetEntity = repository.getEntity(relationship.targetEntityId);

    if (!sourceEntity || !targetEntity) {
      return;
    }

    const nextEntity = direction === 'forward' ? targetEntity : sourceEntity;

    if (visitedEntityIds.has(nextEntity.id)) {
      return;
    }

    const segment = createLineagePathSegment(
      sourceEntity,
      relationship,
      targetEntity,
    );
    const nextSegments =
      direction === 'forward' ? [...segments, segment] : [segment, ...segments];

    paths.push({
      direction,
      startEntity,
      endEntity: nextEntity,
      segments: nextSegments,
    });

    visitLineagePaths({
      repository,
      direction,
      startEntity,
      currentEntityId: nextEntity.id,
      maxDepth,
      segments: nextSegments,
      visitedEntityIds: new Set([...visitedEntityIds, nextEntity.id]),
      paths,
    });
  });
}

function createLineagePathSegment(
  sourceEntity: Entity,
  relationship: Relationship,
  targetEntity: Entity,
): LineagePathSegment {
  const sourceLabel = entityTypeConfigs[sourceEntity.type].label;
  const relationshipLabel = relationshipTypeConfigs[relationship.type].label;
  const targetLabel = entityTypeConfigs[targetEntity.type].label;

  return {
    sourceEntity,
    relationship,
    targetEntity,
    sourceLabel,
    relationshipLabel,
    targetLabel,
    statement: `${sourceLabel} ${relationshipLabel.toLowerCase()} ${targetLabel}: ${sourceEntity.title} -> ${targetEntity.title}`,
  };
}

function normaliseMaxDepth(maxDepth: number | undefined): number {
  if (maxDepth === undefined) {
    return defaultLineageMaxDepth;
  }

  if (!Number.isFinite(maxDepth) || maxDepth <= 0) {
    return 0;
  }

  return Math.floor(maxDepth);
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
