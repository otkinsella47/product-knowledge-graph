import { createPersistentGraphEngine } from '../domain/persistentGraphEngine';
import {
  createPostgresGraphRepository,
  createPostgresPoolFromEnv,
  ensureWorkspace,
  type PostgresQueryClient,
} from '../persistence/postgresGraphRepository';
import { handleGraphApiRequest, type GraphApiRequest } from './graphApi';

const defaultWorkspaceId = 'alpha-default-workspace';
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
  const workspaceId =
    options.workspaceId ??
    process.env.GRAPH_WORKSPACE_ID ??
    defaultWorkspaceId;

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
