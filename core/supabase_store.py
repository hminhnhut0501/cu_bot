import logging
import time

import requests

from core.utils import as_bool


LOGGER = logging.getLogger(__name__)


class SupabaseStore:
    def __init__(self, supabase_url, service_role_key, refresh_seconds=120):
        if not supabase_url:
            raise RuntimeError("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable.")
        if not service_role_key:
            raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.")
        self.supabase_url = supabase_url.rstrip("/")
        self.service_role_key = service_role_key
        self.refresh_seconds = refresh_seconds
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
        response = requests.get(url, headers=headers, params=params, timeout=15)
        response.raise_for_status()
        return [self._clean_row(row) for row in response.json()]

    def _clean_row(self, row):
        cleaned = {}
        for key, value in row.items():
            if value is None:
                cleaned[key] = ""
            else:
                cleaned[key] = str(value) if key.endswith("_id") or key in {"group_id", "chat_id", "user_id", "bot_id"} else value
        return cleaned
