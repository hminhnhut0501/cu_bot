import logging
import time

import requests

from core.utils import as_bool


LOGGER = logging.getLogger(__name__)


BOT_SCOPED_TABLES = {
    "admins",
    "audit_logs",
    "auto_replies",
    "bot_allowlist",
    "bot_metrics",
    "captcha_questions",
    "channel_posts",
    "config",
    "domain_blacklist",
    "entertainment_events",
    "giveaway_campaigns",
    "giveaway_entries",
    "groups",
    "keywords",
    "link_shorteners",
    "member_roles",
    "messages",
    "module_settings",
    "reputation_events",
    "reputation_rules",
    "scheduled_posts",
    "scam_entities",
    "scam_reports",
    "verification_settings",
    "video_messages",
}


class SupabaseStore:
    def __init__(self, supabase_url, service_role_key, refresh_seconds=120, bot_key="main"):
        if not supabase_url:
            raise RuntimeError("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable.")
        if not service_role_key:
            raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.")
        self.supabase_url = supabase_url.rstrip("/")
        self.service_role_key = service_role_key
        self.refresh_seconds = refresh_seconds
        self.bot_key = bot_key
        self._cache = {}

    def rows(self, name):
        name = name.lower()
        cached = self._cache.get(name)
        if cached and time.time() - cached["loaded_at"] < self.refresh_seconds:
            return cached["rows"]

        try:
            rows = self._load_rows(name)
            self._cache[name] = {"loaded_at": time.time(), "rows": rows}
            return rows
        except Exception as exc:
            LOGGER.warning("Cannot load Supabase table %s: %s", name, exc)
            return cached["rows"] if cached else []

    def enabled_rows(self, name):
        return [row for row in self.rows(name) if as_bool(row.get("enabled"), True)]

    def bot_active(self):
        for row in self.rows("bots"):
            if (row.get("bot_key") or "").strip() != self.bot_key:
                continue
            status = (row.get("status") or "active").strip().lower()
            return as_bool(row.get("enabled"), True) and status == "active"
        return True

    def value(self, key, default=None):
        key = key.strip().lower()
        for row in self.enabled_rows("config"):
            row_key = (row.get("key") or row.get("name") or "").strip().lower()
            if row_key == key:
                return row.get("value", default)
        return default

    def _load_rows(self, table):
        url = f"{self.supabase_url}/rest/v1/{table}"
        headers = {
            "apikey": self.service_role_key,
            "authorization": f"Bearer {self.service_role_key}",
            "accept": "application/json",
        }
        params = {"select": "*", "order": "id.asc"}
        if table in BOT_SCOPED_TABLES:
            params["or"] = f"(bot_key.is.null,bot_key.eq.{self.bot_key})"
        response = requests.get(url, headers=headers, params=params, timeout=15)
        response.raise_for_status()
        return [self._clean_row(row) for row in response.json()]

    def insert(self, table, payload):
        url = f"{self.supabase_url}/rest/v1/{table}"
        headers = {
            "apikey": self.service_role_key,
            "authorization": f"Bearer {self.service_role_key}",
            "content-type": "application/json",
            "prefer": "return=representation",
        }
        data = dict(payload)
        if table in BOT_SCOPED_TABLES and not data.get("bot_key"):
            data["bot_key"] = self.bot_key
        response = requests.post(url, headers=headers, json=data, timeout=15)
        response.raise_for_status()
        self._cache.pop(table.lower(), None)
        rows = response.json()
        return rows[0] if rows else {}

    def update(self, table, row_id, payload):
        url = f"{self.supabase_url}/rest/v1/{table}"
        headers = {
            "apikey": self.service_role_key,
            "authorization": f"Bearer {self.service_role_key}",
            "content-type": "application/json",
            "prefer": "return=representation",
        }
        params = {"id": f"eq.{row_id}"}
        response = requests.patch(url, headers=headers, params=params, json=payload, timeout=15)
        response.raise_for_status()
        self._cache.pop(table.lower(), None)
        rows = response.json()
        return rows[0] if rows else {}

    def _clean_row(self, row):
        cleaned = {}
        for key, value in row.items():
            if value is None:
                cleaned[key] = ""
            else:
                cleaned[key] = str(value) if key.endswith("_id") or key in {"group_id", "chat_id", "user_id", "bot_id"} else value
        return cleaned
