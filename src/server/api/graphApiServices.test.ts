import { describe, expect, it } from 'vitest';
import { type QueryResultRow } from 'pg';
import { handleConfiguredGraphApiRequest } from './graphApiServices';
import { type PostgresQueryClient } from '../persistence/postgresGraphRepository';

describe('configured graph API workspace scoping', () => {
  it('requires a workspace id', async () => {
    await expect(
      handleConfiguredGraphApiRequest(
        {
          method: 'GET',
          path: '/api/entities',
        },
        {
          client: new FakeWorkspaceClient(),
        },
      ),
    ).rejects.toThrow('Workspace id is required');
  });

  it('isolates graph data by workspace id', async () => {
    const client = new FakeWorkspaceClient();

    await handleConfiguredGraphApiRequest(
      {
        method: 'POST',
        path: '/api/entities',
        body: {
          type: 'research',
          title: 'Workspace A research',
          description: 'Visible in workspace A only.',
        },
      },
      {
        client,
        workspaceId: 'workspace-a',
      },
    );

    await handleConfiguredGraphApiRequest(
      {
        method: 'POST',
        path: '/api/entities',
        body: {
          type: 'research',
          title: 'Workspace B research',
          description: 'Visible in workspace B only.',
        },
      },
      {
        client,
        workspaceId: 'workspace-b',
      },
    );

    await expect(
      handleConfiguredGraphApiRequest(
        {
          method: 'GET',
          path: '/api/entities',
        },
        {
          client,
          workspaceId: 'workspace-a',
        },
      ),
    ).resolves.toMatchObject({
      status: 200,
      body: {
        entities: [
          {
            title: 'Workspace A research',
            workspaceId: 'workspace-a',
          },
        ],
      },
    });

    await expect(
      handleConfiguredGraphApiRequest(
        {
          method: 'GET',
          path: '/api/entities',
        },
        {
          client,
          workspaceId: 'workspace-b',
        },
      ),
    ).resolves.toMatchObject({
      status: 200,
      body: {
        entities: [
          {
            title: 'Workspace B research',
            workspaceId: 'workspace-b',
          },
        ],
      },
    });
  });

  it('rejects relationships that cross workspace boundaries', async () => {
    const client = new FakeWorkspaceClient();
    const workspaceAEntity = await handleConfiguredGraphApiRequest(
      {
        method: 'POST',
        path: '/api/entities',
        body: {
          type: 'insight',
          title: 'Workspace A insight',
          description: 'Visible in workspace A only.',
        },
      },
      {
        client,
        workspaceId: 'workspace-a',
      },
    );
    const workspaceBEntity = await handleConfiguredGraphApiRequest(
      {
        method: 'POST',
        path: '/api/entities',
        body: {
          type: 'decision',
          title: 'Workspace B decision',
          description: 'Visible in workspace B only.',
        },
      },
      {
        client,
        workspaceId: 'workspace-b',
      },
    );

    await expect(
      handleConfiguredGraphApiRequest(
        {
          method: 'POST',
          path: '/api/relationships',
          body: {
            type: 'informs',
            sourceEntityId: getEntityId(workspaceAEntity.body),
            targetEntityId: getEntityId(workspaceBEntity.body),
          },
        },
        {
          client,
          workspaceId: 'workspace-a',
        },
      ),
    ).resolves.toMatchObject({
      status: 400,
      body: {
        error: `Relationship target entity does not exist: ${getEntityId(
          workspaceBEntity.body,
        )}`,
      },
    });
  });

  it('scopes graph data to an authenticated user default workspace', async () => {
    const client = new FakeWorkspaceClient();

    await handleConfiguredGraphApiRequest(
      {
        method: 'POST',
        path: '/api/entities',
        body: {
          type: 'research',
          title: 'Authenticated user research',
          description: 'Visible to the signed-in alpha user.',
        },
      },
      {
        client,
        authenticatedUserEmail: 'ALPHA@example.com',
      },
    );

    await expect(
      handleConfiguredGraphApiRequest(
        {
          method: 'GET',
          path: '/api/entities',
        },
        {
          client,
          authenticatedUserEmail: 'alpha@example.com',
        },
      ),
    ).resolves.toMatchObject({
      status: 200,
      body: {
        entities: [
          {
            title: 'Authenticated user research',
          },
        ],
      },
    });

    await expect(
      handleConfiguredGraphApiRequest(
        {
          method: 'GET',
          path: '/api/entities',
        },
        {
          client,
          authenticatedUserEmail: 'other@example.com',
        },
      ),
    ).resolves.toMatchObject({
      status: 200,
      body: {
        entities: [],
      },
    });
  });
});

