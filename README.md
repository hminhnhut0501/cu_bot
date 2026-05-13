# Cu Bot

Telegram group-management bot with modular features and Google Sheet driven settings.

## Main Features

- Auto-loads modules from `modules/`.
- Reads settings from public Google Sheets CSV URLs with cache refresh.
- Deletes Telegram system/service messages in groups where the bot is admin.
- Sends a random scheduled daily message from a sheet list.
- Copies a random video anonymously from a configured source message list.
- Moderates spam, forbidden keywords, forwarded posts, inline-button posts, bot messages, and unknown bots.
- Supports warnings and bans through admin commands.

## Required Environment Variables

```bash
BOT_TOKEN=123456:telegram-token
GROUPS_CSV_URL=https://docs.google.com/spreadsheets/.../pub?gid=...&single=true&output=csv
MESSAGES_CSV_URL=https://docs.google.com/spreadsheets/.../pub?gid=...&single=true&output=csv
```

Optional sheets:

```bash
CONFIG_CSV_URL=...
KEYWORDS_CSV_URL=...
ADMINS_CSV_URL=...
BOT_ALLOWLIST_CSV_URL=...
VIDEO_MESSAGES_CSV_URL=...
```

You can also provide every sheet URL in one JSON variable:

```bash
SHEET_URLS_JSON={"groups":"...","messages":"...","config":"...","keywords":"..."}
```

Legacy compatibility: `SHEET_CSV_URL` is still accepted as the messages sheet.

## Sheet Schemas

### `groups`

| group_id | enabled | daily_enabled | daily_window_start | daily_window_end | send_if_silent | message_pool | video_enabled | video_window_start | video_window_end | video_pool | spam_max_messages | spam_window_seconds |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| -1001234567890 | true | true | 20:00 | 23:59 | false | default | true | 21:00 | 23:00 | default | 6 | 12 |

If the `groups` sheet is empty or missing, moderation runs in every group. Scheduled posts need `groups`.

### `config`

| key | value | enabled |
|---|---|---|
| policy_text | Noi quy nhom... | true |
| delete_system_messages | true | true |
| delete_forwarded_messages | true | true |
| delete_inline_keyboard_messages | true | true |
| delete_messages_from_bots | true | true |
| remove_unknown_bots | true | true |
| scan_bio_links | true | true |
| bio_scan_cache_seconds | 3600 | true |
| bio_link_restrict_seconds | 0 | true |
| bio_link_warning_text | {mention} vui long go link Telegram trong bio roi lien he admin de mo chat lai. | true |
| exempt_admins | true | true |
| spam_max_messages | 6 | true |
| spam_window_seconds | 12 | true |
| spam_action | warn | true |
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

| keyword | match | action | reason | enabled |
|---|---|---|---|---|
| casino | contains | warn | Tu khoa cam | true |
| `telegram\.me/` | regex | ban | Link spam | true |

Actions: `delete`, `warn`, `ban`.

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
- `/reload`: clear sheet cache and reload on next read.
- `/checkbio <user_id>` or reply `/checkbio`: rescan a member bio. If the bio is clean, chat permissions are restored.

## Run Locally

```bash
pip install -r requirements.txt
python bot.py
```

The keep-alive HTTP endpoint listens on `PORT` or `KEEP_ALIVE_PORT`, default `8080`.
