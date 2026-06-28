import {
  type CreateEntityInput,
  type CreateRelationshipInput,
  type Entity,
  type Relationship,
  type UpdateEntityInput,
} from './domain/graph';

export type GraphApiClient = {
  loadGraph(): Promise<{
    entities: Entity[];
    relationships: Relationship[];
  }>;
  createEntity(input: CreateEntityInput): Promise<Entity>;
  updateEntity(id: string, input: UpdateEntityInput): Promise<Entity>;
  deleteEntity(id: string): Promise<void>;
  createRelationship(input: CreateRelationshipInput): Promise<Relationship>;
  deleteRelationship(id: string): Promise<void>;
};

export function createFetchGraphApiClient(
  fetcher: typeof fetch = fetch,
): GraphApiClient {
  return {
    async loadGraph() {
      const [entitiesResponse, relationshipsResponse] = await Promise.all([
        request<{ entities: Entity[] }>(fetcher, '/api/entities'),
        request<{ relationships: Relationship[] }>(fetcher, '/api/relationships'),
      ]);

      return {
        entities: entitiesResponse.entities,
        relationships: relationshipsResponse.relationships,
      };
    },

    async createEntity(input) {
      const response = await request<{ entity: Entity }>(fetcher, '/api/entities', {
        method: 'POST',
        body: input,
      });

      return response.entity;
    },

    async updateEntity(id, input) {
      const response = await request<{ entity: Entity }>(
        fetcher,
        `/api/entities/${id}`,
        {
          method: 'PATCH',
          body: input,
        },
      );

      return response.entity;
    },

    async deleteEntity(id) {
      await request(fetcher, `/api/entities/${id}`, {
        method: 'DELETE',
      });
    },

    async createRelationship(input) {
      const response = await request<{ relationship: Relationship }>(
        fetcher,
        '/api/relationships',
        {
          method: 'POST',
          body: input,
        },
      );

      return response.relationship;
    },

    async deleteRelationship(id) {
      await request(fetcher, `/api/relationships/${id}`, {
        method: 'DELETE',
      });
    },
  };
}

async function request<ResponseBody>(
  fetcher: typeof fetch,
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
): Promise<ResponseBody> {
  const response = await fetcher(path, {
    method: options.method ?? 'GET',
    headers: createRequestHeaders(options.body),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response);
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as ResponseBody;
  }

  return response.json() as Promise<ResponseBody>;
}

function createRequestHeaders(body: unknown): HeadersInit | undefined {
  const headers: Record<string, string> = {};
  const alphaAccessToken = getAlphaAccessTokenFromLocation();

  if (body !== undefined) {
    headers['content-type'] = 'application/json';
  }

  if (alphaAccessToken) {
    headers['x-alpha-access-token'] = alphaAccessToken;
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
}

function getAlphaAccessTokenFromLocation(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return (
    new URLSearchParams(window.location.search)
      .get('alpha_access_token')
      ?.trim() || undefined
  );
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };

    if (typeof body.error === 'string') {
      return body.error;
    }
  } catch {
    // Fall back to status text below.
  }

  return response.statusText || 'API request failed.';
}
