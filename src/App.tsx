import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type CreateEntityInput,
  type Entity,
  type Relationship,
} from './domain/graph';
import {
  createGraphEngine,
  type DecisionTraceabilitySummary,
  type LineagePath,
} from './domain/graphEngine';
import { createInMemoryGraphRepository } from './domain/graphRepository';
import {
  type AllowedRelationship,
  type EntityType,
  type RelationshipType,
  entityTypeConfigs,
  entityTypes,
  getAllowedRelationshipsForSource,
  relationshipTypeConfigs,
} from './domain/ontology';
import {
  createFetchGraphApiClient,
  type GraphApiClient,
} from './graphApiClient';

type EntityFormState = {
  type: EntityType;
  title: string;
  description: string;
};

type RelationshipFormState = {
  relationship: RelationshipType | '';
  targetEntityId: string;
};

type DemoEntityInput = CreateEntityInput & {
  key: string;
};

type DemoRelationshipInput = {
  type: RelationshipType;
  sourceKey: string;
  targetKey: string;
};

const emptyFormState: EntityFormState = {
  type: 'research',
  title: '',
  description: '',
};

const emptyRelationshipFormState: RelationshipFormState = {
  relationship: '',
  targetEntityId: '',
};

const lineageTraversalMaxDepth = 6;
const lineageDisplayPathLimit = 6;

type LineageChain = {
  key: string;
  segments: LineagePath['segments'];
};

type WorkspaceMode = 'persisted' | 'demo';

const demoEntities = [
  {
    key: 'research',
    type: 'research',
    title: 'Interview notes: decision context loss',
    description:
      'Customer interviews showed that teams struggle to recover why product decisions were made.',
  },
  {
    key: 'insight',
    type: 'insight',
    title: 'Teams lose decision rationale',
    description:
      'Decision context fades when research, opportunities and outcomes are stored separately.',
  },
  {
    key: 'goal',
    type: 'goal',
    title: 'Improve decision confidence',
    description:
      'Help product teams understand the knowledge behind product decisions.',
  },
  {
    key: 'opportunity',
    type: 'opportunity',
    title: 'Preserve decision lineage',
    description:
      'Make it easy to trace what led to a decision and what happened afterwards.',
  },
  {
    key: 'solution',
    type: 'solution',
    title: 'Lineage navigation panel',
    description:
      'A lightweight UI panel that shows upstream and downstream knowledge paths.',
  },
  {
    key: 'experiment',
    type: 'experiment',
    title: 'Prototype lineage review',
    description:
      'A prototype review to see whether users can follow decision context quickly.',
  },
  {
    key: 'decision',
    type: 'decision',
    title: 'Build Phase 4 lineage navigation',
    description:
      'Decision to add lineage navigation before exploring AI reasoning features.',
  },
  {
    key: 'outcome',
    type: 'outcome',
    title: 'Reviewers understood decision context',
    description:
      'Reviewers could trace the decision back to research and forward to outcomes.',
  },
  {
    key: 'unsupportedDecision',
    type: 'decision',
    title: 'Pilot unsupported prioritisation view',
    description:
      'A deliberately incomplete decision with no incoming support or downstream outcome.',
  },
] as const satisfies readonly DemoEntityInput[];

const demoRelationships = [
  {
    type: 'produces',
    sourceKey: 'research',
    targetKey: 'insight',
  },
  {
    type: 'frames',
    sourceKey: 'goal',
    targetKey: 'opportunity',
  },
  {
    type: 'reveals',
    sourceKey: 'insight',
    targetKey: 'opportunity',
  },
  {
    type: 'supports',
    sourceKey: 'opportunity',
    targetKey: 'goal',
  },
  {
    type: 'motivates',
    sourceKey: 'opportunity',
    targetKey: 'solution',
  },
  {
    type: 'validated_by',
    sourceKey: 'solution',
    targetKey: 'experiment',
  },
  {
    type: 'informs',
    sourceKey: 'experiment',
    targetKey: 'decision',
  },
  {
    type: 'influences',
    sourceKey: 'decision',
    targetKey: 'outcome',
  },
] as const satisfies readonly DemoRelationshipInput[];

