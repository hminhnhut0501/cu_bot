create table if not exists share_unlock_campaigns (
  id bigserial primary key,
  bot_key text not null default 'main',
  source_chat_id text not null,
  title text not null,
  description text,
  required_invites integer not null default 5,
  unlock_target_type text not null default 'invite_link',
  unlock_target_value text not null,
  share_message text,
  unlock_message text,
  status text not null default 'open',
  unlocked_at timestamptz,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists share_unlock_invites (
  id bigserial primary key,
  bot_key text not null default 'main',
  campaign_id bigint not null references share_unlock_campaigns(id) on delete cascade,
  referrer_user_id text not null,
  source_chat_id text not null,
  invite_link text not null,
  invite_name text,
  active boolean not null default true,
  unlocked_at timestamptz,
  reward_sent_at timestamptz,
  reward_message_id text,
  created_at timestamptz not null default now(),
  unique (campaign_id, referrer_user_id)
);

create table if not exists share_unlock_referrals (
  id bigserial primary key,
  bot_key text not null default 'main',
  campaign_id bigint not null references share_unlock_campaigns(id) on delete cascade,
  referrer_user_id text not null,
  invitee_user_id text not null,
  invitee_username text,
  invitee_chat_id text not null,
  invite_link text,
  counted boolean not null default true,
  created_at timestamptz not null default now(),
  unique (campaign_id, invitee_user_id)
);

alter table share_unlock_campaigns enable row level security;
alter table share_unlock_invites enable row level security;
alter table share_unlock_referrals enable row level security;
