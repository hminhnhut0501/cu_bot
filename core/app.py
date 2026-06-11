import importlib
import inspect
import logging
import pkgutil
import threading
import time

import requests
from telebot.apihelper import ApiTelegramException

from core.supabase_store import SupabaseStore
from core.state import RuntimeState
from keep_alive import keep_alive
from modules.base import BotModule


LOGGER = logging.getLogger(__name__)
TELEBOT_LOGGER = logging.getLogger("TeleBot")


class BotApplication:
    def __init__(self, bot, settings):
        self.bot = bot
        self.settings = settings
        self.store = self._create_data_store()
        self.state = RuntimeState()
        self.modules = []

    def _create_data_store(self):
        return SupabaseStore(
            self.settings.supabase_url,
            self.settings.supabase_service_role_key,
            self.settings.data_refresh_seconds,
            bot_key=self.settings.bot_key,
        )

    def start(self):
        if self.settings.keep_alive_enabled:
            keep_alive(self.settings.keep_alive_port)

        self.modules = self._load_modules()
        for module in self.modules:
            LOGGER.info("Starting module: %s", module.name)
            module.register()

        for module in self.modules:
            module.start()

        LOGGER.info("Bot is running with %s module(s).", len(self.modules))
        self.run_polling()

    def run_polling(self):
        if self.settings.polling_startup_delay_seconds > 0:
            LOGGER.info("Waiting %s second(s) before polling.", self.settings.polling_startup_delay_seconds)
            time.sleep(self.settings.polling_startup_delay_seconds)

        self.remove_existing_webhook()

        first_run = True
        conflict_retry_seconds = max(2, int(self.settings.polling_retry_seconds))
        conflict_retry_max = max(conflict_retry_seconds, 90)
        while True:
            try:
                self.bot.infinity_polling(
                    skip_pending=first_run,
                    timeout=25,
                    long_polling_timeout=20,
                    logger_level=logging.ERROR,
                )
                first_run = False
                conflict_retry_seconds = max(2, int(self.settings.polling_retry_seconds))
            except ApiTelegramException as exc:
                if self.is_polling_conflict_error(exc):
                    LOGGER.warning(
                        "Polling conflict 409 for bot_key=%s: another process is calling getUpdates "
                        "with the same token. Retrying in %s second(s).",
                        self.settings.bot_key,
                        conflict_retry_seconds,
                    )
                elif self.is_transient_polling_error(exc):
                    LOGGER.warning(
                        "Telegram API transient error for bot_key=%s (%s). Retrying in %s second(s).",
                        self.settings.bot_key,
                        getattr(exc, "error_code", "unknown"),
                        conflict_retry_seconds,
                    )
                else:
                    raise
                time.sleep(conflict_retry_seconds)
                conflict_retry_seconds = min(conflict_retry_seconds * 2, conflict_retry_max)
                self.remove_existing_webhook()
                first_run = False
                continue
            except (requests.exceptions.ReadTimeout, requests.exceptions.ConnectionError, TimeoutError) as exc:
                LOGGER.warning(
                    "Polling timeout/network interruption for bot_key=%s: %s. Retrying in %s second(s).",
                    self.settings.bot_key,
                    exc,
                    conflict_retry_seconds,
                )
                time.sleep(conflict_retry_seconds)
                conflict_retry_seconds = min(conflict_retry_seconds * 2, conflict_retry_max)
                self.remove_existing_webhook()
                first_run = False
                continue
            except Exception as exc:
                if self.is_polling_conflict_error(exc) or self.is_transient_polling_error(exc):
                    LOGGER.warning(
                        "Polling interruption detected from generic exception for bot_key=%s. "
                        "Retrying in %s second(s).",
                        self.settings.bot_key,
                        conflict_retry_seconds,
                    )
                    time.sleep(conflict_retry_seconds)
                    conflict_retry_seconds = min(conflict_retry_seconds * 2, conflict_retry_max)
                    self.remove_existing_webhook()
                    first_run = False
                    continue
                raise

    def remove_existing_webhook(self):
        try:
            # Ưu tiên API mới với drop_pending_updates=False để không mất update khi đổi mode.
            self.bot.remove_webhook(drop_pending_updates=False)
            LOGGER.info("Webhook cleared before polling for bot_key=%s.", self.settings.bot_key)
        except TypeError:
            # Fallback cho version telebot cũ không hỗ trợ tham số.
            self.bot.remove_webhook()
            LOGGER.info("Webhook cleared (legacy remove_webhook) for bot_key=%s.", self.settings.bot_key)
        except Exception as exc:
            LOGGER.warning("Cannot remove existing webhook before polling: %s", exc)

    @staticmethod
    def is_polling_conflict_error(exc):
        code = getattr(exc, "error_code", None)
        message = str(exc).lower()
        return code == 409 or ("terminated by other getupdates request" in message and "conflict" in message)

    @staticmethod
    def is_transient_polling_error(exc):
        code = getattr(exc, "error_code", None)
        message = str(exc).lower()
        return code in {429, 500, 502, 503, 504} or "bad gateway" in message or "gateway" in message or "timeout" in message

    def _load_modules(self):
        module_classes = []
        package = importlib.import_module(self.settings.module_package)
        for info in pkgutil.iter_modules(package.__path__, package.__name__ + "."):
            if info.name.endswith(".base"):
                continue
            imported = importlib.import_module(info.name)
            for _, obj in inspect.getmembers(imported, inspect.isclass):
                if obj is BotModule or not issubclass(obj, BotModule):
                    continue
                module_classes.append(obj)

        instances = []
        for cls in sorted(module_classes, key=lambda item: item.priority):
            module = cls(self)
            if self.settings.enabled_modules and module.name not in self.settings.enabled_modules:
                continue
            if module.is_enabled():
                instances.append(module)
        return instances

    def run_background(self, name, target):
        thread = threading.Thread(name=name, target=target, daemon=True)
        thread.start()
        return thread
