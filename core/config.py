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


@dataclass(frozen=True)
class Settings:
    bot_token: str
    owner_ids: set[int] = field(default_factory=set)
    parse_mode: str | None = None
    polling_retry_seconds: int = 45
    polling_startup_delay_seconds: int = 5
    keep_alive_enabled: bool = True
    keep_alive_port: int = 8080
    data_refresh_seconds: int = 120
    module_package: str = "modules"
    enabled_modules: set[str] = field(default_factory=set)
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    timezone: str = "Asia/Ho_Chi_Minh"


def load_settings():
    bot_token = os.environ.get("BOT_TOKEN")
    if not bot_token:
        raise RuntimeError("Missing BOT_TOKEN environment variable.")

    enabled_modules = set(_csv_env("ENABLED_MODULES"))
    owner_ids = {int(item) for item in _csv_env("OWNER_IDS")}

    return Settings(
        bot_token=bot_token,
        owner_ids=owner_ids,
        parse_mode=os.environ.get("PARSE_MODE") or "HTML",
        polling_retry_seconds=_int_env("POLLING_RETRY_SECONDS", 45),
        polling_startup_delay_seconds=_int_env("POLLING_STARTUP_DELAY_SECONDS", 5),
        keep_alive_enabled=_bool_env("KEEP_ALIVE_ENABLED", True),
        keep_alive_port=_int_env("PORT", _int_env("KEEP_ALIVE_PORT", 8080)),
        data_refresh_seconds=_int_env("DATA_REFRESH_SECONDS", 120),
        enabled_modules=enabled_modules,
        supabase_url=os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or None,
        supabase_service_role_key=os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or None,
        timezone=os.environ.get("TZ", "Asia/Ho_Chi_Minh"),
    )
