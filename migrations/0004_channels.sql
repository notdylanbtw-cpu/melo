create table if not exists channel_accounts (
  id text primary key,
  user_id text not null,
  kind text not null,
  status text not null default 'available',
  external_id text not null default '',
  credentials text not null default '{}',
  webhook_secret text not null default '',
  detail text not null default '',
  connected_at timestamptz,
  unique (user_id, kind)
);

create table if not exists live_calls (
  id text primary key,
  user_id text not null,
  from_number text not null default '',
  to_number text not null default '',
  phase text not null default 'queued',
  reason text not null default '',
  suburb text not null default '',
  started_at timestamptz not null default now(),
  transcript text not null default '[]',
  summary text
);

create table if not exists channel_inbox (
  id text primary key,
  user_id text not null,
  channel text not null,
  from_name text not null default '',
  from_address text not null default '',
  subject text not null default '',
  body text not null default '',
  at timestamptz not null default now(),
  pulled boolean not null default false
);

alter table accounts add column if not exists widget_slug text not null default '';
alter table accounts add column if not exists owner_phone text not null default '';
