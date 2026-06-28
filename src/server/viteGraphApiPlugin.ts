import { type IncomingMessage, type ServerResponse } from 'node:http';
import { type Plugin } from 'vite';
import { resolveAlphaWorkspace } from './api/alphaWorkspace';
import { handleConfiguredGraphApiRequest } from './api/graphApiServices';

export function graphApiPlugin(): Plugin {
  return {
    name: 'graph-api',
    configureServer(server) {
      server.middlewares.use('/api', async (request, response) => {
        await handleApiRequest(request, response);
      });
    },
  };
}

async function handleApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
) {
  response.setHeader('content-type', 'application/json');

  try {
    const workspace = resolveAlphaWorkspace(request.headers.cookie);

    if (workspace.setCookieHeader) {
      response.setHeader('set-cookie', workspace.setCookieHeader);
    }

    const body = await readJsonBody(request);
    const result = await handleConfiguredGraphApiRequest({
      method: request.method ?? 'GET',
      path: `/api${request.url ?? ''}`,
      body,
    }, {
      workspaceId: workspace.workspaceId,
    });

    response.statusCode = result.status;

    if (result.body === undefined) {
      response.end();
      return;
    }

    response.end(JSON.stringify(result.body));
  } catch (error) {
    response.statusCode = 500;
    response.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected API error.',
      }),
    );
  }
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
