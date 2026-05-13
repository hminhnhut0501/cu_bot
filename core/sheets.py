import csv
import logging
import time
from io import StringIO
from urllib.parse import quote

import requests

from core.utils import as_bool

try:
    import ftfy
except ImportError:
    ftfy = None


LOGGER = logging.getLogger(__name__)


class SheetStore:
    def __init__(
        self,
        urls,
        refresh_seconds=120,
        google_sheet_id=None,
        google_sheets_api_key=None,
        google_sheet_tabs=None,
        repair_mojibake=False,
    ):
        self.urls = urls
        self.refresh_seconds = refresh_seconds
        self.google_sheet_id = google_sheet_id
        self.google_sheets_api_key = google_sheets_api_key
        self.google_sheet_tabs = google_sheet_tabs or {}
        self.repair_mojibake = repair_mojibake
        self._cache = {}

    def rows(self, name):
        name = name.lower()
        url = self.urls.get(name)
        if not url and not self.can_use_google_sheets_api():
            return []

        cached = self._cache.get(name)
        if cached and time.time() - cached["loaded_at"] < self.refresh_seconds:
            return cached["rows"]

        try:
            rows = self._load_google_sheet_rows(name) if self.can_use_google_sheets_api() else self._load_csv_rows(url)
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

    def can_use_google_sheets_api(self):
        return bool(self.google_sheet_id and self.google_sheets_api_key)

    def _load_csv_rows(self, url):
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        return self._parse_csv(response.content.decode("utf-8-sig"))

    def _load_google_sheet_rows(self, name):
        tab_name = self.google_sheet_tabs.get(name, name)
        range_name = quote(f"{tab_name}!A:ZZ", safe="")
        url = (
            f"https://sheets.googleapis.com/v4/spreadsheets/{self.google_sheet_id}"
            f"/values/{range_name}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE"
            f"&key={self.google_sheets_api_key}"
        )
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        values = response.json().get("values", [])
        return self._parse_values(values)

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
            return [
                {
                    (key or "").strip().lower(): self._clean_cell(value)
                    for key, value in row.items()
                }
                for row in reader
            ]

        simple_reader = csv.reader(StringIO(sample))
        return [{"message": self._clean_cell(row[0])} for row in simple_reader if row]

    def _parse_values(self, values):
        if not values:
            return []

        headers = [str(cell).strip().lower() for cell in values[0]]
        if any(headers):
            rows = []
            for value_row in values[1:]:
                row = {}
                for index, header in enumerate(headers):
                    if not header:
                        continue
                    raw_value = value_row[index] if index < len(value_row) else ""
                    row[header] = self._clean_cell(str(raw_value))
                if any(row.values()):
                    rows.append(row)
            return rows

        return [{"message": self._clean_cell(str(row[0]))} for row in values if row]

    def _clean_cell(self, value):
        cleaned = (value or "").strip().replace("\\n", "\n")
        if not self.repair_mojibake:
            return cleaned
        return self._repair_mojibake(cleaned)

    def _repair_mojibake(self, value):
        if not value or not any(marker in value for marker in ("Ã", "Â", "Ä", "Æ", "áº", "á»")):
            return value
        if ftfy:
            repaired = ftfy.fix_text(value)
            if self._looks_more_readable(repaired, value):
                return repaired
        for encoding in ("cp1252", "latin1"):
            try:
                repaired = value.encode(encoding).decode("utf-8")
            except UnicodeError:
                continue
            if self._looks_more_readable(repaired, value):
                return repaired
        return value

    def _looks_more_readable(self, repaired, original):
        mojibake_markers = ("Ã", "Â", "Ä", "Æ", "áº", "á»")
        return sum(original.count(marker) for marker in mojibake_markers) > sum(
            repaired.count(marker) for marker in mojibake_markers
        )
