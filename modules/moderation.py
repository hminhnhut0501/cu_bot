import logging
import re
import threading
from datetime import datetime, timedelta
from html import escape
from functools import wraps

import telebot
from telebot.util import content_type_service

from core.utils import as_bool, as_int, normalize_id, normalize_text
from modules.base import BotModule


LOGGER = logging.getLogger(__name__)

SERVICE_CONTENT_TYPES = sorted(set(content_type_service + [
    "new_chat_members",
    "left_chat_member",
    "new_chat_title",
    "new_chat_photo",
    "delete_chat_photo",
    "group_chat_created",
    "supergroup_chat_created",
    "channel_chat_created",
    "migrate_to_chat_id",
    "migrate_from_chat_id",
    "pinned_message",
    "message_auto_delete_timer_changed",
    "forum_topic_created",
    "forum_topic_closed",
    "forum_topic_reopened",
    "forum_topic_edited",
    "general_forum_topic_hidden",
    "general_forum_topic_unhidden",
    "write_access_allowed",
    "user_shared",
    "users_shared",
    "chat_shared",
]))

MESSAGE_CONTENT_TYPES = [
    "text",
    "audio",
    "document",
    "photo",
    "sticker",
    "video",
    "video_note",
    "voice",
    "location",
    "contact",
    "animation",
    "dice",
    "poll",
    "venue",
]


