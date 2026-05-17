import re

from core.utils import normalize_text
from modules.base import BotModule


class AutoReplyModule(BotModule):
    name = "auto_reply"
    priority = 30

    def register(self):
        self.bot.message_handler(
            func=lambda message: bool(getattr(message, "text", None)) and not message.text.startswith("/"),
            content_types=["text"],
        )(self.handle_text)

    def is_enabled(self):
        return self.module_enabled("auto_reply", True)

    def module_enabled(self, module_key, default=True):
        for row in self.store.enabled_rows("module_settings"):
            if (row.get("module_key") or "").strip() == module_key:
                return str(row.get("enabled", default)).lower() in {"1", "true", "yes", "on"}
        return default

    def handle_text(self, message):
        text = getattr(message, "text", "") or ""
        normalized = normalize_text(text)
        for row in self.store.enabled_rows("auto_replies"):
            trigger = row.get("trigger") or ""
            if not trigger:
                continue
            match_type = (row.get("match") or "contains").lower()
            trigger_norm = normalize_text(trigger)
            matched = (
                bool(re.search(trigger, text, re.IGNORECASE))
                if match_type == "regex"
                else normalized == trigger_norm
                if match_type == "exact"
                else trigger_norm in normalized
            )
            if matched:
                try:
                    self.bot.reply_to(message, row.get("reply") or "")
                except Exception:
                    pass
                return
