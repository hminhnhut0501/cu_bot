import logging
import os
import threading
import time
import warnings
from dataclasses import replace
from types import MethodType

import requests
import telebot

from core.app import BotApplication
from core.config import load_settings


LOGGER = logging.getLogger(__name__)


class _DeprecatedTeleBotWarningFilter(logging.Filter):
    def filter(self, record):
        message = record.getMessage()
        return "can_send_media_messages" not in message


class _ExpectedRuntimeNoiseFilter(logging.Filter):
    SUPPRESSED_PATTERNS = (
        "Join router received incomplete chat_member update",
        "Join router cannot query blacklist state",
        "Join router cannot load blacklist fallback",
        "No message candidate for bot",
        "No video candidate for bot",
        "Welcome cannot send messages for bot",
        "Cannot inspect bot permissions in",
        "Cannot notify bio violation in",
        "Cannot send spam restrict notice in",
        "Invalid channel button JSON for bot",
        "Raw update logger unavailable for bot_key=",
        "Raw update logger failed for bot_key=",
    )

    def filter(self, record):
        if record.levelno < logging.WARNING:
            return True
        message = record.getMessage()
        return not any(pattern in message for pattern in self.SUPPRESSED_PATTERNS)


class _WarningRateLimitFilter(logging.Filter):
    def __init__(self, minutes=10):
        super().__init__()
        self.min_interval_seconds = max(60, int(minutes) * 60)
        self._last_seen = {}
        self._lock = threading.Lock()

    def filter(self, record):
        if record.levelno < logging.WARNING:
            return True
        if record.name.startswith("TeleBot") or record.name.startswith("telebot"):
            return True

        message = record.getMessage()
        key = (record.name, record.levelno, message)
        now = time.time()
        with self._lock:
            last_seen = self._last_seen.get(key, 0.0)
            if now - last_seen < self.min_interval_seconds:
                return False
            self._last_seen[key] = now
        return True


def bool_env(name, default=False):
    raw_value = os.environ.get(name)
    if raw_value in (None, ""):
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on", "enabled"}


def load_active_bot_rows(settings):
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("MULTI_BOT_ENABLED needs Supabase URL and service role key.")

    response = requests.get(
        f"{settings.supabase_url.rstrip('/')}/rest/v1/bots",
        headers={
            "apikey": settings.supabase_service_role_key,
            "authorization": f"Bearer {settings.supabase_service_role_key}",
            "accept": "application/json",
        },
        params={
            "select": "bot_key,name,username,bot_token,status,enabled",
            "enabled": "eq.true",
            "status": "eq.active",
            "order": "id.asc",
        },
        timeout=15,
    )
    response.raise_for_status()
    rows = response.json()
    return [row for row in rows if row.get("bot_key") and row.get("bot_token")]