function App({
  apiClient = createFetchGraphApiClient(),
}: {
  apiClient?: GraphApiClient;
}) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>();
  const [editingEntityId, setEditingEntityId] = useState<string | undefined>();
  const [formState, setFormState] = useState<EntityFormState>(emptyFormState);
  const [relationshipFormState, setRelationshipFormState] =
    useState<RelationshipFormState>(emptyRelationshipFormState);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
  const [error, setError] = useState<string | undefined>();
  const [relationshipError, setRelationshipError] = useState<string | undefined>();
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('persisted');
  const [isLoadingGraph, setIsLoadingGraph] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();

  const graphEngine = useMemo(
    () => createGraphEngineFromData(entities, relationships),
    [entities, relationships],
  );

  function applyPersistedGraph(
    nextEntities: Entity[],
    nextRelationships: Relationship[],
  ) {
    setEntities(nextEntities);
    setRelationships(nextRelationships);
    setSelectedEntityId((currentSelectedEntityId) =>
      currentSelectedEntityId &&
      nextEntities.some((entity) => entity.id === currentSelectedEntityId)
        ? currentSelectedEntityId
        : nextEntities.at(0)?.id,
    );
    setWorkspaceMode('persisted');
  }

  async function loadPersistedGraph() {
    setIsLoadingGraph(true);
    setLoadError(undefined);

    try {
      const graph = await apiClient.loadGraph();

      applyPersistedGraph(graph.entities, graph.relationships);
    } catch {
      setLoadError('Could not load saved graph data.');
      setEntities([]);
      setRelationships([]);
      setSelectedEntityId(undefined);
    } finally {
      setIsLoadingGraph(false);
    }
  }

  useEffect(() => {
    let isCurrent = true;

    apiClient
      .loadGraph()
      .then((graph) => {
        if (!isCurrent) {
          return;
        }

        applyPersistedGraph(graph.entities, graph.relationships);
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }

        setLoadError('Could not load saved graph data.');
        setEntities([]);
        setRelationships([]);
        setSelectedEntityId(undefined);
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingGraph(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [apiClient]);

  const selectedEntity = entities.find((entity) => entity.id === selectedEntityId);
  const editingEntity = entities.find((entity) => entity.id === editingEntityId);
  const selectedEntityRelationships = selectedEntity
    ? relationships.filter(
        (relationship) =>
          relationship.sourceEntityId === selectedEntity.id ||
          relationship.targetEntityId === selectedEntity.id,
      )
    : [];
  const allowedRelationshipRules = selectedEntity
    ? getAllowedRelationshipsForSource(selectedEntity.type)
    : [];
  const selectedRelationshipRule = allowedRelationshipRules.find(
    (allowedRelationship) =>
      allowedRelationship.relationship === relationshipFormState.relationship,
  );
  const validTargetEntities = selectedRelationshipRule
    ? entities.filter(
        (entity) =>
          entity.id !== selectedEntity?.id &&
          entity.type === selectedRelationshipRule.target,
      )
    : [];
  const selectedTargetEntity = relationshipFormState.targetEntityId
    ? entities.find(
        (entity) => entity.id === relationshipFormState.targetEntityId,
      )
    : undefined;
  const connectionPreview =
    selectedEntity && selectedRelationshipRule && selectedTargetEntity
      ? formatConnectionPreview(
          selectedEntity,
          selectedRelationshipRule.relationship,
          selectedTargetEntity,
        )
      : undefined;
  const decisionTraceabilitySummary =
    selectedEntity?.type === 'decision'
      ? graphEngine.getDecisionTraceabilitySummary(selectedEntity.id)
      : undefined;
  const selectedEntityLineage = selectedEntity
    ? {
        backwardPaths: graphEngine
          .getBackwardLineagePaths(selectedEntity.id, {
            maxDepth: lineageTraversalMaxDepth,
          }),
        forwardPaths: graphEngine
          .getForwardLineagePaths(selectedEntity.id, {
            maxDepth: lineageTraversalMaxDepth,
          }),
      }
    : undefined;

  const filteredEntities = useMemo(() => {
    const normalisedSearchQuery = searchQuery.trim().toLowerCase();

    return entities.filter((entity) => {
      const matchesType = typeFilter === 'all' || entity.type === typeFilter;
      const matchesSearch =
        !normalisedSearchQuery ||
        entity.title.toLowerCase().includes(normalisedSearchQuery) ||
        entity.description.toLowerCase().includes(normalisedSearchQuery);

      return matchesType && matchesSearch;
    });
  }, [entities, searchQuery, typeFilter]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = formState.title.trim();
    const description = formState.description.trim();

    if (!title || !description) {
      setError('Title and description are required.');
      return;
    }

    try {
      if (workspaceMode === 'demo') {
        saveEntityLocally(title, description);
      } else {
        await saveEntityPersistently(title, description);
      }

      setError(undefined);
      setEditingEntityId(undefined);
      setFormState(emptyFormState);
    } catch {
      setError('Could not save this entity.');
    }
  }

  function saveEntityLocally(title: string, description: string) {
    if (editingEntityId) {
      const updatedEntity = graphEngine.updateEntity(editingEntityId, {
        title,
        description,
      });

      if (updatedEntity) {
        setEntities(graphEngine.listEntities());
        setSelectedEntityId(updatedEntity.id);
      }

      return;
    }

    const entity = graphEngine.createEntity({
      type: formState.type,
      title,
      description,
    });

    setEntities(graphEngine.listEntities());
    setSelectedEntityId(entity.id);
  }

  async function saveEntityPersistently(title: string, description: string) {
    if (editingEntityId) {
      const updatedEntity = await apiClient.updateEntity(editingEntityId, {
        title,
        description,
      });

      setEntities((currentEntities) =>
        currentEntities.map((entity) =>
          entity.id === updatedEntity.id ? updatedEntity : entity,
        ),
      );
      setSelectedEntityId(updatedEntity.id);

      return;
    }

    const entity = await apiClient.createEntity({
      type: formState.type,
      title,
      description,
    });

    setEntities((currentEntities) => [...currentEntities, entity]);
    setSelectedEntityId(entity.id);
  }

  function handleEdit(entity: Entity) {
    setEditingEntityId(entity.id);
    setFormState({
      type: entity.type,
      title: entity.title,
      description: entity.description,
    });
    setError(undefined);
  }

  function handleCancelEdit() {
    setEditingEntityId(undefined);
    setFormState(emptyFormState);
    setError(undefined);
  }

  async function handleDelete(entityId: string) {
    try {
      if (workspaceMode === 'demo') {
        graphEngine.deleteEntity(entityId);
        const nextEntities = graphEngine.listEntities();

        setEntities(nextEntities);
        updateSelectedEntityAfterDelete(entityId, nextEntities);
      } else {
        await apiClient.deleteEntity(entityId);
        setEntities((currentEntities) => {
          const nextEntities = currentEntities.filter(
            (entity) => entity.id !== entityId,
          );

          updateSelectedEntityAfterDelete(entityId, nextEntities);

          return nextEntities;
        });
      }

      setEditingEntityId((currentEntityId) =>
        currentEntityId === entityId ? undefined : currentEntityId,
      );
      setFormState((currentFormState) =>
        editingEntityId === entityId ? emptyFormState : currentFormState,
      );
      setError(undefined);
    } catch {
      setError('Remove relationships before deleting this entity.');
    }
  }

  function handleSelectEntity(entityId: string) {
    setSelectedEntityId(entityId);
    setRelationshipFormState(emptyRelationshipFormState);
    setRelationshipError(undefined);
  }

  async function handleRelationshipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEntity) {
      setRelationshipError('Select an entity before adding a relationship.');
      return;
    }

    if (!relationshipFormState.relationship) {
      setRelationshipError('Choose a connection type.');
      return;
    }

    if (!relationshipFormState.targetEntityId) {
      setRelationshipError('Choose an entity to connect to.');
      return;
    }

    const relationshipInput = {
        type: relationshipFormState.relationship,
        sourceEntityId: selectedEntity.id,
        targetEntityId: relationshipFormState.targetEntityId,
      };

    try {
      const relationship =
        workspaceMode === 'demo'
          ? graphEngine.createRelationship(relationshipInput)
          : await apiClient.createRelationship(relationshipInput);

      setRelationships((currentRelationships) => [
        ...currentRelationships,
        relationship,
      ]);
      setRelationshipFormState(emptyRelationshipFormState);
      setRelationshipError(undefined);
    } catch {
      setRelationshipError('That relationship is not valid for these entities.');
    }
  }

  async function handleDeleteRelationship(relationshipId: string) {
    try {
      if (workspaceMode === 'demo') {
        graphEngine.deleteRelationship(relationshipId);
      } else {
        await apiClient.deleteRelationship(relationshipId);
      }

      setRelationships((currentRelationships) =>
        currentRelationships.filter(
          (relationship) => relationship.id !== relationshipId,
        ),
      );
      setRelationshipError(undefined);
    } catch {
      setRelationshipError('Could not remove this relationship.');
    }
  }

  function handleLoadDemoData() {
    const {
      entities: demoGraphEntities,
      relationships: demoGraphRelationships,
      selectedEntityId: demoSelectedEntityId,
    } = createDemoGraph();

    setEntities(demoGraphEntities);
    setRelationships(demoGraphRelationships);
    setSelectedEntityId(demoSelectedEntityId);
    setWorkspaceMode('demo');
    setIsLoadingGraph(false);
    setLoadError(undefined);
    setEditingEntityId(undefined);
    setFormState(emptyFormState);
    setRelationshipFormState(emptyRelationshipFormState);
    setSearchQuery('');
    setTypeFilter('all');
    setError(undefined);
    setRelationshipError(undefined);
  }

  function handleResetWorkspace() {
    if (workspaceMode === 'demo') {
      void loadPersistedGraph();
    } else {
      setSelectedEntityId(entities.at(0)?.id);
    }

    setEditingEntityId(undefined);
    setFormState(emptyFormState);
    setRelationshipFormState(emptyRelationshipFormState);
    setSearchQuery('');
    setTypeFilter('all');
    setError(undefined);
    setRelationshipError(undefined);
  }

  function updateSelectedEntityAfterDelete(
    deletedEntityId: string,
    nextEntities: Entity[],
  ) {
    if (selectedEntityId === deletedEntityId) {
      setSelectedEntityId(nextEntities.at(0)?.id);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="border-b border-slate-300 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
            Product Knowledge Graph
          </p>
          <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950">
                Entity workspace
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {workspaceMode === 'demo'
                  ? 'Explore demo lineage locally without changing saved alpha data.'
                  : 'Capture product knowledge objects using the fixed v0.1 ontology.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Metric label="Entities" value={entities.length} />
              <Metric label="Links" value={relationships.length} />
              <Metric
                label="Types"
                value={new Set(entities.map((entity) => entity.type)).size}
              />
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <aside className="flex flex-col gap-4">
            <form
              aria-label={editingEntity ? 'Edit entity' : 'Create entity'}
              className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm"
              onSubmit={handleSubmit}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {editingEntity ? 'Edit entity' : 'Create entity'}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    Add one product knowledge object at a time.
                  </p>
                </div>
                {editingEntity ? (
                  <button
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    onClick={handleCancelEdit}
                    type="button"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

              <div className="mt-4 flex flex-col gap-4">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Type
                  <select
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100"
                    disabled={Boolean(editingEntity)}
                    onChange={(event) =>
                      setFormState((currentFormState) => ({
                        ...currentFormState,
                        type: event.target.value as EntityType,
                      }))
                    }
                    value={formState.type}
                  >
                    {entityTypes.map((entityType) => (
                      <option key={entityType} value={entityType}>
                        {entityTypeConfigs[entityType].label}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="rounded-md bg-slate-100 px-3 py-2 text-xs leading-5 text-slate-600">
                  {entityTypeConfigs[formState.type].description}
                </p>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Title
                  <input
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                    onChange={(event) =>
                      setFormState((currentFormState) => ({
                        ...currentFormState,
                        title: event.target.value,
                      }))
                    }
                    value={formState.title}
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Description
                  <textarea
                    className="min-h-28 rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-950 shadow-sm focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                    onChange={(event) =>
                      setFormState((currentFormState) => ({
                        ...currentFormState,
                        description: event.target.value,
                      }))
                    }
                    value={formState.description}
                  />
                </label>

                {error ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}

                <button
                  className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800"
                  type="submit"
                >
                  {editingEntity ? 'Save changes' : 'Create entity'}
                </button>
              </div>
            </form>

            <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Browse</h2>
              <div className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Search
                  <input
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Title or description"
                    value={searchQuery}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Type
                  <select
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                    onChange={(event) =>
                      setTypeFilter(event.target.value as EntityType | 'all')
                    }
                    value={typeFilter}
                  >
                    <option value="all">All types</option>
                    {entityTypes.map((entityType) => (
                      <option key={entityType} value={entityType}>
                        {entityTypeConfigs[entityType].label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Demo workspace
              </h2>
              <div className="mt-4 grid gap-3">
                <button
                  className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800"
                  onClick={handleLoadDemoData}
                  type="button"
                >
                  Load demo data
                </button>
                <button
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  onClick={handleResetWorkspace}
                  type="button"
                >
                  Reset workspace
                </button>
              </div>
            </div>
          </aside>

          <section className="grid min-h-0 gap-4 lg:grid-cols-[minmax(320px,1fr)_minmax(280px,420px)]">
            <div className="rounded-lg border border-slate-300 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h2 className="text-lg font-semibold text-slate-950">
                  Entities
                </h2>
                <p className="text-sm text-slate-500">
                  {filteredEntities.length} shown
                </p>
              </div>

              {isLoadingGraph ? (
                <EmptyState
                  title="Loading saved graph"
                  description="Retrieving persisted product knowledge."
                />
              ) : loadError ? (
                <div className="p-4">
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {loadError}
                  </p>
                  <button
                    className="mt-3 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    onClick={() => void loadPersistedGraph()}
                    type="button"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredEntities.length > 0 ? (
                <ul className="divide-y divide-slate-200">
                  {filteredEntities.map((entity) => (
                    <li key={entity.id}>
                      <button
                        className={`block w-full px-4 py-4 text-left hover:bg-slate-50 ${
                          selectedEntityId === entity.id ? 'bg-cyan-50' : ''
                        }`}
                        onClick={() => handleSelectEntity(entity.id)}
                        type="button"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium text-slate-950">
                              {entity.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                              {entity.description}
                            </p>
                          </div>
                          <span className="w-fit rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                            {entityTypeConfigs[entity.type].label}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title={entities.length > 0 ? 'No matching entities' : 'No entities yet'}
                  description={
                    entities.length > 0
                      ? 'Adjust the search or type filter to widen the list.'
                      : 'Create the first product knowledge object to start the graph.'
                  }
                />
              )}
            </div>

            <div className="rounded-lg border border-slate-300 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-lg font-semibold text-slate-950">Details</h2>
              </div>

              {selectedEntity ? (
                <article className="p-4">
                  <div className="flex flex-col gap-3">
                    <span className="w-fit rounded-md bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-800">
                      {entityTypeConfigs[selectedEntity.type].label}
                    </span>
                    <h3 className="text-2xl font-semibold text-slate-950">
                      {selectedEntity.title}
                    </h3>
                    <p className="text-sm leading-6 text-slate-700">
                      {selectedEntity.description}
                    </p>
                  </div>

                  <dl className="mt-6 grid gap-3 border-t border-slate-200 pt-4 text-sm">
                    <div>
                      <dt className="font-medium text-slate-600">Created</dt>
                      <dd className="mt-1 text-slate-950">
                        {formatTimestamp(selectedEntity.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-600">Updated</dt>
                      <dd className="mt-1 text-slate-950">
                        {formatTimestamp(selectedEntity.updatedAt)}
                      </dd>
                    </div>
                  </dl>

                  {selectedEntityLineage ? (
                    <LineageTrackerSection
                      backwardPaths={selectedEntityLineage.backwardPaths}
                      decisionSummary={decisionTraceabilitySummary}
                      entity={selectedEntity}
                      forwardPaths={selectedEntityLineage.forwardPaths}
                      onSelectEntity={handleSelectEntity}
                    />
                  ) : null}

                  <CollapsibleSection
                    className="mt-6 border-t border-slate-200 pt-4"
                    defaultOpen={false}
                    description="Immediate links used to build the lineage paths above."
                    meta={`${selectedEntityRelationships.length} connected`}
                    title="Direct connections"
                  >
                    {selectedEntityRelationships.length > 0 ? (
                      <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
                        {selectedEntityRelationships.map((relationship) => {
                          const sourceEntity = entities.find(
                            (entity) => entity.id === relationship.sourceEntityId,
                          );
                          const targetEntity = entities.find(
                            (entity) => entity.id === relationship.targetEntityId,
                          );

                          if (!sourceEntity || !targetEntity) {
                            return null;
                          }

                          const isOutgoing =
                            relationship.sourceEntityId === selectedEntity.id;

                          return (
                            <li
                              className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                              key={relationship.id}
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-950">
                                  {formatRelationshipStatement(
                                    sourceEntity,
                                    relationship,
                                    targetEntity,
                                  )}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {isOutgoing
                                    ? 'Follows from this'
                                    : 'Leads into this'}
                                </p>
                              </div>
                              <button
                                className="w-fit rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  handleDeleteRelationship(relationship.id)
                                }
                                type="button"
                              >
                                Remove
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-3 rounded-md bg-slate-100 px-3 py-3 text-sm leading-6 text-slate-600">
                        No direct connections yet for this entity.
                      </p>
                    )}

                    <form
                      aria-label="Connect this entity"
                      className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3"
                      onSubmit={handleRelationshipSubmit}
                    >
                      <h5 className="text-sm font-semibold text-slate-950">
                        Connect this entity
                      </h5>
                      {allowedRelationshipRules.length > 0 ? (
                        <ul className="mt-2 grid gap-1 text-sm leading-6 text-slate-600">
                          {allowedRelationshipRules.map((allowedRelationship) => (
                            <li
                              key={`${allowedRelationship.relationship}-${allowedRelationship.target}`}
                            >
                              {formatConnectionHint(allowedRelationship)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          This entity has no next-step connections in the v0.1
                          ontology.
                        </p>
                      )}
                      <div className="mt-3 grid gap-3">
                        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                          Connection type
                          <select
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                            onChange={(event) =>
                              setRelationshipFormState({
                                relationship: event.target
                                  .value as RelationshipType,
                                targetEntityId: '',
                              })
                            }
                            value={relationshipFormState.relationship}
                          >
                            <option value="">Choose connection type</option>
                            {allowedRelationshipRules.map((allowedRelationship) => (
                              <option
                                key={`${allowedRelationship.relationship}-${allowedRelationship.target}`}
                                value={allowedRelationship.relationship}
                              >
                                {entityTypeConfigs[allowedRelationship.source].label}{' '}
                                {
                                  relationshipTypeConfigs[
                                    allowedRelationship.relationship
                                  ].label
                                }{' '}
                                {entityTypeConfigs[allowedRelationship.target].label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                          Connect to
                          <select
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100"
                            disabled={!relationshipFormState.relationship}
                            onChange={(event) =>
                              setRelationshipFormState(
                                (currentFormState) => ({
                                  ...currentFormState,
                                  targetEntityId: event.target.value,
                                }),
                              )
                            }
                            value={relationshipFormState.targetEntityId}
                          >
                            <option value="">
                              {selectedRelationshipRule
                                ? `Choose ${
                                    entityTypeConfigs[
                                      selectedRelationshipRule.target
                                    ].label
                                  }`
                                : 'Choose connection type first'}
                            </option>
                            {validTargetEntities.map((entity) => (
                              <option key={entity.id} value={entity.id}>
                                {entity.title}
                              </option>
                            ))}
                          </select>
                        </label>

                        {selectedRelationshipRule &&
                        validTargetEntities.length === 0 ? (
                          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            Create{' '}
                            {formatEntityTypeWithArticle(
                              selectedRelationshipRule.target,
                            )}{' '}
                            before this{' '}
                            {entityTypeConfigs[selectedRelationshipRule.source].label}{' '}
                            can be connected.
                          </p>
                        ) : null}

                        {connectionPreview ? (
                          <p className="rounded-md bg-cyan-50 px-3 py-2 text-sm leading-6 text-cyan-900">
                            Preview: {connectionPreview}
                          </p>
                        ) : null}

                        {relationshipError ? (
                          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {relationshipError}
                          </p>
                        ) : null}

                        <button
                          className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800"
                          type="submit"
                        >
                          Connect entity
                        </button>
                      </div>
                    </form>
                  </CollapsibleSection>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      onClick={() => handleEdit(selectedEntity)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(selectedEntity.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ) : (
                <EmptyState
                  title="Select an entity"
                  description="Choose an entity from the list to inspect its details."
                />
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function LineageTrackerSection({
  backwardPaths,
  decisionSummary,
  entity,
  forwardPaths,
  onSelectEntity,
}: {
  backwardPaths: LineagePath[];
  decisionSummary?: DecisionTraceabilitySummary;
  entity: Entity;
  forwardPaths: LineagePath[];
  onSelectEntity: (entityId: string) => void;
}) {
  const isDecision = entity.type === 'decision';
  const lineageChains = createLineageChains({
    backwardPaths,
    decisionSummary,
    forwardPaths,
  }).slice(0, lineageDisplayPathLimit);

  return (
    <CollapsibleSection
      ariaLabel="Lineage tracker"
      className="mt-6 border-t border-slate-200 pt-4"
      defaultOpen={false}
      description={
        isDecision
          ? 'Track what supports this decision, what happened afterwards and where connections are missing.'
          : getLineageDescription(entity.type)
      }
      meta={getLineageTrackerMeta({
        chains: lineageChains,
        decisionSummary,
      })}
      title="Lineage tracker"
    >
      <LineageChainGroup
        chains={lineageChains}
        emptyDescription={getLineageEmptyDescription(entity.type)}
        onSelectEntity={onSelectEntity}
        selectedEntityId={entity.id}
      />
      {decisionSummary ? (
        <TraceabilityGapGroup gaps={decisionSummary.traceabilityGaps} />
      ) : null}
    </CollapsibleSection>
  );
}

function LineageChainGroup({
  chains,
  emptyDescription,
  onSelectEntity,
  selectedEntityId,
}: {
  chains: LineageChain[];
  emptyDescription: string;
  onSelectEntity: (entityId: string) => void;
  selectedEntityId: string;
}) {
  return (
    <CollapsibleSection
      className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2"
      meta={`${chains.length} ${chains.length === 1 ? 'chain' : 'chains'}`}
      title="Lineage chains"
    >
      {chains.length > 0 ? (
        <ul className="grid gap-3">
          {chains.map((chain) => (
            <li
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
              key={chain.key}
            >
              <LineageChainView
                chain={chain}
                onSelectEntity={onSelectEntity}
                selectedEntityId={selectedEntityId}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md bg-slate-100 px-3 py-3 text-sm leading-6 text-slate-600">
          {emptyDescription}
        </p>
      )}
    </CollapsibleSection>
  );
}

function TraceabilityGapGroup({
  gaps,
}: {
  gaps: DecisionTraceabilitySummary['traceabilityGaps'];
}) {
  return (
    <CollapsibleSection
      className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2"
      meta={`${gaps.length} ${gaps.length === 1 ? 'gap' : 'gaps'}`}
      title="Traceability gaps"
    >
      {gaps.length > 0 ? (
        <ul className="grid gap-2">
          {gaps.map((gap) => (
            <li
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
              key={gap.code}
            >
              <p className="text-sm font-medium text-amber-900">{gap.label}</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                {gap.message}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md bg-slate-100 px-3 py-3 text-sm leading-6 text-slate-600">
          No traceability gaps found for this decision.
        </p>
      )}
    </CollapsibleSection>
  );
}

function CollapsibleSection({
  ariaLabel,
  children,
  className,
  defaultOpen = true,
  description,
  meta,
  title,
}: {
  ariaLabel?: string;
  children: ReactNode;
  className: string;
  defaultOpen?: boolean;
  description?: string;
  meta?: string;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = `${normaliseId(title)}-content`;

  return (
    <section aria-label={ariaLabel ?? title} className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            aria-controls={contentId}
            aria-expanded={isOpen}
            className="flex items-center gap-2 text-left text-sm font-semibold text-slate-950 hover:text-cyan-800"
            onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
            type="button"
          >
            <span aria-hidden="true" className="w-3 text-xs text-slate-500">
              {isOpen ? '-' : '+'}
            </span>
            <span>{title}</span>
          </button>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {meta ? (
          <p className="shrink-0 text-xs font-medium text-slate-500">{meta}</p>
        ) : null}
      </div>
      {isOpen ? (
        <div className="mt-3" id={contentId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

function getLineageTrackerMeta({
  chains,
  decisionSummary,
}: {
  chains: LineageChain[];
  decisionSummary?: DecisionTraceabilitySummary;
}) {
  if (decisionSummary) {
    return `${chains.length} chains, ${decisionSummary.traceabilityGaps.length} gaps`;
  }

  return `${chains.length} ${chains.length === 1 ? 'chain' : 'chains'}`;
}

function normaliseId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function createLineageChains({
  backwardPaths,
  decisionSummary,
  forwardPaths,
}: {
  backwardPaths: LineagePath[];
  decisionSummary?: DecisionTraceabilitySummary;
  forwardPaths: LineagePath[];
}): LineageChain[] {
  const upstreamPaths = removePartialLineagePaths(
    decisionSummary?.supportingLineagePaths ?? backwardPaths,
  );
  const downstreamPaths = removePartialLineagePaths(
    decisionSummary?.downstreamOutcomePaths ?? forwardPaths,
  );
  const chains: LineageChain[] = [];

  if (upstreamPaths.length > 0 && downstreamPaths.length > 0) {
    upstreamPaths.forEach((upstreamPath) => {
      downstreamPaths.forEach((downstreamPath) => {
        chains.push(createLineageChain([
          ...upstreamPath.segments,
          ...downstreamPath.segments,
        ]));
      });
    });
  } else {
    [...upstreamPaths, ...downstreamPaths].forEach((path) => {
      chains.push(createLineageChain(path.segments));
    });
  }

  return removePartialLineageChains(dedupeLineageChains(chains));
}

function createLineageChain(segments: LineagePath['segments']): LineageChain {
  return {
    key: createRelationshipSequenceKey(segments),
    segments,
  };
}

function removePartialLineagePaths(paths: LineagePath[]) {
  const chains = paths.map((path) => createLineageChain(path.segments));
  const completeChains = removePartialLineageChains(dedupeLineageChains(chains));
  const completeKeys = new Set(completeChains.map((chain) => chain.key));

  return paths.filter((path) =>
    completeKeys.has(createRelationshipSequenceKey(path.segments)),
  );
}

function dedupeLineageChains(chains: LineageChain[]) {
  const chainsByKey = new Map<string, LineageChain>();

  chains.forEach((chain) => {
    if (!chainsByKey.has(chain.key)) {
      chainsByKey.set(chain.key, chain);
    }
  });

  return [...chainsByKey.values()];
}

function removePartialLineageChains(chains: LineageChain[]) {
  return [...chains]
    .sort((leftChain, rightChain) => rightChain.segments.length - leftChain.segments.length)
    .filter((candidateChain, _index, sortedChains) =>
      !sortedChains.some(
        (otherChain) =>
          otherChain !== candidateChain &&
          otherChain.segments.length > candidateChain.segments.length &&
          isRelationshipSequenceSubset(candidateChain.segments, otherChain.segments),
      ),
    );
}

function isRelationshipSequenceSubset(
  candidateSegments: LineagePath['segments'],
  otherSegments: LineagePath['segments'],
) {
  const candidateRelationshipIds = candidateSegments.map(
    (segment) => segment.relationship.id,
  );
  const otherRelationshipIds = otherSegments.map(
    (segment) => segment.relationship.id,
  );

  if (
    candidateRelationshipIds.length === 0 ||
    candidateRelationshipIds.length >= otherRelationshipIds.length
  ) {
    return false;
  }

  return otherRelationshipIds.some((_, startIndex) =>
    candidateRelationshipIds.every(
      (relationshipId, offset) =>
        otherRelationshipIds[startIndex + offset] === relationshipId,
    ),
  );
}

function createRelationshipSequenceKey(segments: LineagePath['segments']) {
  return segments.map((segment) => segment.relationship.id).join('-');
}

function LineageChainView({
  chain,
  onSelectEntity,
  selectedEntityId,
}: {
  chain: LineageChain;
  onSelectEntity: (entityId: string) => void;
  selectedEntityId: string;
}) {
  const chainEntities = getLineageChainEntities(chain);

  if (chainEntities.length === 0) {
    return null;
  }

  return (
    <ol className="grid gap-2 text-sm">
      {chainEntities.map((chainEntity, index) => (
        <li className="grid gap-2" key={`${chainEntity.entity.id}-${index}`}>
          {index > 0 ? (
            <p className="pl-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {chain.segments[index - 1]?.relationshipLabel}
            </p>
          ) : null}
          <EntityStep
            entity={chainEntity.entity}
            isSelected={chainEntity.entity.id === selectedEntityId}
            label={chainEntity.label}
            onSelectEntity={onSelectEntity}
          />
        </li>
      ))}
    </ol>
  );
}

function getLineageChainEntities(chain: LineageChain) {
  const firstSegment = chain.segments[0];

  if (!firstSegment) {
    return [];
  }

  return [
    {
      entity: firstSegment.sourceEntity,
      label: firstSegment.sourceLabel,
    },
    ...chain.segments.map((segment) => ({
      entity: segment.targetEntity,
      label: segment.targetLabel,
    })),
  ];
}

function EntityStep({
  entity,
  isSelected,
  label,
  onSelectEntity,
}: {
  entity: Entity;
  isSelected: boolean;
  label: string;
  onSelectEntity: (entityId: string) => void;
}) {
  return (
    <button
      className={`rounded-md border px-3 py-2 text-left leading-6 ${
        isSelected
          ? 'border-cyan-300 bg-cyan-50 text-cyan-950'
          : 'border-transparent text-slate-700 hover:border-slate-300 hover:bg-white'
      }`}
      onClick={() => onSelectEntity(entity.id)}
      type="button"
    >
      <span className="font-semibold text-slate-950">{label}:</span>{' '}
      {entity.title}
      {isSelected ? (
        <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-cyan-700">
          Selected
        </span>
      ) : null}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-right shadow-sm">
      <p className="text-xl font-semibold text-slate-950">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function getLineageDescription(entityType: EntityType) {
  const descriptions: Record<EntityType, string> = {
    research: 'See which insights, decisions and outcomes this research influenced.',
    insight: 'See which opportunities, decisions and outcomes this insight influenced.',
    goal: 'See which opportunities this goal frames or is supported by.',
    opportunity:
      'See what revealed this opportunity and which solutions followed.',
    solution: 'See what motivated this solution and how it was tested.',
    experiment: 'See what led to this experiment and which decisions it informed.',
    decision: 'See what supported this decision and what happened afterwards.',
    outcome: 'See which decision led here and what new insight emerged.',
  };

  return descriptions[entityType];
}

function getLineageEmptyDescription(entityType: EntityType) {
  const descriptions: Record<EntityType, string> = {
    research:
      'No lineage chain is connected yet. Connect this Research to an Insight it produced.',
    insight:
      'No lineage chain is connected yet. Connect this Insight to an Opportunity or Decision.',
    goal:
      'No lineage chain is connected yet. Connect this Goal to an Opportunity it frames or supports.',
    opportunity:
      'No lineage chain is connected yet. Connect this Opportunity to an Insight, Goal or Solution.',
    solution:
      'No lineage chain is connected yet. Connect this Solution to an Opportunity or Experiment.',
    experiment:
      'No lineage chain is connected yet. Connect this Experiment to a Solution, Decision or Insight.',
    decision:
      'No lineage chain is connected yet. Connect an Insight or Experiment that informed this Decision, or an Outcome when one exists.',
    outcome:
      'No lineage chain is connected yet. Connect the Decision that influenced this Outcome or an Insight it produced.',
  };

  return descriptions[entityType];
}

function formatConnectionHint(allowedRelationship: AllowedRelationship) {
  return `This ${entityTypeConfigs[allowedRelationship.source].label} can ${
    relationshipTypeConfigs[allowedRelationship.relationship].label
  } ${formatEntityTypeWithArticle(allowedRelationship.target)}.`;
}

function formatConnectionPreview(
  sourceEntity: Entity,
  relationshipType: RelationshipType,
  targetEntity: Entity,
) {
  return `${sourceEntity.title} ${
    relationshipTypeConfigs[relationshipType].label
  } ${targetEntity.title}`;
}

function formatEntityTypeWithArticle(entityType: EntityType) {
  const label = entityTypeConfigs[entityType].label;
  const article = /^[aeiou]/i.test(label) ? 'an' : 'a';

  return `${article} ${label}`;
}

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function formatRelationshipStatement(
  sourceEntity: Entity,
  relationship: Relationship,
  targetEntity: Entity,
) {
  return `${entityTypeConfigs[sourceEntity.type].label} ${
    relationshipTypeConfigs[relationship.type].label
  } ${entityTypeConfigs[targetEntity.type].label}: ${sourceEntity.title} -> ${
    targetEntity.title
  }`;
}

function createGraphEngineFromData(
  entities: Entity[],
  relationships: Relationship[],
) {
  return createGraphEngine(
    createInMemoryGraphRepository({
      entities,
      relationships,
    }),
  );
}

function createEmptyGraphEngine() {
  return createGraphEngineFromData([], []);
}

function createDemoGraph() {
  const engine = createEmptyGraphEngine();
  const entitiesByKey = new Map<string, Entity>();
  const relationships: Relationship[] = [];

  demoEntities.forEach(({ key, ...entityInput }) => {
    entitiesByKey.set(key, engine.createEntity(entityInput));
  });

  demoRelationships.forEach((relationshipInput) => {
    const sourceEntity = entitiesByKey.get(relationshipInput.sourceKey);
    const targetEntity = entitiesByKey.get(relationshipInput.targetKey);

    if (!sourceEntity || !targetEntity) {
      throw new Error(
        `Demo relationship references missing entity: ${relationshipInput.sourceKey} -> ${relationshipInput.targetKey}`,
      );
    }

    relationships.push(
      engine.createRelationship({
        type: relationshipInput.type,
        sourceEntityId: sourceEntity.id,
        targetEntityId: targetEntity.id,
      }),
    );
  });

  const selectedEntity = entitiesByKey.get('decision');

  return {
    engine,
    entities: engine.listEntities(),
    relationships,
    selectedEntityId: selectedEntity?.id,
  };
}

export default App;
