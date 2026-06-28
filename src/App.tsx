import { type FormEvent, useMemo, useState } from 'react';
import { type Entity, type Relationship } from './domain/graph';
import {
  createGraphEngine,
  type DecisionTraceabilitySummary,
  type GraphEngine,
  type LineagePath,
} from './domain/graphEngine';
import { createInMemoryGraphRepository } from './domain/graphRepository';
import {
  type EntityType,
  type RelationshipType,
  entityTypeConfigs,
  entityTypes,
  getAllowedRelationshipsForSource,
  relationshipTypeConfigs,
} from './domain/ontology';

type EntityFormState = {
  type: EntityType;
  title: string;
  description: string;
};

type RelationshipFormState = {
  relationship: RelationshipType | '';
  targetEntityId: string;
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

function App() {
  const graphEngine = useMemo<GraphEngine>(
    () => createGraphEngine(createInMemoryGraphRepository()),
    [],
  );

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
  const decisionTraceabilitySummary =
    selectedEntity?.type === 'decision'
      ? graphEngine.getDecisionTraceabilitySummary(selectedEntity.id)
      : undefined;
  const selectedEntityLineage = selectedEntity
    ? {
        backwardPaths: graphEngine
          .getBackwardLineagePaths(selectedEntity.id, {
            maxDepth: lineageTraversalMaxDepth,
          })
          .slice(0, lineageDisplayPathLimit),
        forwardPaths: graphEngine
          .getForwardLineagePaths(selectedEntity.id, {
            maxDepth: lineageTraversalMaxDepth,
          })
          .slice(0, lineageDisplayPathLimit),
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

  function syncEntities(nextSelectedEntityId?: string) {
    const nextEntities = graphEngine.listEntities();

    setEntities(nextEntities);

    if (nextSelectedEntityId) {
      setSelectedEntityId(nextSelectedEntityId);
      return;
    }

    if (
      selectedEntityId &&
      !nextEntities.some((entity) => entity.id === selectedEntityId)
    ) {
      setSelectedEntityId(nextEntities.at(0)?.id);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = formState.title.trim();
    const description = formState.description.trim();

    if (!title || !description) {
      setError('Title and description are required.');
      return;
    }

    if (editingEntityId) {
      const updatedEntity = graphEngine.updateEntity(editingEntityId, {
        title,
        description,
      });

      if (updatedEntity) {
        syncEntities(updatedEntity.id);
      }
    } else {
      const entity = graphEngine.createEntity({
        type: formState.type,
        title,
        description,
      });

      if (entity) {
        syncEntities(entity.id);
      }
    }

    setError(undefined);
    setEditingEntityId(undefined);
    setFormState(emptyFormState);
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

  function handleDelete(entityId: string) {
    try {
      graphEngine.deleteEntity(entityId);
      setEditingEntityId((currentEntityId) =>
        currentEntityId === entityId ? undefined : currentEntityId,
      );
      setFormState((currentFormState) =>
        editingEntityId === entityId ? emptyFormState : currentFormState,
      );
      setError(undefined);
      syncEntities();
    } catch {
      setError('Remove relationships before deleting this entity.');
    }
  }

  function handleSelectEntity(entityId: string) {
    setSelectedEntityId(entityId);
    setRelationshipFormState(emptyRelationshipFormState);
    setRelationshipError(undefined);
  }

  function handleRelationshipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEntity) {
      setRelationshipError('Select an entity before adding a relationship.');
      return;
    }

    if (!relationshipFormState.relationship) {
      setRelationshipError('Choose a relationship type.');
      return;
    }

    if (!relationshipFormState.targetEntityId) {
      setRelationshipError('Choose a target entity.');
      return;
    }

    try {
      const relationship = graphEngine.createRelationship({
        type: relationshipFormState.relationship,
        sourceEntityId: selectedEntity.id,
        targetEntityId: relationshipFormState.targetEntityId,
      });

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

  function handleDeleteRelationship(relationshipId: string) {
    graphEngine.deleteRelationship(relationshipId);
    setRelationships((currentRelationships) =>
      currentRelationships.filter(
        (relationship) => relationship.id !== relationshipId,
      ),
    );
    setRelationshipError(undefined);
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
                Capture product knowledge objects using the fixed v0.1 ontology.
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

              {filteredEntities.length > 0 ? (
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

                  <section className="mt-6 border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-base font-semibold text-slate-950">
                        Relationships
                      </h4>
                      <p className="text-sm text-slate-500">
                        {selectedEntityRelationships.length} connected
                      </p>
                    </div>

                    {selectedEntityRelationships.length > 0 ? (
                      <ul className="mt-3 divide-y divide-slate-200 rounded-md border border-slate-200">
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
                                  {isOutgoing ? 'Outgoing' : 'Incoming'} link
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
                        No relationships yet for this entity.
                      </p>
                    )}

                    <form
                      aria-label="Add relationship"
                      className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3"
                      onSubmit={handleRelationshipSubmit}
                    >
                      <h5 className="text-sm font-semibold text-slate-950">
                        Add outgoing relationship
                      </h5>
                      <div className="mt-3 grid gap-3">
                        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                          Relationship
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
                            <option value="">Choose relationship</option>
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
                          Target entity
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
                                : 'Choose relationship first'}
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
                            Create a{' '}
                            {entityTypeConfigs[selectedRelationshipRule.target].label}{' '}
                            entity before adding this relationship.
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
                          Add relationship
                        </button>
                      </div>
                    </form>
                  </section>

                  {selectedEntityLineage ? (
                    <LineageSection
                      backwardPaths={selectedEntityLineage.backwardPaths}
                      forwardPaths={selectedEntityLineage.forwardPaths}
                    />
                  ) : null}

                  {decisionTraceabilitySummary ? (
                    <DecisionTraceabilitySection
                      summary={decisionTraceabilitySummary}
                    />
                  ) : null}

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

function LineageSection({
  backwardPaths,
  forwardPaths,
}: {
  backwardPaths: LineagePath[];
  forwardPaths: LineagePath[];
}) {
  return (
    <section
      aria-label="Lineage"
      className="mt-6 border-t border-slate-200 pt-4"
    >
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-semibold text-slate-950">Lineage</h4>
        <p className="text-sm leading-6 text-slate-600">
          Follow how knowledge flows into and out of this entity.
        </p>
      </div>

      <TraceabilityPathGroup
        emptyDescription="No upstream lineage is connected yet."
        paths={backwardPaths}
        title="What led here"
      />
      <TraceabilityPathGroup
        emptyDescription="No downstream lineage is connected yet."
        paths={forwardPaths}
        title="What followed"
      />
    </section>
  );
}

function DecisionTraceabilitySection({
  summary,
}: {
  summary: DecisionTraceabilitySummary;
}) {
  return (
    <section
      aria-label="Decision traceability"
      className="mt-6 border-t border-slate-200 pt-4"
    >
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-semibold text-slate-950">
          Decision traceability
        </h4>
        <p className="text-sm leading-6 text-slate-600">
          Review the knowledge paths connected to this decision.
        </p>
      </div>

      <TraceabilityPathGroup
        emptyDescription="No supporting lineage is connected yet."
        paths={summary.supportingLineagePaths}
        title="Supporting lineage"
      />
      <TraceabilityPathGroup
        emptyDescription="No downstream outcomes are connected yet."
        paths={summary.downstreamOutcomePaths}
        title="Downstream outcomes"
      />

      <section className="mt-4">
        <h5 className="text-sm font-semibold text-slate-950">Lineage gaps</h5>
        {summary.lineageGaps.length > 0 ? (
          <ul className="mt-2 grid gap-2">
            {summary.lineageGaps.map((gap) => (
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
          <p className="mt-2 rounded-md bg-slate-100 px-3 py-3 text-sm leading-6 text-slate-600">
            No lineage gaps found for this decision.
          </p>
        )}
      </section>
    </section>
  );
}

function TraceabilityPathGroup({
  emptyDescription,
  paths,
  title,
}: {
  emptyDescription: string;
  paths: LineagePath[];
  title: string;
}) {
  return (
    <section className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <h5 className="text-sm font-semibold text-slate-950">{title}</h5>
        <p className="text-xs font-medium text-slate-500">
          {paths.length} {paths.length === 1 ? 'path' : 'paths'}
        </p>
      </div>

      {paths.length > 0 ? (
        <ul className="mt-2 grid gap-3">
          {paths.map((path) => (
            <li
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
              key={createLineagePathKey(path)}
            >
              <LineagePathView path={path} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 rounded-md bg-slate-100 px-3 py-3 text-sm leading-6 text-slate-600">
          {emptyDescription}
        </p>
      )}
    </section>
  );
}

function LineagePathView({ path }: { path: LineagePath }) {
  const firstSegment = path.segments[0];

  if (!firstSegment) {
    return null;
  }

  return (
    <ol className="grid gap-2 text-sm">
      <li>
        <EntityStep entity={firstSegment.sourceEntity} label={firstSegment.sourceLabel} />
      </li>
      {path.segments.map((segment) => (
        <li className="grid gap-2" key={segment.relationship.id}>
          <p className="pl-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {segment.relationshipLabel}
          </p>
          <EntityStep entity={segment.targetEntity} label={segment.targetLabel} />
        </li>
      ))}
    </ol>
  );
}

function EntityStep({ entity, label }: { entity: Entity; label: string }) {
  return (
    <p className="leading-6 text-slate-700">
      <span className="font-semibold text-slate-950">{label}:</span>{' '}
      {entity.title}
    </p>
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

function createLineagePathKey(path: LineagePath) {
  return [
    path.direction,
    path.startEntity.id,
    path.endEntity.id,
    ...path.segments.map((segment) => segment.relationship.id),
  ].join('-');
}

export default App;
