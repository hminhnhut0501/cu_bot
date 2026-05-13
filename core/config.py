import json
import os
from dataclasses import dataclass, field


def _int_env(name, default):
    raw_value = os.environ.get(name)
    if raw_value in (None, ""):
        return default
    return int(raw_value)


def _bool_env(name, default=False):
    raw_value = os.environ.get(name)
    if raw_value in (None, ""):
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on", "enabled"}


def _csv_env(name):
    raw_value = os.environ.get(name, "")
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _json_env(name, default):
    raw_value = os.environ.get(name)
    if not raw_value:
        return default
    return json.loads(raw_value)


@dataclass(frozen=True)
class Settings:
    bot_token: str
    parse_mode: str | None = None
    keep_alive_enabled: bool = True
    keep_alive_port: int = 8080
    sheets_refresh_seconds: int = 120
    module_package: str = "modules"
    enabled_modules: set[str] = field(default_factory=set)
    sheet_urls: dict[str, str] = field(default_factory=dict)
    legacy_message_sheet_url: str | None = None
    timezone: str = "Asia/Ho_Chi_Minh"


def load_settings():
    bot_token = os.environ.get("BOT_TOKEN")
    if not bot_token:
        raise RuntimeError("Missing BOT_TOKEN environment variable.")

    sheet_urls = _json_env("SHEET_URLS_JSON", {})
    for key in (
        "CONFIG",
        "GROUPS",
        "MESSAGES",
        "KEYWORDS",
        "ADMINS",
        "BOT_ALLOWLIST",
        "VIDEO_MESSAGES",
    ):
        env_key = f"{key}_CSV_URL"
        if os.environ.get(env_key):
            sheet_urls[key.lower()] = os.environ[env_key]

    legacy_message_sheet_url = os.environ.get("SHEET_CSV_URL")
    if legacy_message_sheet_url and "messages" not in sheet_urls:
        sheet_urls["messages"] = legacy_message_sheet_url

    enabled_modules = set(_csv_env("ENABLED_MODULES"))

    return Settings(
        bot_token=bot_token,
        parse_mode=os.environ.get("PARSE_MODE") or None,
        keep_alive_enabled=_bool_env("KEEP_ALIVE_ENABLED", True),
        keep_alive_port=_int_env("PORT", _int_env("KEEP_ALIVE_PORT", 8080)),
        sheets_refresh_seconds=_int_env("SHEETS_REFRESH_SECONDS", 120),
        enabled_modules=enabled_modules,
        sheet_urls=sheet_urls,
        legacy_message_sheet_url=legacy_message_sheet_url,
        timezone=os.environ.get("TZ", "Asia/Ho_Chi_Minh"),
    )
