create table if not exists accounts (
  user_id text primary key,
  owner_name text not null default '',
  business_name text not null default '',
  industry text not null default 'trades',
  email text,
  about text not null default '',
  services text not null default '[]',
  suburbs text not null default '[]',
  hours text not null default '',
  after_hours text not null default '',
  tools text not null default '[]',
  website text not null default '',
  onboarding_complete boolean not null default false,
  totp_secret text,
  totp_enabled boolean not null default false,
  is_hq boolean not null default false,
  created_at timestamptz not null default now()
);
