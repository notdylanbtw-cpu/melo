create table if not exists computer (
  user_id text primary key,
  status text not null default 'online',
  region text not null default 'ap-sydney-1',
  mode text not null default 'always',
  act_after_hours boolean not null default true,
  last_tick_at timestamptz,
  started_at timestamptz not null default now(),
  jobs_done integer not null default 0,
  current_task text not null default 'Watching the desk'
);

create table if not exists computer_log (
  id text primary key,
  user_id text not null,
  at timestamptz not null default now(),
  kind text not null,
  agent text not null default 'helix',
  text text not null,
  detail text not null default ''
);
create index if not exists computer_log_user_at on computer_log (user_id, at desc);

create table if not exists computer_queue (
  id text primary key,
  user_id text not null,
  run_at timestamptz not null,
  kind text not null,
  payload text not null default '{}',
  status text not null default 'queued',
  result text not null default ''
);
create index if not exists computer_queue_due on computer_queue (user_id, run_at);
