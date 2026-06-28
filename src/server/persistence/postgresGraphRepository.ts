import { randomUUID } from 'node:crypto';
import { Pool, type QueryResultRow } from 'pg';
import {
  type CreateEntityInput,
  type CreateRelationshipInput,
  type Entity,
  type GraphMetadata,
  type Relationship,
  type UpdateEntityInput,
  type UpdateRelationshipInput,
} from '../../domain/graph';
import {
  isValidEntityType,
  isValidRelationshipType,
} from '../../domain/ontology';

export type PersistentGraphRepository = {
  createEntity(input: CreateEntityInput): Promise<Entity>;
  updateEntity(id: string, input: UpdateEntityInput): Promise<Entity | undefined>;
  deleteEntity(id: string): Promise<boolean>;
  getEntity(id: string): Promise<Entity | undefined>;
  listEntities(): Promise<Entity[]>;
  createRelationship(input: CreateRelationshipInput): Promise<Relationship>;
  updateRelationship(
    id: string,
    input: UpdateRelationshipInput,
  ): Promise<Relationship | undefined>;
  deleteRelationship(id: string): Promise<boolean>;
  getRelationship(id: string): Promise<Relationship | undefined>;
  listRelationships(): Promise<Relationship[]>;
};

export type PostgresQueryClient = {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<{
    rows: Row[];
    rowCount: number | null;
  }>;
};

export type PersistedUser = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type PostgresGraphRepositoryOptions = {
  client: PostgresQueryClient;
  workspaceId: string;
  now?: () => string;
  createId?: () => string;
};

