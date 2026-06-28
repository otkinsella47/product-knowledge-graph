import { describe, expect, it } from 'vitest';
import { type QueryResultRow } from 'pg';
import { handleGraphHttpRequest } from './httpGraphApiHandler';
import { type PostgresQueryClient } from '../persistence/postgresGraphRepository';

describe('graph HTTP API handler', () => {
  it('requires alpha auth when anonymous workspaces are disabled', async () => {
    const previousAuthEnabled = process.env.ALPHA_AUTH_ENABLED;
    const previousAnonymousEnabled =
      process.env.ALPHA_ANONYMOUS_WORKSPACE_ENABLED;

    process.env.ALPHA_AUTH_ENABLED = 'true';
    process.env.ALPHA_ANONYMOUS_WORKSPACE_ENABLED = 'false';

    try {
      await expect(
        handleGraphHttpRequest({
          method: 'GET',
          path: '/api/entities',
        }),
      ).resolves.toMatchObject({
        status: 401,
        body: {
          error: 'Alpha access is required for hosted graph persistence.',
        },
      });
    } finally {
      restoreEnv('ALPHA_AUTH_ENABLED', previousAuthEnabled);
      restoreEnv(
        'ALPHA_ANONYMOUS_WORKSPACE_ENABLED',
        previousAnonymousEnabled,
      );
    }
  });

  it('returns a clear configuration error when DATABASE_URL is missing', async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;

    delete process.env.DATABASE_URL;

    try {
      await expect(
        handleGraphHttpRequest({
          method: 'GET',
          path: '/api/entities',
        }),
      ).resolves.toMatchObject({
        status: 503,
        body: {
          error:
            'Graph persistence is not configured. Set DATABASE_URL and apply db/schema.sql before using saved graph data.',
        },
      });
    } finally {
      restoreEnv('DATABASE_URL', previousDatabaseUrl);
    }
  });

  it('returns a clear schema error when graph tables are missing', async () => {
    await expect(
      handleGraphHttpRequest(
        {
          method: 'GET',
          path: '/api/entities',
        },
        {
          client: new MissingSchemaClient(),
          workspaceId: 'workspace-a',
        },
      ),
    ).resolves.toMatchObject({
      status: 503,
      body: {
        error:
          'Graph persistence tables are missing. Apply db/schema.sql to the configured database.',
      },
    });
  });
});

class MissingSchemaClient implements PostgresQueryClient {
  query<Row extends QueryResultRow = QueryResultRow>(): Promise<{
    rows: Row[];
    rowCount: number;
  }> {
    const error = new Error('relation "workspaces" does not exist') as Error & {
      code: string;
    };

    error.code = '42P01';

    return Promise.reject(error);
  }
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
