create table if not exists channel_posts (
  id bigserial primary key,
  bot_key text not null default 'main',
  target_chat_id text not null,
  title text,
  content text not null,
  buttons_text text,
  parse_mode text not null default 'HTML',
  disable_web_page_preview boolean not null default false,
  status text not null default 'draft',
  sent_message_id text,
  sent_at timestamptz,
  error text,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

alter table channel_posts enable row level security;

insert into module_settings (bot_key, module_key, module_name, category, enabled, settings, notes)
select 'main', 'channel_publisher', 'Đăng channel', 'Vận hành', true, '{}'::jsonb, 'Soạn bài có nút inline rồi gửi lên channel/group'
where not exists (
  select 1
  from module_settings
  where bot_key = 'main'
    and module_key = 'channel_publisher'
);