type FakeEntityRow = QueryResultRow & {
  id: string;
  workspace_id: string;
  type: string;
  title: string;
  description: string;
  metadata: null;
  created_at: string;
  updated_at: string;
};

type FakeRelationshipRow = QueryResultRow & {
  id: string;
  workspace_id: string;
  type: string;
  source_entity_id: string;
  target_entity_id: string;
  created_at: string;
  updated_at: string;
};

type FakeUserRow = QueryResultRow & {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
};

type FakeWorkspaceRow = QueryResultRow & {
  id: string;
  owner_user_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
};

class FakeWorkspaceClient implements PostgresQueryClient {
  private nextId = 1;
  private readonly entities = new Map<string, FakeEntityRow>();
  private readonly relationships = new Map<string, FakeRelationshipRow>();
  private readonly users = new Map<string, FakeUserRow>();
  private readonly workspaces = new Map<string, FakeWorkspaceRow>();

  async query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ rows: Row[]; rowCount: number }> {
    const queryText = text.replace(/\s+/g, ' ').trim().toLowerCase();

    if (
      queryText.startsWith('insert into workspaces') &&
      queryText.includes('owner_user_id') &&
      !queryText.includes('values ($1, null')
    ) {
      const existingWorkspace = [...this.workspaces.values()].find(
        (workspace) => workspace.owner_user_id === values[1],
      );

      if (existingWorkspace) {
        return createResult([asRow<Row>(existingWorkspace)]);
      }

      const row: FakeWorkspaceRow = {
        id: `workspace-${this.nextId++}`,
        owner_user_id: String(values[1]),
        name: String(values[2]),
        created_at: String(values[3]),
        updated_at: String(values[3]),
      };

      this.workspaces.set(row.id, row);

      return createResult([asRow<Row>(row)]);
    }

    if (queryText.startsWith('insert into workspaces')) {
      return createResult([]);
    }

    if (queryText.startsWith('insert into users')) {
      const existingUser = [...this.users.values()].find(
        (user) => user.email === values[1],
      );

      if (existingUser) {
        return createResult([asRow<Row>(existingUser)]);
      }

      const row: FakeUserRow = {
        id: `user-${this.nextId++}`,
        email: String(values[1]),
        created_at: String(values[2]),
        updated_at: String(values[2]),
      };

      this.users.set(row.id, row);

      return createResult([asRow<Row>(row)]);
    }

    if (
      queryText.startsWith('select * from workspaces') &&
      queryText.includes('where owner_user_id = $1')
    ) {
      return createResult(
        [...this.workspaces.values()]
          .filter((workspace) => workspace.owner_user_id === values[0])
          .map((workspace) => asRow<Row>(workspace)),
      );
    }

    if (queryText.startsWith('insert into entities')) {
      const row: FakeEntityRow = {
        id: `entity-${this.nextId++}`,
        workspace_id: String(values[1]),
        type: String(values[2]),
        title: String(values[3]),
        description: String(values[4]),
        metadata: null,
        created_at: String(values[6]),
        updated_at: String(values[6]),
      };

      this.entities.set(row.id, row);

      return createResult([asRow<Row>(row)]);
    }

    if (
      queryText.startsWith('select * from entities') &&
      queryText.includes('where workspace_id = $1')
    ) {
      return createResult(
        [...this.entities.values()]
          .filter((entity) => entity.workspace_id === values[0])
          .map((entity) => asRow<Row>(entity)),
      );
    }

    if (
      queryText.startsWith('select * from entities') &&
      queryText.includes('where id = $1')
    ) {
      const entity = this.entities.get(String(values[0]));

      return createResult(
        entity && entity.workspace_id === values[1] ? [asRow<Row>(entity)] : [],
      );
    }

    if (
      queryText.startsWith('select * from relationships') &&
      queryText.includes('where workspace_id = $1')
    ) {
      return createResult(
        [...this.relationships.values()]
          .filter((relationship) => relationship.workspace_id === values[0])
          .map((relationship) => asRow<Row>(relationship)),
      );
    }

    throw new Error(`Unhandled query: ${queryText}`);
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

function getEntityId(body: unknown): string {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('entity' in body) ||
    typeof body.entity !== 'object' ||
    body.entity === null ||
    !('id' in body.entity) ||
    typeof body.entity.id !== 'string'
  ) {
    throw new Error('Expected entity response body.');
  }

  return body.entity.id;
}
