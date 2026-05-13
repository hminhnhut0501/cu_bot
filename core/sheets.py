import csv
import logging
import time
from io import StringIO

import requests

from core.utils import as_bool


LOGGER = logging.getLogger(__name__)


class SheetStore:
    def __init__(self, urls, refresh_seconds=120):
        self.urls = urls
        self.refresh_seconds = refresh_seconds
        self._cache = {}

    def rows(self, name):
        name = name.lower()
        url = self.urls.get(name)
        if not url:
            return []

        cached = self._cache.get(name)
        if cached and time.time() - cached["loaded_at"] < self.refresh_seconds:
            return cached["rows"]

        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            rows = self._parse_csv(response.text)
            self._cache[name] = {"loaded_at": time.time(), "rows": rows}
            return rows
        except Exception as exc:
            LOGGER.warning("Cannot load sheet %s: %s", name, exc)
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

    def _parse_csv(self, raw_text):
        sample = raw_text.lstrip("\ufeff")
        reader = csv.DictReader(StringIO(sample))
        known_headers = {
            "key",
            "name",
            "value",
            "enabled",
            "group_id",
            "chat_id",
            "message",
            "text",
            "keyword",
            "word",
            "user_id",
            "bot_id",
            "username",
            "from_chat_id",
            "message_id",
        }
        fieldnames = {field.strip().lower() for field in (reader.fieldnames or []) if field}
        if fieldnames & known_headers:
            return [{(key or "").strip().lower(): (value or "").strip() for key, value in row.items()} for row in reader]

        simple_reader = csv.reader(StringIO(sample))
        return [{"message": row[0].strip()} for row in simple_reader if row]
