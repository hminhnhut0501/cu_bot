import json
import logging
import time
from datetime import datetime, timezone

import telebot

from core.utils import as_bool, as_int
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
        interval = 3
        while True:
            try:
                self.process_posts()
            except Exception as exc:
                LOGGER.warning("Channel publisher loop failed for bot %s: %s", self.settings.bot_key, exc)
            time.sleep(interval)

    def process_posts(self):
        if not self.bot_active() or not self.module_active():
            return
        for row in self.store.fresh_rows("channel_posts"):
            if not as_bool(row.get("enabled"), True):
                continue
            status = (row.get("status") or "draft").strip().lower()
            if status in {"pending", "queued"} or (status == "scheduled" and self.is_due(row.get("scheduled_at"))):
                self.publish_post(row, status)
            elif status in {"sent", "delete_scheduled"} and row.get("delete_at") and self.is_due(row.get("delete_at")):
                self.delete_post(row, status)

    def publish_post(self, row, original_status):
        row_id = row.get("id")
        chat_id = row.get("target_chat_id")
        content = row.get("content")
        if not row_id or not chat_id or not content:
            return
        parse_mode = (row.get("parse_mode") or self.settings.parse_mode or "HTML").strip()
        reply_markup = self.build_markup(row.get("buttons_text") or row.get("buttons"))
        now = self.utc_now()
        try:
            claimed = self.store.update_where(
                "channel_posts",
                row_id,
                {
                    "status": "sending",
                    "error": "",
                    "error_code": "",
                    "last_attempt_at": now,
                    "attempt_count": as_int(row.get("attempt_count"), 0) + 1,
                    "updated_at": now,
                },
                status=original_status,
            )
            if not claimed:
                return
            self.record_event(row_id, "send_started", "Bot bắt đầu gửi bài.")
            sent = self.bot.send_message(
                chat_id,
                content,
                parse_mode=parse_mode or None,
                reply_markup=reply_markup,
                disable_web_page_preview=as_bool(row.get("disable_web_page_preview"), False),
            )
            self.store.update(
                "channel_posts",
                row_id,
                {
                    "status": "delete_scheduled" if row.get("delete_at") else "sent",
                    "sent_message_id": str(getattr(sent, "message_id", "")),
                    "sent_at": self.utc_now(),
                    "updated_at": self.utc_now(),
                    "error": "",
                    "error_code": "",
                },
            )
            self.record_event(row_id, "send_succeeded", "Telegram đã nhận bài.", {"message_id": getattr(sent, "message_id", "")})
            LOGGER.info("Published channel post %s to %s for bot %s.", row_id, chat_id, self.settings.bot_key)
        except Exception as exc:
            self.store.update(
                "channel_posts",
                row_id,
                {"status": "failed", "error": str(exc), "error_code": self.error_code(exc), "updated_at": self.utc_now()},
            )
            self.record_event(row_id, "send_failed", "Không gửi được bài.", {"error": str(exc)})
            LOGGER.warning("Cannot publish channel post %s to %s for bot %s: %s", row_id, chat_id, self.settings.bot_key, exc)

    def delete_post(self, row, original_status):
        row_id = row.get("id")
        chat_id = row.get("target_chat_id")
        message_id = as_int(row.get("sent_message_id"), 0)
        if not row_id or not chat_id or not message_id:
            return
        try:
            claimed = self.store.update_where(
                "channel_posts",
                row_id,
                {"status": "deleting", "updated_at": self.utc_now(), "error": "", "error_code": ""},
                status=original_status,
            )
            if not claimed:
                return
            self.record_event(row_id, "delete_started", "Bot bắt đầu xóa bài.")
            self.bot.delete_message(chat_id, message_id)
            self.store.update(
                "channel_posts",
                row_id,
                {"status": "deleted", "deleted_at": self.utc_now(), "updated_at": self.utc_now(), "error": "", "error_code": ""},
            )
            self.record_event(row_id, "delete_succeeded", "Đã xóa bài khỏi Telegram.")
        except Exception as exc:
            self.store.update(
                "channel_posts",
                row_id,
                {"status": "failed", "error": str(exc), "error_code": self.error_code(exc), "updated_at": self.utc_now()},
            )
            self.record_event(row_id, "delete_failed", "Không xóa được bài.", {"error": str(exc)})
            LOGGER.warning("Cannot delete channel post %s from %s for bot %s: %s", row_id, chat_id, self.settings.bot_key, exc)

    def record_event(self, row_id, event_type, message, details=None):
        try:
            self.store.insert(
                "channel_post_events",
                {
                    "channel_post_id": row_id,
                    "event_type": event_type,
                    "message": message,
                    "details": details or {},
                },
            )
        except Exception as exc:
            LOGGER.warning("Cannot write channel post event %s for post %s: %s", event_type, row_id, exc)

    def is_due(self, value):
        parsed = self.parse_datetime(value)
        return bool(parsed and parsed <= datetime.now(timezone.utc))

    def parse_datetime(self, value):
        text = str(value or "").strip()
        if not text:
            return None
        try:
            return datetime.fromisoformat(text.replace("Z", "+00:00")).astimezone(timezone.utc)
        except ValueError:
            return None

    def utc_now(self):
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def error_code(self, exc):
        text = str(exc).lower()
        if "not enough rights" in text or "administrator" in text:
            return "missing_permission"
        if "chat not found" in text:
            return "chat_not_found"
        if "message to delete not found" in text:
            return "message_not_found"
        return "telegram_error"

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
