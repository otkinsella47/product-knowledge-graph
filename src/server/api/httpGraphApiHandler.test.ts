import { describe, expect, it } from 'vitest';
import { type QueryResultRow } from 'pg';
import { handleGraphHttpRequest } from './httpGraphApiHandler';
import { type PostgresQueryClient } from '../persistence/postgresGraphRepository';

describe('graph HTTP API handler', () => {
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
      if (previousDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDatabaseUrl;
      }
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
