import { type IncomingMessage, type ServerResponse } from 'node:http';

export default function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  response.statusCode = 200;
  response.setHeader('content-type', 'application/json');
  response.end(
    JSON.stringify({
      ok: true,
      route: '/api/health',
      method: request.method ?? 'GET',
    }),
  );
}
