import { createPersistentGraphEngine } from '../domain/persistentGraphEngine.js';
import {
  createPostgresGraphRepository,
  createPostgresPoolFromEnv,
  ensureUserDefaultWorkspace,
  ensureWorkspace,
  type PostgresQueryClient,
} from '../persistence/postgresGraphRepository.js';
import { handleGraphApiRequest, type GraphApiRequest } from './graphApi.js';

let sharedClient: PostgresQueryClient | undefined;

export type GraphApiServiceOptions = {
  authenticatedUserEmail?: string;
  client?: PostgresQueryClient;
  workspaceId?: string;
};

export async function handleConfiguredGraphApiRequest(
  request: GraphApiRequest,
  options: GraphApiServiceOptions = {},
) {
  const client = options.client ?? getSharedClient();
  const workspaceId = options.authenticatedUserEmail
    ? (
        await ensureUserDefaultWorkspace(client, {
          email: options.authenticatedUserEmail,
        })
      ).workspaceId
    : options.workspaceId;

  if (!workspaceId) {
    throw new Error('Workspace id is required for graph API requests.');
  }

  if (!options.authenticatedUserEmail) {
    await ensureWorkspace(client, workspaceId);
  }

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
