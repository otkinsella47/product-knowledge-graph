import { type IncomingMessage, type ServerResponse } from 'node:http';
import { createPostgresPoolFromEnv } from '../../src/server/persistence/postgresGraphRepository';

type DbHealthResponse = {
  ok: boolean;
  route: '/api/health/db';
  checks: {
    databaseUrlConfigured: boolean;
    persistenceModuleImported: boolean;
    poolCreated: boolean;
    querySucceeded: boolean;
  };
  error?: {
    stage: string;
    message: string;
    code?: string;
  };
};

export default async function handler(
  _request: IncomingMessage,
  response: ServerResponse,
) {
  const checks: DbHealthResponse['checks'] = {
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    persistenceModuleImported: false,
    poolCreated: false,
    querySucceeded: false,
  };
  let pool: { query(text: string): Promise<unknown>; end(): Promise<void> } | undefined;

  try {
    console.error('DB health check entered', {
      databaseUrlConfigured: checks.databaseUrlConfigured,
    });

    checks.persistenceModuleImported = true;
    console.error('DB health persistence module available');

    pool = createPostgresPoolFromEnv();
    checks.poolCreated = true;
    console.error('DB health pool created');

    await pool.query('select 1 as ok');
    checks.querySucceeded = true;
    console.error('DB health query succeeded');

    writeJson(response, 200, {
      ok: true,
      route: '/api/health/db',
      checks,
    });
  } catch (error) {
    const diagnosticError = toDiagnosticError(error);

    console.error('DB health check failed', diagnosticError);

    writeJson(response, 503, {
      ok: false,
      route: '/api/health/db',
      checks,
      error: diagnosticError,
    });
  } finally {
    if (pool) {
      await pool.end().catch((error: unknown) => {
        console.error('DB health pool close failed', toDiagnosticError(error));
      });
    }
  }
}

function writeJson(
  response: ServerResponse,
  status: number,
  body: DbHealthResponse,
) {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(body));
}

function toDiagnosticError(error: unknown): {
  stage: string;
  message: string;
  code?: string;
} {
  if (!(error instanceof Error)) {
    return {
      stage: 'unknown',
      message: 'Unexpected non-error failure.',
    };
  }

  const errorWithCode = error as Error & { code?: unknown };

  return {
    stage: inferStage(error),
    message: sanitiseErrorMessage(error.message),
    code: typeof errorWithCode.code === 'string' ? errorWithCode.code : undefined,
  };
}

function inferStage(error: Error): string {
  if (error.message.includes('DATABASE_URL is required')) {
    return 'config';
  }

  return 'database';
}

function sanitiseErrorMessage(message: string): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return message;
  }

  return message.split(databaseUrl).join('[redacted DATABASE_URL]');
}
