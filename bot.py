import logging

import telebot

from core.app import BotApplication
from core.config import load_settings


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    settings = load_settings()
    bot = telebot.TeleBot(settings.bot_token, parse_mode=settings.parse_mode)
    app = BotApplication(bot, settings)
    app.start()


if __name__ == "__main__":
    main()
