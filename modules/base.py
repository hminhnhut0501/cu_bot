from functools import wraps
import logging
import threading
import time

from core.utils import as_bool, normalize_id


LOGGER = logging.getLogger(__name__)


class BotModule:
    name = "base"
    priority = 100

    def __init__(self, app):
        self.app = app
        self.bot = app.bot
        self.store = app.store
        self.state = app.state
        self.settings = app.settings

    def is_enabled(self):
        return True

    def bot_active(self):
        return self.store.bot_active()

    @staticmethod
    def _extract_chat(obj):
        if obj is None:
            return None
        chat = getattr(obj, "chat", None)
        if chat is not None:
            return chat
        message = getattr(obj, "message", None)
        if message is not None:
            return getattr(message, "chat", None)
        return None

    def group_allowed(self, chat_id):
        target_id = normalize_id(chat_id)
        if not target_id:
            return False

        env_allowed = getattr(self.settings, "allowed_chat_ids", None)
        if env_allowed:
            return target_id in {normalize_id(item) for item in env_allowed if item}

        bot_key = getattr(self.settings, "bot_key", "main")
        scoped_rows = [
            row for row in self.store.rows("groups")
            if not (row.get("bot_key") or "").strip() or (row.get("bot_key") or "").strip() == bot_key
        ]
        if not scoped_rows:
            return True

        return any(
            as_bool(row.get("enabled"), True)
            and normalize_id(row.get("group_id") or row.get("chat_id")) == target_id
            for row in scoped_rows
        )

    def active(self, handler, check_group=True):
        @wraps(handler)
        def wrapped(*args, **kwargs):
            if not self.bot_active():
                return None
            if check_group and args:
                chat = self._extract_chat(args[0])
                if chat is not None and getattr(chat, "type", "") in {"group", "supergroup", "channel"}:
                    if not self.group_allowed(getattr(chat, "id", None)):
                        return None
            return handler(*args, **kwargs)

        return wrapped

    def register(self):
        pass

    def start(self):
        pass

    def delete_later(self, chat_id, message_id, delay_seconds, reason="delayed_delete", on_success=None, on_error=None):
        def worker():
            try:
                LOGGER.info(
                    "Scheduled delete in %ss for chat=%s message=%s reason=%s.",
                    delay_seconds,
                    chat_id,
                    message_id,
                    reason,
                )
                time.sleep(max(0, int(delay_seconds)))
                self.bot.delete_message(chat_id, message_id)
                LOGGER.info(
                    "Deleted delayed message chat=%s message=%s reason=%s.",
                    chat_id,
                    message_id,
                    reason,
                )
                if callable(on_success):
                    on_success()
            except Exception as exc:
                LOGGER.warning(
                    "Cannot delete delayed message chat=%s message=%s reason=%s: %s",
                    chat_id,
                    message_id,
                    reason,
                    exc,
                )
                if callable(on_error):
                    on_error(exc)

        threading.Thread(
            target=worker,
            name=f"delete-later:{chat_id}:{message_id}",
            daemon=True,
        ).start()

    def link_preview_kwargs(self, disable=True):
        if not disable:
            return {}
        try:
            from telebot.types import LinkPreviewOptions

            return {"link_preview_options": LinkPreviewOptions(is_disabled=True)}
        except Exception:
            # Fallback for older pyTelegramBotAPI releases.
            return {"disable_web_page_preview": True}
