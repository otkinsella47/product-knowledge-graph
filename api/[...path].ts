import { type IncomingMessage, type ServerResponse } from 'node:http';
import { handleGraphHttpRequest } from '../src/server/api/httpGraphApiHandler';

export default async function handler(
  request: IncomingMessage & {
    body?: unknown;
    query?: Record<string, string | string[]>;
  },
  response: ServerResponse,
) {
  try {
    const result = await handleGraphHttpRequest({
      method: request.method ?? 'GET',
      path: createApiPath(request),
      cookieHeader: request.headers.cookie,
      authorizationHeader: request.headers.authorization,
      accessTokenHeader: request.headers['x-alpha-access-token'],
      body: request.body ?? (await readJsonBody(request)),
    });

    response.statusCode = result.status;
    Object.entries(result.headers).forEach(([name, value]) => {
      response.setHeader(name, value);
    });

    if (result.body === undefined) {
      response.end();
      return;
    }

    response.end(JSON.stringify(result.body));
  } catch (error) {
    console.error('Unhandled graph API adapter error', error);

    response.statusCode = 500;
    response.setHeader('content-type', 'application/json');
    response.end(
      JSON.stringify({
        error:
          'Graph API failed before the request could be handled. Check serverless function logs for details.',
      }),
    );
  }
}

function createApiPath(
  request: IncomingMessage & {
    query?: Record<string, string | string[]>;
    url?: string;
  },
): string {
  const path = request.query?.path;

  if (typeof path === 'string') {
    return `/api/${path}`;
  }

  if (Array.isArray(path)) {
    return `/api/${path.join('/')}`;
  }

  return request.url ?? '/api';
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  if (request.method === 'GET' || request.method === 'DELETE') {
    return undefined;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');

  if (!rawBody) {
    return undefined;
  }

  return JSON.parse(rawBody);
}