def attach_raw_update_logger(bot, bot_key):
    original = getattr(bot, "process_new_updates", None)
    if not callable(original):
        LOGGER.debug("Raw update logger unavailable for bot_key=%s: process_new_updates missing.", bot_key)
        return

    if getattr(bot, "_raw_update_logger_attached", False):
        return

    def wrapped(self, updates):
        try:
            for update in updates or []:
                message = getattr(update, "message", None)
                edited_message = getattr(update, "edited_message", None)
                channel_post = getattr(update, "channel_post", None)
                chat_member = getattr(update, "chat_member", None)
                my_chat_member = getattr(update, "my_chat_member", None)
                chat_join_request = getattr(update, "chat_join_request", None)
                callback_query = getattr(update, "callback_query", None)
                summary = {
                    "update_id": getattr(update, "update_id", None),
                    "message_type": getattr(message, "content_type", None) if message else None,
                    "edited_message_type": getattr(edited_message, "content_type", None) if edited_message else None,
                    "channel_post_type": getattr(channel_post, "content_type", None) if channel_post else None,
                    "has_chat_member": bool(chat_member),
                    "has_my_chat_member": bool(my_chat_member),
                    "has_chat_join_request": bool(chat_join_request),
                    "has_callback_query": bool(callback_query),
                }
                if message:
                    summary["chat_id"] = getattr(getattr(message, "chat", None), "id", None)
                    summary["new_chat_members"] = len(getattr(message, "new_chat_members", None) or [])
                    summary["has_left_chat_member"] = bool(getattr(message, "left_chat_member", None))
                if chat_member:
                    summary["chat_member_chat_id"] = getattr(getattr(chat_member, "chat", None), "id", None)
                    summary["chat_member_old_status"] = getattr(getattr(chat_member, "old_chat_member", None), "status", None)
                    summary["chat_member_new_status"] = getattr(getattr(chat_member, "new_chat_member", None), "status", None)
                    summary["chat_member_old_is_member"] = getattr(getattr(chat_member, "old_chat_member", None), "is_member", None)
                    summary["chat_member_new_is_member"] = getattr(getattr(chat_member, "new_chat_member", None), "is_member", None)
                    summary["chat_member_user_id"] = getattr(
                        getattr(getattr(chat_member, "new_chat_member", None), "user", None),
                        "id",
                        None,
                    )
                if my_chat_member:
                    summary["my_chat_member_chat_id"] = getattr(getattr(my_chat_member, "chat", None), "id", None)
                    summary["my_chat_member_old_status"] = getattr(getattr(my_chat_member, "old_chat_member", None), "status", None)
                    summary["my_chat_member_new_status"] = getattr(getattr(my_chat_member, "new_chat_member", None), "status", None)
                if chat_join_request:
                    summary["chat_join_request_chat_id"] = getattr(getattr(chat_join_request, "chat", None), "id", None)
                    summary["chat_join_request_user_id"] = getattr(getattr(chat_join_request, "from_user", None), "id", None)
                    summary["chat_join_request_bio"] = bool(getattr(chat_join_request, "bio", None))
                LOGGER.debug("Raw update bot_key=%s: %s", bot_key, summary)
        except Exception as exc:
            LOGGER.info("Raw update logger failed for bot_key=%s: %s", bot_key, exc)
        return original(updates)

    bot.process_new_updates = MethodType(wrapped, bot)
    bot._raw_update_logger_attached = True
    LOGGER.info("Attached raw update logger for bot_key=%s.", bot_key)


def start_bot(settings, keep_alive_enabled=None):
    runtime_settings = settings
    if keep_alive_enabled is not None:
        runtime_settings = replace(settings, keep_alive_enabled=keep_alive_enabled)
    bot = telebot.TeleBot(runtime_settings.bot_token, parse_mode=runtime_settings.parse_mode)
    attach_raw_update_logger(bot, runtime_settings.bot_key)
    app = BotApplication(bot, runtime_settings)
    app.start()


def start_multi_bot_mode():
    base_settings = load_settings(require_bot_token=False)
    rows = load_active_bot_rows(base_settings)
    if not rows:
        raise RuntimeError("MULTI_BOT_ENABLED is true but no active bot with bot_token was found in Supabase.")

    token_seen = {}
    unique_rows = []
    for row in rows:
        token = str(row.get("bot_token") or "").strip()
        if not token:
            continue
        if token in token_seen:
            logging.warning(
                "Skip bot_key=%s because token is duplicated with bot_key=%s. "
                "Duplicate token causes Telegram 409 polling conflict.",
                row.get("bot_key"),
                token_seen[token],
            )
            continue
        token_seen[token] = row.get("bot_key")
        unique_rows.append(row)
    rows = unique_rows

    for index, row in enumerate(rows):
        settings = replace(
            base_settings,
            bot_key=row["bot_key"],
            bot_token=row["bot_token"],
            keep_alive_enabled=index == 0 and base_settings.keep_alive_enabled,
        )
        thread = threading.Thread(
            name=f"bot:{settings.bot_key}",
            target=start_bot,
            args=(settings,),
            daemon=True,
        )
        thread.start()
        logging.info("Started bot %s (%s).", row.get("name") or settings.bot_key, settings.bot_key)

    while True:
        time.sleep(3600)


def main():
    warnings.filterwarnings(
        "ignore",
        message=r'.*can_send_media_messages.*',
        category=Warning,
    )
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    logging.getLogger().addFilter(_ExpectedRuntimeNoiseFilter())
    logging.getLogger().addFilter(_WarningRateLimitFilter(minutes=int(os.environ.get("LOG_WARNING_RATE_LIMIT_MINUTES", "10") or 10)))
    for logger_name in ("TeleBot", "telebot"):
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.WARNING)
        logger.addFilter(_DeprecatedTeleBotWarningFilter())

    if bool_env("MULTI_BOT_ENABLED", False):
        start_multi_bot_mode()
        return

    settings = load_settings()
    start_bot(settings)


if __name__ == "__main__":
    main()
