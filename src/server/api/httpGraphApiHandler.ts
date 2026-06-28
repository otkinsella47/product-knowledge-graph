import { resolveAlphaWorkspace } from './alphaWorkspace';
import {
  handleConfiguredGraphApiRequest,
  type GraphApiServiceOptions,
} from './graphApiServices';

export type GraphHttpRequest = {
  method: string;
  path: string;
  cookieHeader?: string | string[];
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
    error.message.includes('relation "workspaces" does not exist') ||
    error.message.includes('relation "entities" does not exist') ||
    error.message.includes('relation "relationships" does not exist')
  );
}
