import { resolveAlphaAuth } from './alphaAuth.js';
import { resolveAlphaWorkspace } from './alphaWorkspace.js';
import {
  handleConfiguredGraphApiRequest,
  type GraphApiServiceOptions,
} from './graphApiServices.js';

export type GraphHttpRequest = {
  method: string;
  path: string;
  cookieHeader?: string | string[];
  authorizationHeader?: string | string[];
  accessTokenHeader?: string | string[];
  body?: unknown;
};

export type GraphHttpResponse = {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
};

export async function handleGraphHttpRequest(
  request: GraphHttpRequest,
  options: GraphApiServiceOptions = {},
): Promise<GraphHttpResponse> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  try {
    const auth = resolveAlphaAuth({
      authorizationHeader: request.authorizationHeader,
      accessTokenHeader: request.accessTokenHeader,
      cookieHeader: request.cookieHeader,
    });

    if (auth.status === 'unauthorized') {
      return {
        status: 401,
        headers,
        body: {
          error: auth.message,
        },
      };
    }

    if (auth.status === 'authenticated') {
      if (auth.setCookieHeader) {
        headers['set-cookie'] = auth.setCookieHeader;
      }

      const result = await handleConfiguredGraphApiRequest(
        {
          method: request.method,
          path: request.path,
          body: request.body,
        },
        {
          ...options,
          authenticatedUserEmail: auth.email,
        },
      );

      return {
        status: result.status,
        headers,
        body: result.body,
      };
    }

    const workspace = resolveAlphaWorkspace(request.cookieHeader);

    if (workspace.setCookieHeader) {
      headers['set-cookie'] = workspace.setCookieHeader;
    }

    const result = await handleConfiguredGraphApiRequest(
      {
        method: request.method,
        path: request.path,
        body: request.body,
      },
      {
        ...options,
        workspaceId: options.workspaceId ?? workspace.workspaceId,
      },
    );

    return {
      status: result.status,
      headers,
      body: result.body,
    };
  } catch (error) {
    const serviceError = toGraphHttpServiceError(error);

    return {
      status: serviceError.status,
      headers,
      body: {
        error: serviceError.message,
      },
    };
  }
}

function toGraphHttpServiceError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof Error) {
    if (error.message.includes('DATABASE_URL is required')) {
      return {
        status: 503,
        message:
          'Graph persistence is not configured. Set DATABASE_URL and apply db/schema.sql before using saved graph data.',
      };
    }

    if (isMissingDatabaseSchemaError(error)) {
      return {
        status: 503,
        message:
          'Graph persistence tables are missing. Apply db/schema.sql to the configured database.',
      };
    }

    if (isDatabaseConnectionError(error)) {
      return {
        status: 503,
        message:
          'Graph persistence database could not be reached. Check DATABASE_URL, database availability, and SSL/pooling settings.',
      };
    }

    return {
      status: 500,
      message: error.message,
    };
  }

  return {
    status: 500,
    message: 'Unexpected graph API error.',
  };
}

function isMissingDatabaseSchemaError(error: Error): boolean {
  const errorWithCode = error as Error & { code?: unknown };

  return (
    errorWithCode.code === '42P01' ||
    error.message.includes('relation "users" does not exist') ||
    error.message.includes('relation "workspaces" does not exist') ||
    error.message.includes('relation "entities" does not exist') ||
    error.message.includes('relation "relationships" does not exist')
  );
}

function isDatabaseConnectionError(error: Error): boolean {
  const errorWithCode = error as Error & { code?: unknown };

  return (
    errorWithCode.code === 'ETIMEDOUT' ||
    errorWithCode.code === 'ECONNREFUSED' ||
    errorWithCode.code === 'ENOTFOUND' ||
    errorWithCode.code === 'ECONNRESET' ||
    error.message.includes('Connection terminated unexpectedly') ||
    error.message.includes('timeout exceeded when trying to connect')
  );
}
