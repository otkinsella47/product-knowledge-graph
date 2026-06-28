import { describe, expect, it } from 'vitest';
import { type QueryResultRow } from 'pg';
import { GraphEngineError } from '../../domain/graphEngine';
import { createPersistentGraphEngine } from '../domain/persistentGraphEngine';
import {
  createPostgresGraphRepository,
  createPostgresPoolFromEnv,
  type PostgresQueryClient,
} from './postgresGraphRepository';

describe('postgres graph repository', () => {
  it('configures a bounded pool for serverless graph API requests', async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;

    process.env.DATABASE_URL =
      'postgres://user:password@localhost:5432/product_knowledge_graph';

    try {
      const pool = createPostgresPoolFromEnv();
      const options = pool.options as {
        connectionTimeoutMillis?: number;
        idleTimeoutMillis?: number;
        max?: number;
      };

      expect(options.connectionTimeoutMillis).toBe(5_000);
      expect(options.idleTimeoutMillis).toBe(10_000);
      expect(options.max).toBe(1);

      await pool.end();
    } finally {
      restoreEnv('DATABASE_URL', previousDatabaseUrl);
    }
  });

  it('saves and loads entities in a workspace', async () => {
    const client = new FakePostgresClient();
    const repository = createTestRepository(client, 'workspace-a');

    const entity = await repository.createEntity({
      type: 'insight',
      title: 'Teams lose decision context',
      description: 'Decision rationale gets scattered after discovery.',
      metadata: {
        reviewed: true,
      },
    });

    expect(entity).toEqual({
      id: 'test-id-1',
      workspaceId: 'workspace-a',
      type: 'insight',
      title: 'Teams lose decision context',
      description: 'Decision rationale gets scattered after discovery.',
      metadata: {
        reviewed: true,
      },
      createdAt: '2026-06-21T10:00:00.000Z',
      updatedAt: '2026-06-21T10:00:00.000Z',
    });
    await expect(repository.getEntity(entity.id)).resolves.toEqual(entity);
    await expect(repository.listEntities()).resolves.toEqual([entity]);
  });

  it('saves and loads relationships in a workspace', async () => {
    const client = new FakePostgresClient();
    const repository = createTestRepository(client, 'workspace-a');

    const insight = await repository.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'Onboarding copy is unclear.',
    });
    const decision = await repository.createEntity({
      type: 'decision',
      title: 'Improve onboarding messaging',
      description: 'Revise first-run copy.',
    });

    const relationship = await repository.createRelationship({
      type: 'informs',
      sourceEntityId: insight.id,
      targetEntityId: decision.id,
    });

    expect(relationship).toEqual({
      id: 'test-id-3',
      workspaceId: 'workspace-a',
      type: 'informs',
      sourceEntityId: insight.id,
      targetEntityId: decision.id,
      createdAt: '2026-06-21T10:00:00.000Z',
      updatedAt: '2026-06-21T10:00:00.000Z',
    });
    await expect(repository.getRelationship(relationship.id)).resolves.toEqual(
      relationship,
    );
    await expect(repository.listRelationships()).resolves.toEqual([relationship]);
  });

  it('scopes entities and relationships by workspace', async () => {
    const client = new FakePostgresClient();
    const createId = createTestIdGenerator();
    const workspaceARepository = createTestRepository(
      client,
      'workspace-a',
      createId,
    );
    const workspaceBRepository = createTestRepository(
      client,
      'workspace-b',
      createId,
    );

    const workspaceAEntity = await workspaceARepository.createEntity({
      type: 'research',
      title: 'Workspace A research',
      description: 'Visible in workspace A only.',
    });
    const workspaceBEntity = await workspaceBRepository.createEntity({
      type: 'research',
      title: 'Workspace B research',
      description: 'Visible in workspace B only.',
    });

    await expect(workspaceARepository.listEntities()).resolves.toEqual([
      workspaceAEntity,
    ]);
    await expect(workspaceBRepository.listEntities()).resolves.toEqual([
      workspaceBEntity,
    ]);
    await expect(workspaceARepository.getEntity(workspaceBEntity.id)).resolves.toBe(
      undefined,
    );
  });

  it('rejects invalid entity and relationship type values', async () => {
    const repository = createTestRepository(new FakePostgresClient(), 'workspace-a');

    await expect(
      repository.createEntity({
        type: 'assumption' as never,
        title: 'Invalid entity',
        description: 'This type is not part of the fixed ontology.',
      }),
    ).rejects.toThrow('Invalid entity type: assumption');

    await expect(
      repository.createRelationship({
        type: 'blocks' as never,
        sourceEntityId: 'source-id',
        targetEntityId: 'target-id',
      }),
    ).rejects.toThrow('Invalid relationship type: blocks');
  });

  it('uses the persistent graph engine to reject invalid relationship combinations', async () => {
    const repository = createTestRepository(new FakePostgresClient(), 'workspace-a');
    const engine = createPersistentGraphEngine(repository);
    const research = await engine.createEntity({
      type: 'research',
      title: 'Interview notes',
      description: 'Raw source material.',
    });
    const decision = await engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding',
      description: 'Decision to improve onboarding.',
    });

    await expect(
      engine.createRelationship({
        type: 'informs',
        sourceEntityId: research.id,
        targetEntityId: decision.id,
      }),
    ).rejects.toThrow(GraphEngineError);
  });

  it('does not delete entities that still have relationships', async () => {
    const client = new FakePostgresClient();
    const repository = createTestRepository(client, 'workspace-a');
    const engine = createPersistentGraphEngine(repository);
    const insight = await engine.createEntity({
      type: 'insight',
      title: 'Users miss onboarding value',
      description: 'Onboarding copy is unclear.',
    });
    const decision = await engine.createEntity({
      type: 'decision',
      title: 'Improve onboarding messaging',
      description: 'Revise first-run copy.',
    });

    await engine.createRelationship({
      type: 'informs',
      sourceEntityId: insight.id,
      targetEntityId: decision.id,
    });

    await expect(engine.deleteEntity(insight.id)).rejects.toThrow(
      'Cannot delete entity with existing relationships',
    );
    await expect(repository.getEntity(insight.id)).resolves.toEqual(insight);
  });
});