type EntityRow = QueryResultRow & {
  id: string;
  workspace_id: string;
  type: string;
  title: string;
  description: string;
  metadata: GraphMetadata | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type RelationshipRow = QueryResultRow & {
  id: string;
  workspace_id: string;
  type: string;
  source_entity_id: string;
  target_entity_id: string;
  created_at: Date | string;
  updated_at: Date | string;
};

type UserRow = QueryResultRow & {
  id: string;
  email: string;
  created_at: Date | string;
  updated_at: Date | string;
};

type WorkspaceRow = QueryResultRow & {
  id: string;
  owner_user_id: string | null;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export function createPostgresPoolFromEnv(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for Postgres persistence.');
  }

  return new Pool({
    connectionString,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    max: 1,
  });
}

export async function ensureWorkspace(
  client: PostgresQueryClient,
  workspaceId: string,
  name = 'Alpha workspace',
): Promise<void> {
  const timestamp = new Date().toISOString();

  await client.query(
    `insert into workspaces (id, owner_user_id, name, created_at, updated_at)
    values ($1, null, $2, $3, $3)
    on conflict (id) do nothing`,
    [workspaceId, name, timestamp],
  );
}

export async function ensureUserDefaultWorkspace(
  client: PostgresQueryClient,
  {
    email,
    createId = randomUUID,
  }: {
    email: string;
    createId?: () => string;
  },
): Promise<{
  user: PersistedUser;
  workspaceId: string;
}> {
  const normalisedEmail = normaliseEmail(email);

  if (!normalisedEmail) {
    throw new Error('Authenticated user email is required.');
  }

  const timestamp = new Date().toISOString();
  const userResult = await client.query<UserRow>(
    `insert into users (id, email, created_at, updated_at)
    values ($1, $2, $3, $3)
    on conflict (email) do update
      set updated_at = users.updated_at
    returning *`,
    [createId(), normalisedEmail, timestamp],
  );
  const user = mapUserRow(userResult.rows[0]);
  const existingWorkspaceResult = await client.query<WorkspaceRow>(
    `select *
    from workspaces
    where owner_user_id = $1
    order by created_at asc, id asc
    limit 1`,
    [user.id],
  );
  const existingWorkspace = existingWorkspaceResult.rows[0];

  if (existingWorkspace) {
    return {
      user,
      workspaceId: existingWorkspace.id,
    };
  }

  const workspaceResult = await client.query<WorkspaceRow>(
    `insert into workspaces (id, owner_user_id, name, created_at, updated_at)
    values ($1, $2, $3, $4, $4)
    returning *`,
    [
      createId(),
      user.id,
      `${user.email} default workspace`,
      timestamp,
    ],
  );

  return {
    user,
    workspaceId: workspaceResult.rows[0].id,
  };
}

export function createPostgresGraphRepository({
  client,
  workspaceId,
  now = () => new Date().toISOString(),
  createId = randomUUID,
}: PostgresGraphRepositoryOptions): PersistentGraphRepository {
  return {
    async createEntity(input) {
      if (!isValidEntityType(input.type)) {
        throw new Error(`Invalid entity type: ${input.type}`);
      }

      const timestamp = now();
      const result = await client.query<EntityRow>(
        `insert into entities (
          id,
          workspace_id,
          type,
          title,
          description,
          metadata,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $7)
        returning *`,
        [
          createId(),
          workspaceId,
          input.type,
          input.title,
          input.description,
          input.metadata ?? null,
          timestamp,
        ],
      );

      return mapEntityRow(result.rows[0]);
    },

    async updateEntity(id, input) {
      const existingEntity = await this.getEntity(id);

      if (!existingEntity) {
        return undefined;
      }

      const result = await client.query<EntityRow>(
        `update entities
        set title = $3,
            description = $4,
            metadata = $5,
            updated_at = $6
        where id = $1 and workspace_id = $2
        returning *`,
        [
          id,
          workspaceId,
          input.title ?? existingEntity.title,
          input.description ?? existingEntity.description,
          input.metadata ?? existingEntity.metadata ?? null,
          now(),
        ],
      );

      return result.rows[0] ? mapEntityRow(result.rows[0]) : undefined;
    },

    async deleteEntity(id) {
      const relationships = await client.query(
        `select id
        from relationships
        where workspace_id = $1
          and (source_entity_id = $2 or target_entity_id = $2)
        limit 1`,
        [workspaceId, id],
      );

      if ((relationships.rowCount ?? 0) > 0) {
        throw new Error(`Cannot delete entity with existing relationships: ${id}`);
      }

      const result = await client.query(
        `delete from entities
        where id = $1 and workspace_id = $2`,
        [id, workspaceId],
      );

      return (result.rowCount ?? 0) > 0;
    },

    async getEntity(id) {
      const result = await client.query<EntityRow>(
        `select *
        from entities
        where id = $1 and workspace_id = $2`,
        [id, workspaceId],
      );

      return result.rows[0] ? mapEntityRow(result.rows[0]) : undefined;
    },

    async listEntities() {
      const result = await client.query<EntityRow>(
        `select *
        from entities
        where workspace_id = $1
        order by created_at asc, id asc`,
        [workspaceId],
      );

      return result.rows.map(mapEntityRow);
    },

    async createRelationship(input) {
      if (!isValidRelationshipType(input.type)) {
        throw new Error(`Invalid relationship type: ${input.type}`);
      }

      const timestamp = now();
      const result = await client.query<RelationshipRow>(
        `insert into relationships (
          id,
          workspace_id,
          type,
          source_entity_id,
          target_entity_id,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $6)
        returning *`,
        [
          createId(),
          workspaceId,
          input.type,
          input.sourceEntityId,
          input.targetEntityId,
          timestamp,
        ],
      );

      return mapRelationshipRow(result.rows[0]);
    },

    async updateRelationship(id, input) {
      const existingRelationship = await this.getRelationship(id);

      if (!existingRelationship) {
        return undefined;
      }

      if (input.type && !isValidRelationshipType(input.type)) {
        throw new Error(`Invalid relationship type: ${input.type}`);
      }

      const result = await client.query<RelationshipRow>(
        `update relationships
        set type = $3,
            source_entity_id = $4,
            target_entity_id = $5,
            updated_at = $6
        where id = $1 and workspace_id = $2
        returning *`,
        [
          id,
          workspaceId,
          input.type ?? existingRelationship.type,
          input.sourceEntityId ?? existingRelationship.sourceEntityId,
          input.targetEntityId ?? existingRelationship.targetEntityId,
          now(),
        ],
      );

      return result.rows[0] ? mapRelationshipRow(result.rows[0]) : undefined;
    },

    async deleteRelationship(id) {
      const result = await client.query(
        `delete from relationships
        where id = $1 and workspace_id = $2`,
        [id, workspaceId],
      );

      return (result.rowCount ?? 0) > 0;
    },

    async getRelationship(id) {
      const result = await client.query<RelationshipRow>(
        `select *
        from relationships
        where id = $1 and workspace_id = $2`,
        [id, workspaceId],
      );

      return result.rows[0] ? mapRelationshipRow(result.rows[0]) : undefined;
    },

    async listRelationships() {
      const result = await client.query<RelationshipRow>(
        `select *
        from relationships
        where workspace_id = $1
        order by created_at asc, id asc`,
        [workspaceId],
      );

      return result.rows.map(mapRelationshipRow);
    },
  };
}

function mapEntityRow(row: EntityRow): Entity {
  if (!isValidEntityType(row.type)) {
    throw new Error(`Invalid entity type from database: ${row.type}`);
  }

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    type: row.type,
    title: row.title,
    description: row.description,
    metadata: row.metadata ?? undefined,
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at),
  };
}

function mapRelationshipRow(row: RelationshipRow): Relationship {
  if (!isValidRelationshipType(row.type)) {
    throw new Error(`Invalid relationship type from database: ${row.type}`);
  }

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    type: row.type,
    sourceEntityId: row.source_entity_id,
    targetEntityId: row.target_entity_id,
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at),
  };
}

function mapUserRow(row: UserRow): PersistedUser {
  return {
    id: row.id,
    email: row.email,
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at),
  };
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function formatTimestamp(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}
