import json
import logging
import time
from datetime import datetime

import telebot

from core.utils import as_bool
from modules.base import BotModule


LOGGER = logging.getLogger(__name__)


class ChannelPublisherModule(BotModule):
    name = "channel_publisher"
    priority = 55

    def start(self):
        self.app.run_background("channel_publisher", self.run_loop)

    def is_enabled(self):
        return self.module_active()

    def module_active(self):
        for row in self.store.rows("module_settings"):
            if (row.get("module_key") or "").strip() == self.name:
                return as_bool(row.get("enabled"), True)
        return True

    def run_loop(self):
        interval = max(15, min(self.settings.data_refresh_seconds, 60))
        while True:
            try:
                self.publish_pending_posts()
            except Exception as exc:
                LOGGER.warning("Channel publisher loop failed for bot %s: %s", self.settings.bot_key, exc)
            time.sleep(interval)

    def publish_pending_posts(self):
        if not self.bot_active() or not self.module_active():
            return
        for row in self.store.enabled_rows("channel_posts"):
            if (row.get("status") or "draft").strip().lower() != "pending":
                continue
            if not row.get("target_chat_id") or not row.get("content"):
                continue
            self.publish_post(row)

    def publish_post(self, row):
        row_id = row.get("id")
        chat_id = row.get("target_chat_id")
        content = row.get("content")
        parse_mode = (row.get("parse_mode") or self.settings.parse_mode or "HTML").strip()
        reply_markup = self.build_markup(row.get("buttons_text") or row.get("buttons"))
        try:
            if row_id:
                self.store.update("channel_posts", row_id, {"status": "sending", "error": ""})
            sent = self.bot.send_message(
                chat_id,
                content,
                parse_mode=parse_mode or None,
                reply_markup=reply_markup,
                disable_web_page_preview=as_bool(row.get("disable_web_page_preview"), False),
            )
            if row_id:
                self.store.update(
                    "channel_posts",
                    row_id,
                    {
                        "status": "sent",
                        "sent_message_id": str(getattr(sent, "message_id", "")),
                        "sent_at": datetime.utcnow().isoformat() + "Z",
                        "error": "",
                    },
                )
            LOGGER.info("Published channel post %s to %s for bot %s.", row_id, chat_id, self.settings.bot_key)
        except Exception as exc:
            if row_id:
                self.store.update("channel_posts", row_id, {"status": "failed", "error": str(exc)})
            LOGGER.warning("Cannot publish channel post %s to %s for bot %s: %s", row_id, chat_id, self.settings.bot_key, exc)

    def build_markup(self, raw_buttons):
        rows = self.parse_buttons(raw_buttons)
        if not rows:
            return None
        markup = telebot.types.InlineKeyboardMarkup()
        for row in rows:
            buttons = [
                telebot.types.InlineKeyboardButton(text=label, url=url)
                for label, url in row
                if label and url
            ]
            if buttons:
                markup.row(*buttons)
        return markup

    def parse_buttons(self, raw_buttons):
        text = str(raw_buttons or "").strip()
        if not text:
            return []
        if text.startswith("["):
            try:
                data = json.loads(text)
                return [
                    [(str(item.get("text") or item.get("label") or ""), str(item.get("url") or "")) for item in row]
                    for row in data
                    if isinstance(row, list)
                ]
            except Exception:
                LOGGER.warning("Invalid channel button JSON for bot %s.", self.settings.bot_key)
                return []
        rows = []
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            button_row = []
            for chunk in line.split("||"):
                parts = [part.strip() for part in chunk.split("|", 1)]
                if len(parts) == 2:
                    button_row.append((parts[0], parts[1]))
            if button_row:
                rows.append(button_row)
        return rows
