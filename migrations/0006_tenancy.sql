alter table accounts add column if not exists office_json text not null default '';
alter table accounts add column if not exists plan_id text not null default 'growth';
alter table accounts add column if not exists trial_ends_at timestamptz;
alter table accounts add column if not exists billing_status text not null default 'unpaid';
alter table accounts add column if not exists stripe_customer_id text not null default '';
alter table accounts add column if not exists stripe_subscription_id text not null default '';
