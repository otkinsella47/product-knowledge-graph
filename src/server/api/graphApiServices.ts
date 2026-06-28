import { createPersistentGraphEngine } from '../domain/persistentGraphEngine';
import {
  createPostgresGraphRepository,
  createPostgresPoolFromEnv,
  ensureWorkspace,
  type PostgresQueryClient,
} from '../persistence/postgresGraphRepository';
import { handleGraphApiRequest, type GraphApiRequest } from './graphApi';

let sharedClient: PostgresQueryClient | undefined;

export type GraphApiServiceOptions = {
  client?: PostgresQueryClient;
  workspaceId?: string;
};

export async function handleConfiguredGraphApiRequest(
  request: GraphApiRequest,
  options: GraphApiServiceOptions = {},
) {
  const client = options.client ?? getSharedClient();
  const workspaceId = options.workspaceId;

  if (!workspaceId) {
    throw new Error('Workspace id is required for graph API requests.');
  }

  await ensureWorkspace(client, workspaceId);

  const repository = createPostgresGraphRepository({
    client,
    workspaceId,
  });
  const engine = createPersistentGraphEngine(repository);

  return handleGraphApiRequest(request, { engine });
}

function getSharedClient(): PostgresQueryClient {
  sharedClient ??= createPostgresPoolFromEnv();

  return sharedClient;
}
