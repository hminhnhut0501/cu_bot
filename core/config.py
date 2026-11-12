import os
from dataclasses import dataclass, field

import requests


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


def _bot_token_from_supabase(bot_key):
    supabase_url = (os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not supabase_url or not service_role_key:
        return None

    response = requests.get(
        f"{supabase_url}/rest/v1/bots",
        headers={
            "apikey": service_role_key,
            "authorization": f"Bearer {service_role_key}",
            "accept": "application/json",
        },
        params={
            "select": "bot_token",
            "bot_key": f"eq.{bot_key}",
            "enabled": "eq.true",
            "limit": "1",
        },
        timeout=15,
    )
    response.raise_for_status()
    rows = response.json()
    if not rows:
        return None
    return rows[0].get("bot_token") or None


@dataclass(frozen=True)
class Settings:
    bot_token: str
    bot_key: str = "main"
    owner_ids: set[int] = field(default_factory=set)
    parse_mode: str | None = None
    polling_retry_seconds: int = 10
    polling_startup_delay_seconds: int = 2
    skip_pending_on_boot: bool = False
    bot_num_threads: int = 8
    keep_alive_enabled: bool = True
    keep_alive_port: int = 8080
    data_refresh_seconds: int = 120
    module_package: str = "modules"
    enabled_modules: set[str] = field(default_factory=set)
    allowed_chat_ids: set[str] = field(default_factory=set)
    auto_register_discovered_groups: bool = False
    auto_leave_unauthorized_groups: bool = False
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    timezone: str = "Asia/Ho_Chi_Minh"


def load_settings(require_bot_token=True):
    bot_key = os.environ.get("BOT_KEY", "main")
    bot_token = os.environ.get("BOT_TOKEN")
    if not bot_token and require_bot_token:
        bot_token = _bot_token_from_supabase(bot_key)
    if require_bot_token and not bot_token:
        raise RuntimeError("Missing BOT_TOKEN environment variable or bots.bot_token for BOT_KEY.")

    enabled_modules = set(_csv_env("ENABLED_MODULES"))
    allowed_chat_ids = {item for item in _csv_env("ALLOWED_CHAT_IDS")}
    owner_ids = {int(item) for item in _csv_env("OWNER_IDS")}

    return Settings(
        bot_token=bot_token,
        bot_key=bot_key,
        owner_ids=owner_ids,
        parse_mode=os.environ.get("PARSE_MODE") or "HTML",
        polling_retry_seconds=_int_env("POLLING_RETRY_SECONDS", 10),
        polling_startup_delay_seconds=_int_env("POLLING_STARTUP_DELAY_SECONDS", 2),
        skip_pending_on_boot=_bool_env("SKIP_PENDING_ON_BOOT", False),
        bot_num_threads=max(2, _int_env("BOT_NUM_THREADS", 8)),
        keep_alive_enabled=_bool_env("KEEP_ALIVE_ENABLED", True),
        keep_alive_port=_int_env("PORT", _int_env("KEEP_ALIVE_PORT", 8080)),
        data_refresh_seconds=_int_env("DATA_REFRESH_SECONDS", 120),
        enabled_modules=enabled_modules,
        allowed_chat_ids=allowed_chat_ids,
        auto_register_discovered_groups=_bool_env("AUTO_REGISTER_DISCOVERED_GROUPS", False),
        auto_leave_unauthorized_groups=_bool_env("AUTO_LEAVE_UNAUTHORIZED_GROUPS", False),
        supabase_url=os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or None,
        supabase_service_role_key=os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or None,
        timezone=os.environ.get("TZ", "Asia/Ho_Chi_Minh"),
    )
