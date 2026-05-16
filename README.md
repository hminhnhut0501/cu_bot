# Cu Bot

Telegram group-management bot with Supabase-driven settings and a Vercel admin control panel.

## Main Features

- Auto-loads modules from `modules/`.
- Reads settings from Supabase with cache refresh.
- Deletes Telegram system/service messages in groups where the bot is admin.
- Sends a scheduled daily message from Supabase content.
- Copies a random video anonymously from a configured source message list.
- Moderates spam, forbidden keywords, forwarded posts, inline-button posts, bot messages, and unknown bots.
- Supports warnings and bans through admin commands.

## Required Environment Variables

```bash
BOT_TOKEN=123456:telegram-token
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Supabase Backend

Create the database tables and essential seed data with:

```text
docs/supabase/import_essential.sql
```

Then configure the bot runtime:

```bash
BOT_TOKEN=123456:telegram-token
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATA_REFRESH_SECONDS=120
```

`SUPABASE_SERVICE_ROLE_KEY` has full database access. Keep it server-side only and rotate it if it was shared publicly.

## Vercel Control Panel

This repository also contains a Next.js control panel for Supabase tables. Import this Git repository into Vercel and add these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CP_ADMIN_PASSWORD=choose-a-strong-password
```

Vercel build settings can stay on the defaults:

```text
Framework Preset: Next.js
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

Open the deployed Vercel URL, enter `CP_ADMIN_PASSWORD`, and manage:

```text
groups
config
messages
keywords
admins
bot_allowlist
video_messages
```

The control panel supports quick paste for `messages`, `keywords`, and `video_messages`:

```text
messages: one message per line, or message | pool | weight
keywords: keyword | delete/warn/ban | reason
video_messages: from_chat_id | message_id | caption
```

Optional bot owner env:

```bash
OWNER_IDS=123456789,987654321
```

Users in `OWNER_IDS` can run admin commands such as `/reload` and `/checkbio` even when testing in private chat.

Polling resilience envs for Render:

```bash
POLLING_STARTUP_DELAY_SECONDS=5
POLLING_RETRY_SECONDS=45
```

These prevent a temporary Telegram `409 Conflict` during Render redeploy overlap from crashing the service.

## Supabase Tables

### `groups`

| group_id | enabled | daily_enabled | daily_window_start | daily_window_end | send_if_silent | message_pool | video_enabled | video_window_start | video_window_end | video_pool | spam_max_messages | spam_window_seconds |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| -1001234567890 | true | true | 20:00 | 23:59 | false | default | true | 21:00 | 23:00 | default | 6 | 12 |

If the `groups` table is empty or missing, moderation runs in every group. Scheduled posts need `groups`.

Moderation features such as system-message cleanup, spam filtering, keyword filtering, bot cleanup, forwarded-post cleanup, and bio scanning run in every group by default when the bot is admin. Use `groups.moderation_enabled=false` only if you want to disable moderation for a specific group. Scheduled messages and scheduled videos still require group IDs in `groups`.

### `config`

| key | value | enabled |
|---|---|---|
| policy_text | Nội quy nhóm... | true |
| delete_system_messages | true | true |
| delete_forwarded_messages | true | true |
| delete_inline_keyboard_messages | true | true |
| delete_messages_from_bots | true | true |
| remove_unknown_bots | true | true |
| scan_bio_links | true | true |
| bio_link_delete_message | true | true |
| bio_scan_cache_seconds | 3600 | true |
| bio_link_restrict_seconds | 0 | true |
| bio_link_warning_text | {mention} vui long go link Telegram trong bio roi lien he admin de mo chat lai. | true |
| exempt_admins | true | true |
| spam_max_messages | 6 | true |
| spam_window_seconds | 12 | true |
| spam_action | warn | true |
| forward_warning_reason | Không được forward video/bài vào nhóm. | true |
| forward_warning_text | {mention} vui lòng không forward video/bài vào nhóm. ({count}/{limit}) | true |
| forward_warning_delete_seconds | 180 | true |
| warning_notice_delete_seconds | 180 | true |
| media_spam_max_messages | 3 | true |
| media_spam_window_seconds | 10 | true |
| media_spam_action | restrict | true |
| spam_restrict_seconds | 300 | true |
| bio_link_notice_delete_seconds | 30 | true |
| spam_notice_delete_seconds | 20 | true |
| violation_delete_retry_seconds | 2 | true |
| ban_after_warnings | 3 | true |
| daily_window_start | 20:00 | true |
| daily_window_end | 23:59 | true |
| send_on_boot | false | true |

Group rows override config keys when the same column exists in `groups`.

### `messages`

| message | pool | weight | enabled |
|---|---|---|---|
| Chao ca nha | default | 1 | true |

### `keywords`

| keyword | match | action | delete | reason | enabled |
|---|---|---|---|---|---|
| casino | contains | warn | true | Tu khoa cam | true |
| `telegram\.me/` | regex | ban | true | Link spam | true |

Actions: `delete`, `warn`, `ban`. Keyword violations are deleted before the action is applied.

### `admins`

| user_id | chat_id | enabled |
|---|---|---|
| 123456789 | -1001234567890 | true |

Telegram admins are also detected automatically.

### `bot_allowlist`

| bot_id | username | chat_id | enabled |
|---|---|---|---|
| 123456789 | helpful_bot | -1001234567890 | true |

Bots not in this list can be removed when they join and their messages can be deleted.

### `video_messages`

| from_chat_id | message_id | caption | pool | weight | enabled |
|---|---|---|---|---|---|
| -1009876543210 | 456 | | default | 1 | true |

The bot uses `copy_message`, so the destination group does not see the original sender. The bot must be able to access the source chat/message.

## Admin Commands

- `/policy`, `/rules`, `/quydinh`: show policy text.
- `/warn <user_id>` or reply `/warn`: warn a user.
- `/ban <user_id>` or reply `/ban`: ban a user.
- `/unban <user_id>`: unban and reset warnings.
- `/reload`: clear Supabase cache and reload on next read.
- `/checkbio <user_id>` or reply `/checkbio`: rescan a member bio. If the bio is clean, chat permissions are restored.
- `/debuggroup`: show bot permissions and moderation settings for the current group.

For spam filtering, the bot must receive normal group messages. In BotFather, use `/setprivacy` and disable privacy mode for this bot, then restart/redeploy the bot.

## Run Locally

```bash
pip install -r requirements.txt
python bot.py
```

The keep-alive HTTP endpoint listens on `PORT` or `KEEP_ALIVE_PORT`, default `8080`.
