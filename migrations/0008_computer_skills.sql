create table if not exists computer_skill (
  id text primary key,
  user_id text not null,
  name text not null,
  goal text not null default '',
  status text not null default 'draft',
  steps text not null default '[]',
  approvals text not null default '{"send":true,"pay":false,"delete":false}',
  schedule text not null default 'manual',
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists computer_skill_user on computer_skill (user_id, created_at desc);
