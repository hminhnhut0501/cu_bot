from modules.base import BotModule


class ReputationModule(BotModule):
    name = "reputation"
    priority = 90

    def register(self):
        self.bot.message_handler(
            func=lambda message: bool(getattr(message, "from_user", None)) and not getattr(message.from_user, "is_bot", False),
            content_types=["text", "photo", "video", "document", "sticker", "animation", "voice"],
        )(self.track_activity)

    def is_enabled(self):
        return self.module_enabled("reputation", False)

    def module_enabled(self, module_key, default=True):
        for row in self.store.enabled_rows("module_settings"):
            if (row.get("module_key") or "").strip() == module_key:
                return str(row.get("enabled", default)).lower() in {"1", "true", "yes", "on"}
        return default

    def track_activity(self, message):
        points = self.points_for("message", 1)
        if points <= 0:
            return
        try:
            self.store.insert("reputation_events", {
                "user_id": str(message.from_user.id),
                "chat_id": str(message.chat.id),
                "action_key": "message",
                "points": points,
                "reason": "Gửi tin nhắn",
            })
        except Exception:
            pass

    def points_for(self, action_key, default):
        for row in self.store.enabled_rows("reputation_rules"):
            if row.get("action_key") == action_key:
                try:
                    return int(row.get("points") or default)
                except Exception:
                    return default
        return default
