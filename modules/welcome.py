import logging
import json
from html import escape

from core.utils import as_bool, as_int
from modules.base import BotModule
import telebot


LOGGER = logging.getLogger(__name__)


class WelcomeModule(BotModule):
    name = "welcome"
    priority = 12

    def register(self):
        self.bot.message_handler(content_types=["new_chat_members"])(self.active(self.handle_new_members))

    def is_enabled(self):
        return self.module_enabled("welcome", False)

    def module_enabled(self, module_key, default=True):
        for row in self.store.rows("module_settings"):
            if (row.get("module_key") or "").strip() != module_key:
                continue
            return as_bool(row.get("enabled"), default)
        return default

    def setting(self, key, default=None):
        for row in self.store.rows("module_settings"):
            if (row.get("module_key") or "").strip() != "welcome":
                continue
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
        if not self.module_enabled("welcome", False):
            return
        if not self.can_send_messages(message.chat.id):
            return

        for user in message.new_chat_members or []:
            if getattr(user, "is_bot", False):
                continue
            if self.admin_exempt(message.chat.id, getattr(user, "id", None)):
                continue
            self.send_welcome(message.chat.id, user)

    def can_send_messages(self, chat_id):
        try:
            me = self.bot.get_me()
            member = self.bot.get_chat_member(chat_id, me.id)
            status = str(getattr(member, "status", "") or "").lower()
            if status in {"creator", "administrator"}:
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
            return True
        except Exception as exc:
            LOGGER.warning("Cannot send welcome message in %s: %s", chat_id, exc)
            return False
