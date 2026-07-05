-- Add moderation fields that the Admin CP now writes to groups.
-- Run this in Supabase SQL editor on the live project.

alter table groups
  add column if not exists moderation_enabled boolean default true,
  add column if not exists spam_restrict_seconds integer default 300,
  add column if not exists duplicate_message_enabled boolean default true,
  add column if not exists duplicate_message_max_count integer default 3,
  add column if not exists duplicate_message_window_seconds integer default 600,
  add column if not exists duplicate_message_action text default 'warn',
  add column if not exists duplicate_message_reason text,
  add column if not exists forward_warning_reason text,
  add column if not exists forward_warning_text text,
  add column if not exists spam_restrict_text text,
  add column if not exists warning_notice_delete_seconds integer default 180,
  add column if not exists forward_warning_delete_seconds integer default 180,
  add column if not exists spam_notice_delete_seconds integer default 30,
  add column if not exists welcome_enabled boolean default false,
  add column if not exists welcome_text text,
  add column if not exists welcome_buttons_text text,
  add column if not exists welcome_delete_seconds integer default 30,
  add column if not exists scan_bio_links boolean default true,
  add column if not exists bio_link_delete_message boolean default true,
  add column if not exists bio_link_restrict_seconds integer default 0,
  add column if not exists bio_scan_cache_seconds integer default 3600,
  add column if not exists bio_link_warning_text text,
  add column if not exists bio_link_notice_delete_seconds integer default 30;