class ModerationModule(BotModule):
    name = "moderation"
    priority = 10
    BIO_LINK_PATTERN = re.compile(r"(?i)(?:https?://)?(?:t\.me|telegram\.me|telegram\.dog)/[^\s]+")

    def register(self):
        self.bot.message_handler(content_types=SERVICE_CONTENT_TYPES)(self.handle_service_message)
        self.bot.message_handler(commands=["policy", "rules", "quydinh", "noiquy"])(self.handle_policy)
        self.bot.message_handler(commands=["warn", "canhbao"])(self.admin_only(self.handle_warn_command))
        self.bot.message_handler(commands=["ban", "cam"])(self.admin_only(self.handle_ban_command))
        self.bot.message_handler(commands=["unban", "bocam"])(self.admin_only(self.handle_unban_command))
        self.bot.message_handler(commands=["checkbio", "scanbio", "kiemtrabio"])(self.admin_only(self.handle_check_bio_command))
        self.bot.message_handler(commands=["debuggroup", "groupdebug", "kiemtragroup"])(self.admin_only(self.handle_debug_group_command))
        self.bot.message_handler(commands=["reload", "refresh"])(self.admin_only(self.handle_reload_command))
        self.bot.message_handler(
            func=lambda message: normalize_text(getattr(message, "text", "")) in {"quy dinh", "noi quy"},
            content_types=["text"],
        )(self.handle_policy_text)
        self.bot.message_handler(
            func=lambda message: not self.is_command_message(message),
            content_types=MESSAGE_CONTENT_TYPES,
        )(self.handle_group_message)

    def admin_only(self, handler):
        @wraps(handler)
        def wrapped(message):
            if self.is_admin(message.chat.id, message.from_user.id):
                return handler(message)
            self.safe_reply(message, "Lệnh này chỉ dành cho quản trị viên.")
            return None

        return wrapped

    def handle_service_message(self, message):
        chat_id = message.chat.id
        LOGGER.info(
            "Service message received: chat_id=%s message_id=%s content_type=%s",
            chat_id,
            message.message_id,
            message.content_type,
        )
        if self.setting_bool(chat_id, "delete_system_messages", True):
            self.safe_delete(message, f"service:{message.content_type}")

        if message.content_type == "new_chat_members":
            self.handle_new_members(message)

    def handle_new_members(self, message):
        for user in message.new_chat_members or []:
            if getattr(user, "is_bot", False) and not self.bot_allowed(message.chat.id, user):
                if self.setting_bool(message.chat.id, "remove_unknown_bots", True):
                    try:
                        self.bot.ban_chat_member(message.chat.id, user.id)
                        LOGGER.info("Removed unknown bot %s from chat %s", user.id, message.chat.id)
                    except Exception as exc:
                        LOGGER.warning("Cannot remove bot %s from %s: %s", user.id, message.chat.id, exc)
                continue
            self.detect_bio_link(message.chat.id, user)

    def handle_policy(self, message):
        self.send_policy(message.chat.id, message.message_id)

    def handle_policy_text(self, message):
        self.send_policy(message.chat.id, message.message_id)

    def handle_reload_command(self, message):
        self.sheets._cache.clear()
        self.safe_reply(message, "Đã tải lại cấu hình từ Google Sheet.")

    def handle_warn_command(self, message):
        target_id = self.target_user_id(message)
        if not target_id:
            self.safe_reply(message, "Hãy reply thành viên cần cảnh báo hoặc ghi /warn <user_id>.")
            return
        target_user = getattr(getattr(message, "reply_to_message", None), "from_user", None)
        count = self.warn_user(message.chat.id, target_id, reason=self.command_reason(message), user=target_user)
        self.safe_reply(message, f"Đã cảnh báo user {target_id}. Tổng cảnh báo: {count}.")

    def handle_ban_command(self, message):
        target_id = self.target_user_id(message)
        if not target_id:
            self.safe_reply(message, "Hãy reply thành viên cần cấm hoặc ghi /ban <user_id>.")
            return
        self.ban_user(message.chat.id, target_id)
        self.safe_reply(message, f"Đã cấm user {target_id}.")

    def handle_unban_command(self, message):
        target_id = self.target_user_id(message)
        if not target_id:
            self.safe_reply(message, "Hãy ghi /unban <user_id>.")
            return
        try:
            self.bot.unban_chat_member(message.chat.id, target_id, only_if_banned=True)
            self.state.reset_warnings(message.chat.id, target_id)
            self.safe_reply(message, f"Đã bỏ cấm user {target_id}.")
        except Exception as exc:
            self.safe_reply(message, f"Không thể bỏ cấm: {exc}")

    def handle_check_bio_command(self, message):
        target_id = self.target_user_id(message)
        if not target_id:
            self.safe_reply(message, "Hãy reply thành viên cần quét bio hoặc ghi /checkbio <user_id>.")
            return

        user = getattr(getattr(message, "reply_to_message", None), "from_user", None)
        if not user or user.id != target_id:
            user = type("BioTarget", (), {"id": target_id, "is_bot": False, "first_name": str(target_id)})()

        has_link = self.detect_bio_link(message.chat.id, user, force=True, notify=True)
        if has_link:
            self.safe_reply(message, f"User {target_id} vẫn có link Telegram trong bio, đã bị cấm chat.")
            return

        self.restore_chat_permissions(message.chat.id, target_id)
        self.safe_reply(message, f"Bio user {target_id} đã sạch, đã mở chat lại.")

    def handle_debug_group_command(self, message):
        bot_user = self.bot.get_me()
        try:
            bot_member = self.bot.get_chat_member(message.chat.id, bot_user.id)
        except Exception as exc:
            self.safe_reply(message, f"Không đọc được quyền bot trong group này: {exc}")
            return

        lines = [
            "Debug group:",
            f"chat_id: {message.chat.id}",
            f"bot_id: {bot_user.id}",
            f"bot_status: {getattr(bot_member, 'status', '-')}",
            f"can_delete_messages: {getattr(bot_member, 'can_delete_messages', '-')}",
            f"can_restrict_members: {getattr(bot_member, 'can_restrict_members', '-')}",
            f"moderation_enabled: {self.setting_bool(message.chat.id, 'moderation_enabled', True)}",
            f"delete_system_messages: {self.setting_bool(message.chat.id, 'delete_system_messages', True)}",
            f"delete_messages_from_bots: {self.setting_bool(message.chat.id, 'delete_messages_from_bots', True)}",
            f"spam_max_messages: {self.setting_int(message.chat.id, 'spam_max_messages', 6)}",
            f"spam_window_seconds: {self.setting_int(message.chat.id, 'spam_window_seconds', 12)}",
            f"delete_forwarded_messages: {self.setting_bool(message.chat.id, 'delete_forwarded_messages', True)}",
            f"delete_inline_keyboard_messages: {self.setting_bool(message.chat.id, 'delete_inline_keyboard_messages', True)}",
            f"scan_bio_links: {self.setting_bool(message.chat.id, 'scan_bio_links', True)}",
            f"bio_link_delete_message: {self.setting_bool(message.chat.id, 'bio_link_delete_message', True)}",
        ]
        self.safe_reply(message, "\n".join(lines))

    def handle_group_message(self, message):
        if not self.moderation_enabled(message.chat.id):
            return
        if self.is_anonymous_admin_message(message):
            self.state.mark_activity(message.chat.id)
            return
        if getattr(message.from_user, "is_bot", False):
            if self.setting_bool(message.chat.id, "delete_messages_from_bots", True) and not self.bot_allowed(message.chat.id, message.from_user):
                self.safe_delete(message, "bot_message")
            return

        self.state.mark_activity(message.chat.id)

        if self.is_admin(message.chat.id, message.from_user.id) and self.setting_bool(message.chat.id, "exempt_admins", True):
            return

        if self.detect_bio_link(message.chat.id, message.from_user):
            if self.setting_bool(message.chat.id, "bio_link_delete_message", True):
                self.delete_violation_message(message, "bio_link")
            return
        if self.detect_spam(message):
            return
        if self.detect_content_spam(message):
            return
        if self.detect_forbidden_keyword(message):
            return
        if self.detect_forward(message):
            return
        if self.detect_inline_keyboard(message):
            return

    def is_command_message(self, message):
        text = getattr(message, "text", None) or ""
        return text.strip().startswith("/")

    def is_anonymous_admin_message(self, message):
        sender_chat = getattr(message, "sender_chat", None)
        if not sender_chat:
            return False
        if getattr(sender_chat, "id", None) == getattr(message.chat, "id", None):
            return True
        sender_type = getattr(sender_chat, "type", "")
        return sender_type in {"channel", "supergroup", "group"}

    def detect_spam(self, message):
        limit = self.setting_int(message.chat.id, "spam_max_messages", 6)
        window = self.setting_int(message.chat.id, "spam_window_seconds", 12)
        if limit <= 0 or window <= 0:
            return False
        count = self.state.add_user_message(message.chat.id, message.from_user.id, window)
        if count <= limit:
            return False
        self.delete_violation_message(message, "spam")
        action = self.setting(message.chat.id, "spam_action", "warn")
        self.apply_action(message, action, "Gửi quá nhiều tin trong thời gian ngắn.")
        return True

    def detect_content_spam(self, message):
        content_type = getattr(message, "content_type", "")
        if content_type not in {"sticker", "animation", "photo", "video", "video_note", "voice", "document"}:
            return False

        limit = self.setting_int(message.chat.id, f"{content_type}_spam_max_messages", None)
        if limit is None:
            limit = self.setting_int(message.chat.id, "media_spam_max_messages", 3)
        window = self.setting_int(message.chat.id, "media_spam_window_seconds", 10)
        if limit <= 0 or window <= 0:
            return False

        count = self.state.add_user_content_message(message.chat.id, message.from_user.id, content_type, window)
        if count <= limit:
            return False

        self.delete_violation_message(message, f"{content_type}_spam")
        action = self.setting(message.chat.id, "media_spam_action", "restrict")
        reason = f"Gửi quá nhiều {content_type} trong thời gian ngắn."
        if action == "restrict":
            self.restrict_user_for_spam(message.chat.id, message.from_user.id)
            self.notify_temporary_restrict(message.chat.id, message.from_user, reason)
            return True

        self.apply_action(message, action, reason)
        return True

    def detect_forbidden_keyword(self, message):
        text = self.message_text(message)
        if not text:
            return False
        normalized = normalize_text(text)
        for row in self.sheets.enabled_rows("keywords"):
            keyword = normalize_text(row.get("keyword") or row.get("word"))
            if not keyword:
                continue
            match_type = (row.get("match") or "contains").strip().lower()
            matched = bool(re.search(keyword, normalized)) if match_type == "regex" else keyword in normalized
            if matched:
                action = row.get("action") or "warn"
                self.delete_violation_message(message, f"keyword:{keyword}:before_{action}")
                self.apply_action(message, action, row.get("reason") or "Từ khóa cấm.")
                return True
        return False

    def detect_forward(self, message):
        if not self.setting_bool(message.chat.id, "delete_forwarded_messages", True):
            return False
        forwarded = any(
            getattr(message, attr, None)
            for attr in ("forward_from", "forward_from_chat", "forward_sender_name", "forward_origin")
        )
        if not forwarded:
            return False
        self.delete_violation_message(message, "forwarded_message")
        reason = self.setting(message.chat.id, "forward_warning_reason", "Không được forward video/bài vào nhóm.")
        self.apply_action(message, self.setting(message.chat.id, "forward_action", "warn"), reason)
        return True

    def detect_inline_keyboard(self, message):
        if not self.setting_bool(message.chat.id, "delete_inline_keyboard_messages", True):
            return False
        markup = getattr(message, "reply_markup", None)
        if not markup or not getattr(markup, "keyboard", None) and not getattr(markup, "inline_keyboard", None):
            return False
        self.delete_violation_message(message, "inline_keyboard")
        self.apply_action(message, self.setting(message.chat.id, "inline_keyboard_action", "warn"), "Không được gửi bài có nút bấm.")
        return True

    def detect_bio_link(self, chat_id, user, force=False, notify=True):
        if not self.setting_bool(chat_id, "scan_bio_links", True):
            return False
        if getattr(user, "is_bot", False):
            return False

        ttl_seconds = self.setting_int(chat_id, "bio_scan_cache_seconds", 3600)
        if not force and ttl_seconds > 0:
            cached = self.state.cached_bio_scan(chat_id, user.id, ttl_seconds)
            if cached is not None:
                if cached:
                    self.restrict_user_chat(chat_id, user.id)
                    if notify:
                        self.notify_bio_link_violation(chat_id, user)
                return cached

        bio = self.get_user_bio(user.id)
        has_link = bool(bio and self.BIO_LINK_PATTERN.search(bio))
        self.state.set_bio_scan(chat_id, user.id, has_link)
        if not has_link:
            return False

        self.restrict_user_chat(chat_id, user.id)
        if notify:
            self.notify_bio_link_violation(chat_id, user)
        return True

    def get_user_bio(self, user_id):
        try:
            chat = self.bot.get_chat(user_id)
            return getattr(chat, "bio", "") or ""
        except Exception as exc:
            LOGGER.debug("Cannot read bio for user %s: %s", user_id, exc)
            return ""

    def restrict_user_chat(self, chat_id, user_id):
        seconds = self.setting_int(chat_id, "bio_link_restrict_seconds", 0)
        until_date = None
        if seconds > 0:
            until_date = datetime.now() + timedelta(seconds=seconds)
        permissions = telebot.types.ChatPermissions(
            can_send_messages=False,
            can_send_audios=False,
            can_send_documents=False,
            can_send_photos=False,
            can_send_videos=False,
            can_send_video_notes=False,
            can_send_voice_notes=False,
            can_send_polls=False,
            can_send_other_messages=False,
            can_add_web_page_previews=False,
        )
        try:
            self.bot.restrict_chat_member(
                chat_id,
                user_id,
                until_date=until_date,
                permissions=permissions,
                use_independent_chat_permissions=True,
            )
        except Exception as exc:
            LOGGER.warning("Cannot restrict user %s in %s for bio link: %s", user_id, chat_id, exc)

    def restore_chat_permissions(self, chat_id, user_id):
        permissions = telebot.types.ChatPermissions(
            can_send_messages=True,
            can_send_audios=True,
            can_send_documents=True,
            can_send_photos=True,
            can_send_videos=True,
            can_send_video_notes=True,
            can_send_voice_notes=True,
            can_send_polls=True,
            can_send_other_messages=True,
            can_add_web_page_previews=True,
            can_invite_users=True,
        )
        try:
            self.bot.restrict_chat_member(
                chat_id,
                user_id,
                permissions=permissions,
                use_independent_chat_permissions=True,
            )
        except Exception as exc:
            LOGGER.warning("Cannot restore permissions for user %s in %s: %s", user_id, chat_id, exc)

    def notify_bio_link_violation(self, chat_id, user):
        mention = self.user_mention(user)
        text = self.setting(
            chat_id,
            "bio_link_warning_text",
            "{mention} vui lòng gỡ link Telegram trong bio rồi liên hệ admin để mở chat lại.",
        )
        try:
            sent = self.bot.send_message(chat_id, text.format(mention=mention, user_id=user.id))
            delete_after = self.setting_int(chat_id, "bio_link_notice_delete_seconds", 30)
            if delete_after > 0:
                self.delete_later(chat_id, sent.message_id, delete_after, "bio_link_notice")
        except Exception as exc:
            LOGGER.warning("Cannot notify bio violation in %s: %s", chat_id, exc)

    def user_mention(self, user):
        first_name = getattr(user, "first_name", None) or ""
        last_name = getattr(user, "last_name", None) or ""
        full_name = " ".join(part for part in (first_name, last_name) if part).strip()
        name = full_name or getattr(user, "username", None) or str(user.id)
        return f'<a href="tg://user?id={user.id}">{escape(str(name))}</a>'

    def restrict_user_for_spam(self, chat_id, user_id):
        seconds = self.setting_int(chat_id, "spam_restrict_seconds", 300)
        until_date = datetime.now() + timedelta(seconds=seconds) if seconds > 0 else None
        permissions = telebot.types.ChatPermissions(can_send_messages=False)
        try:
            self.bot.restrict_chat_member(
                chat_id,
                user_id,
                until_date=until_date,
                permissions=permissions,
                use_independent_chat_permissions=True,
            )
        except Exception as exc:
            LOGGER.warning("Cannot restrict spammer %s in %s: %s", user_id, chat_id, exc)

    def notify_temporary_restrict(self, chat_id, user, reason):
        text = self.setting(
            chat_id,
            "spam_restrict_text",
            "{mention} bị tạm cấm chat vì {reason}",
        )
        try:
            sent = self.bot.send_message(chat_id, text.format(mention=self.user_mention(user), user_id=user.id, reason=reason))
            delete_after = self.setting_int(chat_id, "spam_notice_delete_seconds", 20)
            if delete_after > 0:
                self.delete_later(chat_id, sent.message_id, delete_after, "spam_notice")
        except Exception as exc:
            LOGGER.warning("Cannot send spam restrict notice in %s: %s", chat_id, exc)

    def delete_later(self, chat_id, message_id, delay_seconds, reason):
        def worker():
            try:
                self.bot.delete_message(chat_id, message_id)
                LOGGER.info("Deleted delayed notice: chat_id=%s message_id=%s reason=%s", chat_id, message_id, reason)
            except Exception as exc:
                LOGGER.warning("Cannot delete delayed notice: chat_id=%s message_id=%s reason=%s error=%s", chat_id, message_id, reason, exc)

        timer = threading.Timer(delay_seconds, worker)
        timer.daemon = True
        timer.start()

    def delete_violation_message(self, message, reason):
        deleted = self.safe_delete(message, reason)
        retry_seconds = self.setting_int(message.chat.id, "violation_delete_retry_seconds", 2)
        if not deleted and retry_seconds > 0:
            self.delete_later(message.chat.id, message.message_id, retry_seconds, f"{reason}:retry")

    def apply_action(self, message, action, reason):
        action = (action or "warn").strip().lower()
        if action == "delete":
            return
        if action == "ban":
            self.ban_user(message.chat.id, message.from_user.id)
            return
        if action == "warn":
            self.warn_user(message.chat.id, message.from_user.id, reason, user=message.from_user)

    def warn_user(self, chat_id, user_id, reason="", user=None):
        count = self.state.add_warning(chat_id, user_id)
        ban_after = self.setting_int(chat_id, "ban_after_warnings", 3)
        if ban_after and count >= ban_after:
            self.ban_user(chat_id, user_id)
            return count

        text = self.setting(chat_id, "warning_text", "Cảnh báo {mention}: {reason} ({count}/{limit})")
        if reason == self.setting(chat_id, "forward_warning_reason", "Không được forward video/bài vào nhóm."):
            text = self.setting(chat_id, "forward_warning_text", text)
        mention = self.user_mention(user) if user else str(user_id)
        is_forward_warning = reason == self.setting(chat_id, "forward_warning_reason", "Không được forward video/bài vào nhóm.")
        try:
            sent = self.bot.send_message(
                chat_id,
                text.format(
                    mention=mention,
                    user_id=user_id,
                    reason=reason,
                    count=count,
                    limit=ban_after or "-",
                ),
            )
            delete_after_key = "forward_warning_delete_seconds" if is_forward_warning else "warning_notice_delete_seconds"
            delete_after = self.setting_int(chat_id, delete_after_key, 180)
            if delete_after > 0:
                self.delete_later(chat_id, sent.message_id, delete_after, "warning_notice")
        except Exception as exc:
            LOGGER.warning("Cannot send warning in %s: %s", chat_id, exc)
        return count

    def ban_user(self, chat_id, user_id):
        try:
            self.bot.ban_chat_member(chat_id, user_id)
            self.state.reset_warnings(chat_id, user_id)
        except Exception as exc:
            LOGGER.warning("Cannot ban %s in %s: %s", user_id, chat_id, exc)

    def safe_delete(self, message, reason="unknown"):
        try:
            self.bot.delete_message(message.chat.id, message.message_id)
            LOGGER.info(
                "Deleted message: chat_id=%s message_id=%s content_type=%s reason=%s",
                message.chat.id,
                message.message_id,
                getattr(message, "content_type", "-"),
                reason,
            )
            return True
        except Exception as exc:
            LOGGER.warning(
                "Cannot delete message: chat_id=%s message_id=%s content_type=%s reason=%s error=%s",
                message.chat.id,
                message.message_id,
                getattr(message, "content_type", "-"),
                reason,
                exc,
            )
            return False

    def safe_reply(self, message, text):
        try:
            self.bot.reply_to(message, text)
        except Exception as exc:
            LOGGER.warning("Cannot reply in %s: %s", message.chat.id, exc)

    def send_policy(self, chat_id, reply_to_message_id=None):
        text = self.setting(chat_id, "policy_text", None) or self.sheets.value(
            "policy_text",
            "Quy định nhóm:\n1. Tôn trọng thành viên.\n2. Không spam/quảng cáo.\n3. Không gửi nội dung cấm.",
        )
        try:
            self.bot.send_message(chat_id, text, reply_to_message_id=reply_to_message_id)
        except Exception as exc:
            LOGGER.warning("Cannot send policy to %s: %s", chat_id, exc)

    def group_enabled(self, chat_id):
        rows = self.sheets.enabled_rows("groups")
        if not rows:
            return True
        chat_id = str(chat_id)
        return any(normalize_id(row.get("group_id") or row.get("chat_id")) == chat_id for row in rows)

    def moderation_enabled(self, chat_id):
        return self.setting_bool(chat_id, "moderation_enabled", True)

    def group_row(self, chat_id):
        chat_id = str(chat_id)
        for row in self.sheets.enabled_rows("groups"):
            if normalize_id(row.get("group_id") or row.get("chat_id")) == chat_id:
                return row
        return {}

    def setting(self, chat_id, key, default=None):
        row = self.group_row(chat_id)
        if row.get(key) not in (None, ""):
            return row.get(key)
        return self.sheets.value(key, default)

    def setting_bool(self, chat_id, key, default=False):
        return as_bool(self.setting(chat_id, key, default), default)

    def setting_int(self, chat_id, key, default=0):
        return as_int(self.setting(chat_id, key, default), default)

    def bot_allowed(self, chat_id, user):
        if getattr(user, "id", None) == self.bot.get_me().id:
            return True
        rows = self.sheets.enabled_rows("bot_allowlist")
        if not rows:
            return False
        username = (getattr(user, "username", "") or "").lstrip("@").lower()
        for row in rows:
            row_chat = row.get("chat_id") or row.get("group_id")
            if row_chat and row_chat != str(chat_id):
                continue
            if row.get("bot_id") and row.get("bot_id") == str(user.id):
                return True
            if row.get("username") and row.get("username").lstrip("@").lower() == username:
                return True
        return False

    def is_admin(self, chat_id, user_id):
        if int(user_id) in self.settings.owner_ids:
            return True
        for row in self.sheets.enabled_rows("admins"):
            row_chat = row.get("chat_id") or row.get("group_id")
            if row_chat and row_chat != str(chat_id):
                continue
            if row.get("user_id") == str(user_id):
                return True
        try:
            member = self.bot.get_chat_member(chat_id, user_id)
            return member.status in {"creator", "administrator"}
        except Exception:
            return False

    def target_user_id(self, message):
        if getattr(message, "reply_to_message", None) and message.reply_to_message.from_user:
            return message.reply_to_message.from_user.id
        parts = (message.text or "").split()
        if len(parts) >= 2:
            return as_int(parts[1], None)
        return None

    def command_reason(self, message):
        parts = (message.text or "").split(maxsplit=2)
        return parts[2] if len(parts) >= 3 else ""

    def message_text(self, message):
        return "\n".join(
            part
            for part in (
                getattr(message, "text", None),
                getattr(message, "caption", None),
            )
            if part
        )
