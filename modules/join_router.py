import logging

from modules.base import BotModule


LOGGER = logging.getLogger(__name__)


class JoinRouterModule(BotModule):
    name = "join_router"
    priority = 9

    def register(self):
        LOGGER.info("Register join router for bot %s.", self.settings.bot_key)
        self.bot.message_handler(content_types=["new_chat_members", "left_chat_member"])(self.active(self.handle_membership_message))

    def is_enabled(self):
        # Always load the router so join events can be fanned out even when
        # moderation is disabled for a specific bot.
        return True

    def handle_membership_message(self, message):
        if getattr(message, "content_type", "") == "new_chat_members":
            self.handle_new_members(message)
            return
        if getattr(message, "content_type", "") == "left_chat_member":
            self.handle_left_member(message)

    def handle_new_members(self, message):
        chat_id = getattr(getattr(message, "chat", None), "id", None)
        members = getattr(message, "new_chat_members", None) or []
        LOGGER.info(
            "Join router received event for bot %s in chat %s with %s new member(s).",
            self.settings.bot_key,
            chat_id,
            len(members),
        )
        for user in members:
            self.audit_member_event(chat_id, "member_joined", user, "service_message")
        self.forward(message, "welcome")
        self.forward(message, "share_unlock")

    def handle_left_member(self, message):
        chat_id = getattr(getattr(message, "chat", None), "id", None)
        user = getattr(message, "left_chat_member", None)
        if not user:
            return
        LOGGER.info(
            "Join router received leave event for bot %s in chat %s user %s.",
            self.settings.bot_key,
            chat_id,
            getattr(user, "id", None),
        )
        self.audit_member_event(chat_id, "member_left", user, "service_message")

    def forward(self, message, module_name):
        try:
            for module in getattr(self.app, "modules", []) or []:
                if getattr(module, "name", "") != module_name:
                    continue
                handler = getattr(module, "handle_new_members", None)
                if callable(handler):
                    LOGGER.info(
                        "Join router forwarded event to %s for bot %s chat %s.",
                        module_name,
                        self.settings.bot_key,
                        getattr(getattr(message, "chat", None), "id", None),
                    )
                    handler(message)
                return
        except Exception as exc:
            LOGGER.warning("Join router cannot forward to %s for bot %s: %s", module_name, self.settings.bot_key, exc)

    def audit_member_event(self, chat_id, action, user, source):
        user_id = str(getattr(user, "id", "") or "")
        first_name = getattr(user, "first_name", None) or ""
        last_name = getattr(user, "last_name", None) or ""
        display_name = " ".join(part for part in (first_name, last_name) if part).strip() or getattr(user, "username", "") or user_id
        username = getattr(user, "username", "") or ""
        details = f"source={source};display_name={display_name};username={username};is_bot={getattr(user, 'is_bot', False)}"
        try:
            self.store.insert(
                "audit_logs",
                {
                    "bot_key": self.settings.bot_key,
                    "chat_id": str(chat_id or ""),
                    "actor_user_id": "bot",
                    "action": action,
                    "target_user_id": user_id,
                    "details": details,
                },
            )
        except Exception as exc:
            LOGGER.warning("Join router cannot write %s audit for bot %s: %s", action, self.settings.bot_key, exc)
