import importlib
import inspect
import logging
import pkgutil
import threading
import time

from telebot.apihelper import ApiTelegramException

from core.sheets import SheetStore
from core.supabase_store import SupabaseStore
from core.state import RuntimeState
from keep_alive import keep_alive
from modules.base import BotModule


LOGGER = logging.getLogger(__name__)


class BotApplication:
    def __init__(self, bot, settings):
        self.bot = bot
        self.settings = settings
        self.sheets = self._create_data_store()
        self.state = RuntimeState()
        self.modules = []

    def _create_data_store(self):
        if self.settings.data_backend == "supabase":
            return SupabaseStore(
                self.settings.supabase_url,
                self.settings.supabase_service_role_key,
                self.settings.sheets_refresh_seconds,
            )
        return SheetStore(
            self.settings.sheet_urls,
            self.settings.sheets_refresh_seconds,
            google_sheet_id=self.settings.google_sheet_id,
            google_sheets_api_key=self.settings.google_sheets_api_key,
            google_sheet_tabs=self.settings.google_sheet_tabs,
            repair_mojibake=self.settings.repair_mojibake,
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
        while True:
            try:
                self.bot.infinity_polling(
                    skip_pending=first_run,
                    timeout=60,
                    long_polling_timeout=60,
                    logger_level=logging.ERROR,
                )
                first_run = False
            except ApiTelegramException as exc:
                if getattr(exc, "error_code", None) == 409:
                    LOGGER.warning(
                        "Telegram polling conflict. Another instance is still polling. "
                        "Retrying in %s second(s).",
                        self.settings.polling_retry_seconds,
                    )
                    time.sleep(self.settings.polling_retry_seconds)
                    first_run = False
                    continue
                raise

    def remove_existing_webhook(self):
        try:
            self.bot.remove_webhook()
        except Exception as exc:
            LOGGER.warning("Cannot remove existing webhook before polling: %s", exc)

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
