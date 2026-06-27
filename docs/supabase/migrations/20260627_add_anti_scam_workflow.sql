-- Anti-scam workflow expansion
-- Additive migration: safe to run on an existing database.

create table if not exists scam_report_attachments (
  id bigserial primary key,
  bot_key text not null default 'main',
  report_id bigint not null references scam_reports(id) on delete cascade,
  telegram_file_id text,
  telegram_file_unique_id text,
  media_type text not null default 'photo',
  file_name text,
  mime_type text,
  file_size integer,
  caption text,
  source_chat_id text,
  source_message_id text,
  payload jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists scam_aliases (
  id bigserial primary key,
  bot_key text not null default 'main',
  entity_id bigint not null references scam_entities(id) on delete cascade,
  alias_type text not null,
  alias_value text not null,
  normalized_value text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists scam_broadcasts (
  id bigserial primary key,
  bot_key text not null default 'main',
  entity_id bigint references scam_entities(id) on delete cascade,
  report_id bigint references scam_reports(id) on delete set null,
  target_chat_id text not null,
  target_message_id text,
  broadcast_type text not null default 'new_entity',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists scam_review_rules (
  id bigserial primary key,
  bot_key text not null default 'main',
  rule_key text not null,
  rule_value text,
  enabled boolean not null default true,
  notes text
);

alter table scam_reports
  add column if not exists reporter_chat_id text,
  add column if not exists source_chat_id text,
  add column if not exists source_message_id text,
  add column if not exists target_name text,
  add column if not exists group_name text,
  add column if not exists group_id text,
  add column if not exists scammer_name text,
  add column if not exists admin_name text,
  add column if not exists notes text,
  add column if not exists evidence_text text,
  add column if not exists evidence_payload jsonb not null default '{}'::jsonb,
  add column if not exists attachment_count integer not null default 0,
  add column if not exists confidence_score numeric(5,2) not null default 0,
  add column if not exists scam_percent numeric(5,2) not null default 0,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists duplicate_of bigint;

alter table scam_reports
  add constraint scam_reports_duplicate_of_fkey
  foreign key (duplicate_of) references scam_reports(id) on delete set null;

alter table scam_entities
  add column if not exists group_name text,
  add column if not exists group_id text,
  add column if not exists scammer_name text,
  add column if not exists admin_name text,
  add column if not exists normalized_uid text,
  add column if not exists normalized_username text,
  add column if not exists normalized_bank_account text,
  add column if not exists normalized_phone text,
  add column if not exists normalized_name text,
  add column if not exists scam_percent numeric(5,2) not null default 100,
  add column if not exists confidence_score numeric(5,2) not null default 100,
  add column if not exists notes text,
  add column if not exists evidence_payload jsonb not null default '{}'::jsonb,
  add column if not exists last_report_id bigint,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz not null default now();

alter table scam_entities
  add constraint scam_entities_last_report_id_fkey
  foreign key (last_report_id) references scam_reports(id) on delete set null;

create index if not exists idx_scam_reports_bot_status_created_at
  on scam_reports (bot_key, status, created_at desc);

create index if not exists idx_scam_reports_target_uid
  on scam_reports (bot_key, target_uid);

create index if not exists idx_scam_reports_target_username
  on scam_reports (bot_key, target_username);

create index if not exists idx_scam_reports_bank_account
  on scam_reports (bot_key, bank_account);

create index if not exists idx_scam_entities_bot_status_enabled
  on scam_entities (bot_key, status, enabled);

create index if not exists idx_scam_entities_uid
  on scam_entities (bot_key, uid);

create index if not exists idx_scam_entities_username
  on scam_entities (bot_key, username);

create index if not exists idx_scam_entities_bank_account
  on scam_entities (bot_key, bank_account);

create index if not exists idx_scam_entities_phone
  on scam_entities (bot_key, phone);

create index if not exists idx_scam_entities_name
  on scam_entities (bot_key, name);

create index if not exists idx_scam_aliases_entity_value
  on scam_aliases (bot_key, entity_id, normalized_value);

create index if not exists idx_scam_broadcasts_bot_status
  on scam_broadcasts (bot_key, status, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'scam_reports_status_check'
  ) then
    alter table scam_reports
      add constraint scam_reports_status_check
      check (status in ('pending', 'need_more_info', 'confirmed', 'rejected', 'duplicate'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'scam_entities_status_check'
  ) then
    alter table scam_entities
      add constraint scam_entities_status_check
      check (status in ('pending', 'confirmed', 'rejected', 'archived'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'scam_broadcasts_status_check'
  ) then
    alter table scam_broadcasts
      add constraint scam_broadcasts_status_check
      check (status in ('pending', 'sent', 'failed', 'skipped'));
  end if;
end $$;
