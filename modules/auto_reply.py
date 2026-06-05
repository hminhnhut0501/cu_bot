import re
from random import choice

from core.utils import as_int, normalize_text
from modules.base import BotModule


class AutoReplyModule(BotModule):
    name = "auto_reply"
    priority = 30

    def register(self):
        self.bot.message_handler(
            func=lambda message: bool(getattr(message, "text", None)) and not message.text.startswith("/"),
            content_types=["text"],
        )(self.active(self.handle_text))

    def is_enabled(self):
        return True

    def scoped_auto_replies(self):
        for row in self.store.enabled_rows("auto_replies"):
            if (row.get("bot_key") or "").strip() != self.settings.bot_key:
                continue
            yield row

    def module_active(self):
        for row in self.store.rows("module_settings"):
            if (row.get("bot_key") or "").strip() != self.settings.bot_key:
                continue
            if (row.get("module_key") or "").strip() == self.name:
                return str(row.get("enabled", True)).lower() in {"1", "true", "yes", "on"}
        return False

    def handle_text(self, message):
        if not self.module_active():
            return
        text = getattr(message, "text", "") or ""
        if not text.strip():
            return
        if getattr(getattr(message, "from_user", None), "is_bot", False):
            return
        if getattr(message, "forward_date", None) or getattr(message, "forward_origin", None):
            return
        if getattr(message, "is_automatic_forward", False):
            return

        user = getattr(message, "from_user", None)
        if not user:
            return

        user_cooldown = self.setting_int("auto_reply_user_cooldown_seconds", 45)
        trigger_cooldown = self.setting_int("auto_reply_trigger_cooldown_seconds", 8)
        min_trigger_length = max(1, self.setting_int("auto_reply_min_trigger_length", 2))
        normalized = normalize_text(text)
        scored_candidates = []
        for row in self.scoped_auto_replies():
            if not self.in_scope(message, row):
                continue
            trigger = (row.get("trigger") or "").strip()
            if not trigger:
                continue
            trigger_norm = normalize_text(trigger)
            if len(trigger_norm) < min_trigger_length:
                continue
            matched, score = self.match_rule(trigger, trigger_norm, text, normalized, (row.get("match") or "smart").lower())
            if matched:
                scored_candidates.append((score, row, trigger_norm))

        if not scored_candidates:
            return

        best_score = max(item[0] for item in scored_candidates)
        top = [item for item in scored_candidates if item[0] == best_score]
        _, selected_row, trigger_key = choice(top)
        if not self.state.can_auto_reply(message.chat.id, user.id, trigger_key, user_cooldown, trigger_cooldown):
            return

        reply_text = self.pick_reply_variant(selected_row.get("reply") or "")
        if not reply_text:
            return
        try:
            self.bot.reply_to(message, reply_text)
        except Exception:
            pass

    def in_scope(self, message, row):
        chat_id = str(getattr(getattr(message, "chat", None), "id", "") or "")
        row_chat_id = str(row.get("chat_id") or row.get("group_id") or "").strip()
        if row_chat_id and row_chat_id != chat_id:
            return False
        return True

    def tokenize(self, text):
        return re.findall(r"[a-z0-9_]+", normalize_text(text or ""))

    def contains_whole_word(self, source_normalized, trigger_normalized):
        if " " in trigger_normalized:
            return trigger_normalized in source_normalized
        pattern = rf"(^|[^a-z0-9_]){re.escape(trigger_normalized)}([^a-z0-9_]|$)"
        return bool(re.search(pattern, source_normalized))

    def match_rule(self, trigger_raw, trigger_normalized, source_raw, source_normalized, mode):
        if not trigger_normalized:
            return False, 0
        if mode == "regex":
            try:
                matched = bool(re.search(trigger_raw, source_raw, re.IGNORECASE))
            except re.error:
                matched = False
            return matched, 300 + len(trigger_normalized)
        if mode == "exact":
            matched = source_normalized.strip() == trigger_normalized.strip()
            return matched, 260 + len(trigger_normalized)
        if mode == "contains":
            matched = self.contains_whole_word(source_normalized, trigger_normalized)
            return matched, 180 + len(trigger_normalized)

        trigger_tokens = self.tokenize(trigger_normalized)
        source_tokens = self.tokenize(source_normalized)
        if not trigger_tokens or not source_tokens:
            return False, 0
        if len(trigger_tokens) == 1:
            matched = trigger_tokens[0] in source_tokens
            return matched, 220 + len(trigger_tokens[0])
        phrase_hit = trigger_normalized in source_normalized
        token_hit = all(token in source_tokens for token in trigger_tokens)
        matched = phrase_hit or token_hit
        return matched, (240 if phrase_hit else 200) + len(trigger_normalized)

    def pick_reply_variant(self, raw_reply):
        text = str(raw_reply or "").strip()
        if not text:
            return ""
        chunks = []
        for line in text.splitlines():
            parts = [part.strip() for part in line.split("||")]
            for part in parts:
                if part:
                    chunks.append(part)
        if not chunks:
            return text
        return choice(chunks)

    def setting_int(self, key, default=0):
        return as_int(self.store.value(key, default), default)
