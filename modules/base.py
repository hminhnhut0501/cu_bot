from functools import wraps
import logging
import threading
import time


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

    def active(self, handler):
        @wraps(handler)
        def wrapped(*args, **kwargs):
            if not self.bot_active():
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
