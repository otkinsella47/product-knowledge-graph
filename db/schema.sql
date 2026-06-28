create table if not exists workspaces (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists entities (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete restrict,
  type text not null check (
    type in (
      'research',
      'insight',
      'goal',
      'opportunity',
      'solution',
      'experiment',
      'decision',
      'outcome'
    )
  ),
  title text not null,
  description text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create table if not exists relationships (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete restrict,
  type text not null check (
    type in (
      'produces',
      'reveals',
      'informs',
      'frames',
      'supports',
      'motivates',
      'validated_by',
      'influences'
    )
  ),
  source_entity_id text not null,
  target_entity_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (source_entity_id, workspace_id)
    references entities(id, workspace_id)
    on delete restrict,
  foreign key (target_entity_id, workspace_id)
    references entities(id, workspace_id)
    on delete restrict
);

create index if not exists entities_workspace_id_idx
  on entities(workspace_id);

create index if not exists relationships_workspace_id_idx
  on relationships(workspace_id);

create index if not exists relationships_source_entity_id_idx
  on relationships(source_entity_id);

create index if not exists relationships_target_entity_id_idx
  on relationships(target_entity_id);
