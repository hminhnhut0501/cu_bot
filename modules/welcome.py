import logging
from datetime import datetime, timezone
from html import escape

from core.utils import as_bool, as_int, normalize_id
from modules.base import BotModule
import telebot


LOGGER = logging.getLogger(__name__)


class WelcomeModule(BotModule):
    name = "welcome"
    priority = 12

    def register(self):
        # Membership updates are registered once by join_router. Keeping Welcome
        # as a pure consumer avoids duplicate handlers and ordering surprises.
        LOGGER.info("Register welcome consumer for bot %s.", self.settings.bot_key)

    def is_enabled(self):
        # Always load the consumer so Welcome can be toggled live from Admin CP
        # without needing a process restart. Runtime checks happen per event.
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

    def group_row(self, chat_id, fresh=False):
        rows = self.store.fresh_rows("groups") if fresh else self.store.enabled_rows("groups")
        target_chat_id = str(chat_id or "").strip()
        for row in rows:
            group_id = str(row.get("group_id") or row.get("chat_id") or "").strip()
            if normalize_id(group_id) == normalize_id(target_chat_id):
                return row
        return None

    def update_runtime_status(self, **changes):
        row = self.module_row(fresh=True)
        if not row or not row.get("id"):
            return
        settings = row.get("settings") or {}
        if isinstance(settings, str):
            try:
                import json

                settings = json.loads(settings)
            except Exception:
                settings = {}
        if not isinstance(settings, dict):
            settings = {}
        settings.update(changes)
        try:
            self.store.update("module_settings", row["id"], {"settings": settings})
        except Exception as exc:
            LOGGER.warning("Cannot update welcome runtime status for bot %s: %s", self.settings.bot_key, exc)

    @staticmethod
    def now_iso():
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def setting(self, chat_id, key, default=None):
        group_row = self.group_row(chat_id, fresh=True)
        if group_row and group_row.get(key) not in (None, ""):
            return group_row.get(key)
        return default

    def buttons_setting(self, chat_id):
        module_row = self.module_row(fresh=True)
        if not module_row:
            return ""
        settings = module_row.get("settings") or {}
        if isinstance(settings, str):
            try:
                import json

                settings = json.loads(settings)
            except Exception:
                settings = {}
        if isinstance(settings, dict):
            value = settings.get("welcome_buttons_text", "")
        else:
            value = ""
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
        self.update_runtime_status(
            welcome_runtime_last_event_at=self.now_iso(),
            welcome_runtime_last_chat_id=str(chat_id or ""),
            welcome_runtime_last_event_count=len(members),
            welcome_runtime_last_event_source="service_message",
        )
        self.audit(chat_id, "welcome_event_received", details=f"source=service_message,count={len(members)}")

        if not self.module_enabled("welcome", False):
            LOGGER.info("Welcome module disabled for bot %s. Skip chat %s.", self.settings.bot_key, chat_id)
            return
        if not self.can_send_messages(message.chat.id):
            LOGGER.warning("Welcome cannot send messages for bot %s in chat %s.", self.settings.bot_key, chat_id)
            self.update_runtime_status(
                welcome_runtime_last_error_at=self.now_iso(),
                welcome_runtime_last_error_message=f"Bot không có quyền gửi tin ở chat {chat_id}.",
            )
            return

        for user in members:
            self.process_welcome_candidate(message.chat.id, user, source="service_message")

    def handle_chat_member(self, update):
        chat = getattr(update, "chat", None)
        new_member = getattr(update, "new_chat_member", None)
        old_member = getattr(update, "old_chat_member", None)
        from_user = getattr(new_member, "user", None) or getattr(update, "from_user", None)
        chat_id = getattr(chat, "id", None)
        if not chat or not new_member or not from_user or chat_id is None:
            return

        old_status = str(getattr(old_member, "status", "") or "").lower()
        new_status = str(getattr(new_member, "status", "") or "").lower()
        old_is_member = getattr(old_member, "is_member", None)
        new_is_member = getattr(new_member, "is_member", None)

        LOGGER.info(
            "Welcome member-state candidate received for bot %s in chat %s user %s "
            "(%s/is_member=%s -> %s/is_member=%s).",
            self.settings.bot_key,
            chat_id,
            getattr(from_user, "id", None),
            old_status or "-",
            old_is_member,
            new_status or "-",
            new_is_member,
        )
        self.update_runtime_status(
            welcome_runtime_last_event_at=self.now_iso(),
            welcome_runtime_last_chat_id=str(chat_id or ""),
            welcome_runtime_last_event_count=1,
            welcome_runtime_last_event_source="member_state",
        )
        self.audit(
            chat_id,
            "welcome_event_received",
            target_user_id=getattr(from_user, "id", None),
            details=(
                f"source=member_state,old={old_status},new={new_status},"
                f"old_is_member={old_is_member},new_is_member={new_is_member}"
            ),
        )
        if not self.module_enabled("welcome", False):
            LOGGER.info(
                "Welcome module disabled for bot %s. Skip member-state candidate in chat %s.",
                self.settings.bot_key,
                chat_id,
            )
            return
        if not self.can_send_messages(chat_id):
            LOGGER.warning(
                "Welcome cannot send messages for bot %s in chat %s after member-state event.",
                self.settings.bot_key,
                chat_id,
            )
            self.update_runtime_status(
                welcome_runtime_last_error_at=self.now_iso(),
                welcome_runtime_last_error_message=f"Bot không có quyền gửi tin ở chat {chat_id}.",
            )
            return
        self.process_welcome_candidate(chat_id, from_user, source="member_state")

    def process_welcome_candidate(self, chat_id, user, source):
        user_id = getattr(user, "id", None)
        if getattr(user, "is_bot", False):
            LOGGER.info("Skip welcome for bot user %s in chat %s.", user_id, chat_id)
            return
        if self.admin_exempt(chat_id, user_id):
            LOGGER.info("Skip welcome for admin user %s in chat %s.", user_id, chat_id)
            return
        if user_id is not None and not self.state.should_process_welcome(chat_id, user_id, 12):
            LOGGER.info("Skip duplicate welcome event for user %s in chat %s.", user_id, chat_id)
            return
        sent = self.send_welcome(chat_id, user, source=source)
        if not sent and user_id is not None:
            # A service message and a member-state update can arrive close
            # together. Let the second signal retry if the first send failed.
            self.state.release_welcome(chat_id, user_id)

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
            return member.status in {"creator", "administrator"} and as_bool(self.setting(chat_id, "skip_admins", "true"), True)
        except Exception:
            return False

    def user_mention(self, user):
        first_name = getattr(user, "first_name", None) or ""
        last_name = getattr(user, "last_name", None) or ""
        full_name = " ".join(part for part in (first_name, last_name) if part).strip()
        name = full_name or getattr(user, "username", None) or str(user.id)
        return f'<a href="tg://user?id={user.id}">{escape(str(name))}</a>'

    def render_text(self, template, chat_id, user):
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

    def audit(self, chat_id, action, target_user_id="", details="", actor_user_id="bot"):
        try:
            self.store.insert("audit_logs", {
                "chat_id": str(chat_id or ""),
                "actor_user_id": str(actor_user_id or "bot"),
                "action": action,
                "target_user_id": str(target_user_id or ""),
                "details": details,
            })
        except Exception as exc:
            LOGGER.warning("Cannot write welcome audit %s for bot %s: %s", action, self.settings.bot_key, exc)

    def send_welcome(self, chat_id, user, source="service_message"):
        group_row = self.group_row(chat_id, fresh=True)
        if not group_row:
            LOGGER.info("Skip welcome for bot %s in chat %s because no group config exists.", self.settings.bot_key, chat_id)
            self.update_runtime_status(
                welcome_runtime_last_error_at=self.now_iso(),
                welcome_runtime_last_error_message=f"Group {chat_id} chưa có cấu hình Welcome riêng.",
            )
            return False
        if not as_bool(group_row.get("welcome_enabled"), False):
            LOGGER.info("Welcome disabled for bot %s in chat %s.", self.settings.bot_key, chat_id)
            return False

        template = str(group_row.get("welcome_text") or "").strip()
        if not template:
            LOGGER.info("Welcome text missing for bot %s in chat %s.", self.settings.bot_key, chat_id)
            self.update_runtime_status(
                welcome_runtime_last_error_at=self.now_iso(),
                welcome_runtime_last_error_message=f"Group {chat_id} chưa có mẫu tin Welcome riêng.",
            )
            return False

        text = self.render_text(template, chat_id, user)
        if not text.strip():
            LOGGER.info("Rendered welcome text empty for bot %s in chat %s.", self.settings.bot_key, chat_id)
            return False
        try:
            markup = self.parse_buttons(self.buttons_setting(chat_id))
            sent = self.bot.send_message(
                chat_id,
                text,
                parse_mode="HTML",
                reply_markup=markup,
                **self.link_preview_kwargs(True),
            )
            delete_after = as_int(group_row.get("welcome_delete_seconds"), 30)
            if delete_after > 0:
                self.audit(
                    chat_id,
                    "welcome_delete_scheduled",
                    target_user_id=getattr(user, "id", None),
                    details=f"delay_seconds={delete_after},message_id={sent.message_id}",
                )
                self.delete_later(
                    chat_id,
                    sent.message_id,
                    delete_after,
                    "welcome_notice",
                    on_success=lambda: self.audit(
                        chat_id,
                        "welcome_delete_success",
                        target_user_id=getattr(user, "id", None),
                        details=f"message_id={sent.message_id}",
                    ),
                    on_error=lambda exc: self.audit(
                        chat_id,
                        "welcome_delete_failed",
                        target_user_id=getattr(user, "id", None),
                        details=f"message_id={sent.message_id},error={exc}",
                    ),
                )
            LOGGER.info(
                "Welcome sent for bot %s in chat %s to user %s.",
                self.settings.bot_key,
                chat_id,
                getattr(user, "id", None),
            )
            self.audit(
                chat_id,
                "welcome_sent",
                target_user_id=getattr(user, "id", None),
                details=f"source={source},message_id={sent.message_id}",
            )
            self.update_runtime_status(
                welcome_runtime_last_success_at=self.now_iso(),
                welcome_runtime_last_chat_id=str(chat_id or ""),
                welcome_runtime_last_user_id=str(getattr(user, "id", "") or ""),
                welcome_runtime_last_sent_source=source,
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
            self.update_runtime_status(
                welcome_runtime_last_error_at=self.now_iso(),
                welcome_runtime_last_error_message=str(exc),
                welcome_runtime_last_chat_id=str(chat_id or ""),
                welcome_runtime_last_user_id=str(getattr(user, "id", "") or ""),
            )
            return False
