import random
import re
import unicodedata
from datetime import datetime
from zoneinfo import ZoneInfo


TRUE_VALUES = {"1", "true", "yes", "on", "enabled", "y", "x"}
ZERO_WIDTH_PATTERN = re.compile(r"[\u200B-\u200D\u2060\uFEFF\u00AD\u202A-\u202E]")


def normalize_text(text):
    cleaned = ZERO_WIDTH_PATTERN.sub("", text or "")
    normalized = unicodedata.normalize("NFD", cleaned)
    ascii_like = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return ascii_like.replace("đ", "d").replace("Đ", "D").lower().strip()


def count_zero_width_chars(text):
    if not text:
        return 0
    return len(ZERO_WIDTH_PATTERN.findall(str(text)))


def as_bool(value, default=False):
    if value is None or value == "":
        return default
    return str(value).strip().lower() in TRUE_VALUES


def as_int(value, default=0):
    try:
        if value is None or value == "":
            return default
        return int(float(str(value).strip()))
    except (TypeError, ValueError):
        return default


def normalize_id(value):
    if value is None:
        return ""
    text = str(value).strip()
    if not text:
        return ""
    try:
        return str(int(float(text)))
    except (TypeError, ValueError):
        return text


def as_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [item.strip() for item in str(value).split(",") if item.strip()]


def weighted_choice(rows):
    if not rows:
        return None
    weights = [max(as_int(row.get("weight"), 1), 1) for row in rows]
    return random.choices(rows, weights=weights, k=1)[0]


def now_in_timezone(tz_name):
    try:
        return datetime.now(ZoneInfo(tz_name))
    except Exception:
        return datetime.now()
