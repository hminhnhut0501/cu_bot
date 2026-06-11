import logging
import os
import threading
import time
from dataclasses import replace

import requests
import telebot

from core.app import BotApplication
from core.config import load_settings


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


def start_bot(settings, keep_alive_enabled=None):
    runtime_settings = settings
    if keep_alive_enabled is not None:
        runtime_settings = replace(settings, keep_alive_enabled=keep_alive_enabled)
    bot = telebot.TeleBot(runtime_settings.bot_token, parse_mode=runtime_settings.parse_mode)
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
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    logging.getLogger("TeleBot").setLevel(logging.WARNING)
    logging.getLogger("telebot").setLevel(logging.WARNING)

    if bool_env("MULTI_BOT_ENABLED", False):
        start_multi_bot_mode()
        return

    settings = load_settings()
    start_bot(settings)


if __name__ == "__main__":
    main()