type FakeEntityRow = {
  id: string;
  workspace_id: string;
  type: string;
  title: string;
  description: string;
  metadata: Record<string, string | number | boolean | null> | null;
  created_at: string;
  updated_at: string;
};

type FakeRelationshipRow = {
  id: string;
  workspace_id: string;
  type: string;
  source_entity_id: string;
  target_entity_id: string;
  created_at: string;
  updated_at: string;
};

class FakePostgresClient implements PostgresQueryClient {
  private readonly entities = new Map<string, FakeEntityRow>();
  private readonly relationships = new Map<string, FakeRelationshipRow>();

  async query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ rows: Row[]; rowCount: number }> {
    const queryText = normaliseSql(text);

    if (queryText.startsWith('insert into entities')) {
      const row: FakeEntityRow = {
        id: String(values[0]),
        workspace_id: String(values[1]),
        type: String(values[2]),
        title: String(values[3]),
        description: String(values[4]),
        metadata: values[5] as FakeEntityRow['metadata'],
        created_at: String(values[6]),
        updated_at: String(values[6]),
      };

      this.entities.set(row.id, row);

      return createResult([asRow<Row>(row)]);
    }

    if (queryText.startsWith('update entities')) {
      const row = this.entities.get(String(values[0]));

      if (!row || row.workspace_id !== values[1]) {
        return createResult([]);
      }

      const updatedRow: FakeEntityRow = {
        ...row,
        title: String(values[2]),
        description: String(values[3]),
        metadata: values[4] as FakeEntityRow['metadata'],
        updated_at: String(values[5]),
      };

      this.entities.set(updatedRow.id, updatedRow);

      return createResult([asRow<Row>(updatedRow)]);
    }

    if (queryText.startsWith('select id from relationships')) {
      const row = [...this.relationships.values()].find(
        (relationship) =>
          relationship.workspace_id === values[0] &&
          (relationship.source_entity_id === values[1] ||
            relationship.target_entity_id === values[1]),
      );

      return createResult(row ? [asRow<Row>({ id: row.id })] : []);
    }

    if (queryText.startsWith('delete from entities')) {
      const row = this.entities.get(String(values[0]));

      if (!row || row.workspace_id !== values[1]) {
        return createResult([]);
      }

      this.entities.delete(row.id);

      return createResult([asRow<Row>({ id: row.id })]);
    }

    if (
      queryText.startsWith('select * from entities') &&
      queryText.includes('where id = $1')
    ) {
      const row = this.entities.get(String(values[0]));

      return createResult(
        row && row.workspace_id === values[1] ? [asRow<Row>(row)] : [],
      );
    }

    if (
      queryText.startsWith('select * from entities') &&
      queryText.includes('where workspace_id = $1')
    ) {
      return createResult(
        [...this.entities.values()]
          .filter((row) => row.workspace_id === values[0])
          .sort(compareRows)
          .map((row) => asRow<Row>(row)),
      );
    }

    if (queryText.startsWith('insert into relationships')) {
      const row: FakeRelationshipRow = {
        id: String(values[0]),
        workspace_id: String(values[1]),
        type: String(values[2]),
        source_entity_id: String(values[3]),
        target_entity_id: String(values[4]),
        created_at: String(values[5]),
        updated_at: String(values[5]),
      };

      this.relationships.set(row.id, row);

      return createResult([asRow<Row>(row)]);
    }

    if (queryText.startsWith('update relationships')) {
      const row = this.relationships.get(String(values[0]));

      if (!row || row.workspace_id !== values[1]) {
        return createResult([]);
      }

      const updatedRow: FakeRelationshipRow = {
        ...row,
        type: String(values[2]),
        source_entity_id: String(values[3]),
        target_entity_id: String(values[4]),
        updated_at: String(values[5]),
      };

      this.relationships.set(updatedRow.id, updatedRow);

      return createResult([asRow<Row>(updatedRow)]);
    }

    if (queryText.startsWith('delete from relationships')) {
      const row = this.relationships.get(String(values[0]));

      if (!row || row.workspace_id !== values[1]) {
        return createResult([]);
      }

      this.relationships.delete(row.id);

      return createResult([asRow<Row>({ id: row.id })]);
    }

    if (
      queryText.startsWith('select * from relationships') &&
      queryText.includes('where id = $1')
    ) {
      const row = this.relationships.get(String(values[0]));

      return createResult(
        row && row.workspace_id === values[1] ? [asRow<Row>(row)] : [],
      );
    }

    if (
      queryText.startsWith('select * from relationships') &&
      queryText.includes('where workspace_id = $1')
    ) {
      return createResult(
        [...this.relationships.values()]
          .filter((row) => row.workspace_id === values[0])
          .sort(compareRows)
          .map((row) => asRow<Row>(row)),
      );
    }

    throw new Error(`Unhandled fake Postgres query: ${queryText}`);
  }
}

function createTestRepository(
  client: FakePostgresClient,
  workspaceId: string,
  createId = createTestIdGenerator(),
) {
  return createPostgresGraphRepository({
    client,
    workspaceId,
    createId,
    now: () => '2026-06-21T10:00:00.000Z',
  });
}

function createTestIdGenerator(): () => string {
  let nextId = 1;

  return () => `test-id-${nextId++}`;
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function createResult<Row>(rows: Row[]) {
  return {
    rows,
    rowCount: rows.length,
  };
}

function asRow<Row extends QueryResultRow>(row: QueryResultRow): Row {
  return row as unknown as Row;
}

function normaliseSql(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function compareRows(
  left: { created_at: string; id: string },
  right: { created_at: string; id: string },
) {
  return (
    left.created_at.localeCompare(right.created_at) ||
    left.id.localeCompare(right.id)
  );
}
