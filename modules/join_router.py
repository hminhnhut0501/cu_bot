import logging

from modules.base import BotModule


LOGGER = logging.getLogger(__name__)


class JoinRouterModule(BotModule):
    name = "join_router"
    priority = 9

    def register(self):
        LOGGER.info("Register join router for bot %s.", self.settings.bot_key)
        self.bot.message_handler(content_types=["new_chat_members"])(self.active(self.handle_new_members))

    def is_enabled(self):
        # Always load the router so join events can be fanned out even when
        # moderation is disabled for a specific bot.
        return True

    def handle_new_members(self, message):
        chat_id = getattr(getattr(message, "chat", None), "id", None)
        members = getattr(message, "new_chat_members", None) or []
        LOGGER.info(
            "Join router received event for bot %s in chat %s with %s new member(s).",
            self.settings.bot_key,
            chat_id,
            len(members),
        )
        self.forward(message, "welcome")
        self.forward(message, "share_unlock")

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
