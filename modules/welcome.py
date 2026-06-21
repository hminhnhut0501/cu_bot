import logging
from html import escape

from core.utils import as_bool, as_int
from modules.base import BotModule
import telebot


LOGGER = logging.getLogger(__name__)


class WelcomeModule(BotModule):
    name = "welcome"
    priority = 12

    def register(self):
        LOGGER.info("Register welcome handler for bot %s.", self.settings.bot_key)
        self.bot.message_handler(content_types=["new_chat_members"])(self.active(self.handle_new_members))

    def is_enabled(self):
        # Always register the handler so Welcome can be toggled live from Admin CP
        # without needing a process restart. Runtime checks happen inside the handler.
        return True

    def module_row(self, fresh=False):
        rows = self.store.fresh_rows("module_settings") if fresh else self.store.rows("module_settings")
        for row in rows:
            if (row.get("bot_key") or "").strip() != self.settings.bot_key:
                continue
            if (row.get("module_key") or "").strip() != "welcome":
                continue
            return row
        return None

    def module_enabled(self, module_key, default=True):
        row = self.module_row(fresh=True if module_key == "welcome" else False)
        if row and (row.get("module_key") or "").strip() == module_key:
            return as_bool(row.get("enabled"), default)
        return default

    def setting(self, key, default=None):
        row = self.module_row()
        if not row:
            return default
        settings = row.get("settings") or {}
        if isinstance(settings, str):
            try:
                import json

                settings = json.loads(settings)
            except Exception:
                settings = {}
        if isinstance(settings, dict) and settings.get(key) not in (None, ""):
            return settings.get(key)
        return default

    def buttons_setting(self):
        value = self.setting("welcome_buttons_text", "")
        return str(value or "")

    def parse_buttons(self, raw_text):
        rows = []
        for line in str(raw_text or "").splitlines():
            line = line.strip()
            if not line:
                continue
            if "|" not in line:
                continue
            label, url = [part.strip() for part in line.split("|", 1)]
            if label and url:
                rows.append((label, url))
        if not rows:
            return None
        markup = telebot.types.InlineKeyboardMarkup()
        for label, url in rows[:8]:
            markup.add(telebot.types.InlineKeyboardButton(text=label, url=url))
        return markup

    def handle_new_members(self, message):
        chat_id = getattr(getattr(message, "chat", None), "id", None)
        members = getattr(message, "new_chat_members", None) or []
        LOGGER.info(
            "Welcome event received for bot %s in chat %s with %s new member(s).",
            self.settings.bot_key,
            chat_id,
            len(members),
        )

        if not self.module_enabled("welcome", False):
            LOGGER.info("Welcome module disabled for bot %s. Skip chat %s.", self.settings.bot_key, chat_id)
            return
        if not self.can_send_messages(message.chat.id):
            LOGGER.warning("Welcome cannot send messages for bot %s in chat %s.", self.settings.bot_key, chat_id)
            return

        for user in members:
            if getattr(user, "is_bot", False):
                LOGGER.info("Skip welcome for bot user %s in chat %s.", getattr(user, "id", None), chat_id)
                continue
            if self.admin_exempt(message.chat.id, getattr(user, "id", None)):
                LOGGER.info("Skip welcome for admin user %s in chat %s.", getattr(user, "id", None), chat_id)
                continue
            self.send_welcome(message.chat.id, user)

    def can_send_messages(self, chat_id):
        try:
            me = self.bot.get_me()
            member = self.bot.get_chat_member(chat_id, me.id)
            status = str(getattr(member, "status", "") or "").lower()
            if status in {"creator", "administrator", "member"}:
                return True
            permissions = getattr(member, "permissions", None)
            return bool(getattr(permissions, "can_send_messages", False))
        except Exception as exc:
            LOGGER.warning("Cannot inspect bot permissions in %s: %s", chat_id, exc)
            return False

    def admin_exempt(self, chat_id, user_id):
        try:
            member = self.bot.get_chat_member(chat_id, user_id)
            return member.status in {"creator", "administrator"} and as_bool(self.setting("skip_admins", "true"), True)
        except Exception:
            return False

    def user_mention(self, user):
        first_name = getattr(user, "first_name", None) or ""
        last_name = getattr(user, "last_name", None) or ""
        full_name = " ".join(part for part in (first_name, last_name) if part).strip()
        name = full_name or getattr(user, "username", None) or str(user.id)
        return f'<a href="tg://user?id={user.id}">{escape(str(name))}</a>'

    def render_text(self, chat_id, user):
        template = self.setting("welcome_text", "Chào mừng {user} đến với {group}.")
        try:
            chat = self.bot.get_chat(chat_id)
            group_name = getattr(chat, "title", None) or getattr(chat, "username", None) or str(chat_id)
        except Exception:
            group_name = str(chat_id)
        context = {
            "user": self.user_mention(user),
            "mention": self.user_mention(user),
            "group": escape(str(group_name)),
            "group_id": str(chat_id),
            "user_id": str(user.id),
        }
        try:
            return str(template).format(**context)
        except Exception:
            return str(template)

    def send_welcome(self, chat_id, user):
        text = self.render_text(chat_id, user)
        if not text.strip():
            LOGGER.info("Welcome text empty for bot %s in chat %s.", self.settings.bot_key, chat_id)
            return False
        try:
            markup = self.parse_buttons(self.buttons_setting())
            sent = self.bot.send_message(
                chat_id,
                text,
                parse_mode="HTML",
                disable_web_page_preview=True,
                reply_markup=markup,
            )
            delete_after = as_int(self.setting("welcome_delete_seconds", 30), 30)
            if delete_after > 0:
                self.delete_later(chat_id, sent.message_id, delete_after, "welcome_notice")
            LOGGER.info(
                "Welcome sent for bot %s in chat %s to user %s.",
                self.settings.bot_key,
                chat_id,
                getattr(user, "id", None),
            )
            return True
        except Exception as exc:
            LOGGER.warning(
                "Cannot send welcome message for bot %s in %s to user %s: %s",
                self.settings.bot_key,
                chat_id,
                getattr(user, "id", None),
                exc,
            )
            return False
