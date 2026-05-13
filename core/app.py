import importlib
import inspect
import logging
import pkgutil
import threading

from core.sheets import SheetStore
from core.state import RuntimeState
from keep_alive import keep_alive
from modules.base import BotModule


LOGGER = logging.getLogger(__name__)


class BotApplication:
    def __init__(self, bot, settings):
        self.bot = bot
        self.settings = settings
        self.sheets = SheetStore(
            settings.sheet_urls,
            settings.sheets_refresh_seconds,
            google_sheet_id=settings.google_sheet_id,
            google_sheets_api_key=settings.google_sheets_api_key,
            google_sheet_tabs=settings.google_sheet_tabs,
            repair_mojibake=settings.repair_mojibake,
        )
        self.state = RuntimeState()
        self.modules = []

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
        self.bot.infinity_polling(skip_pending=True, timeout=60, long_polling_timeout=60)

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
