import logging
import json
import random
import re
import threading
from datetime import datetime, timedelta
from html import escape
from functools import wraps
from urllib.parse import urlparse

import telebot
from telebot.util import content_type_service

from core.utils import as_bool, as_int, normalize_id, normalize_text
from modules.base import BotModule

try:
    from telebot.handler_backends import ContinueHandling
except ImportError:  # pragma: no cover - compatibility with old TeleBot builds
    ContinueHandling = None


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
    "story",
]


class ModerationModule(BotModule):
    MODULE_SETTING_KEYS = {
        "moderation_enabled",
        "delete_system_messages",
        "delete_forwarded_messages",
        "allow_forward_messages",
        "allow_automatic_forwards",
        "delete_inline_keyboard_messages",
        "delete_messages_from_bots",
        "remove_unknown_bots",
        "exempt_admins",
        "spam_max_messages",
        "spam_window_seconds",
        "spam_action",
        "spam_restrict_seconds",
        "forward_action",
        "forward_allowed_sources",
        "forward_allowed_content_types",
        "forward_spam_max_messages",
        "forward_spam_window_seconds",
        "inline_keyboard_action",
        "ban_after_warnings",
        "ban_seconds",
        "warning_text",
        "forward_warning_reason",
        "forward_warning_text",
        "spam_restrict_text",
        "warning_notice_delete_seconds",
        "forward_warning_delete_seconds",
        "spam_notice_delete_seconds",
        "violation_delete_retry_seconds",
        "forward_violation_restrict_after",
        "forward_violation_ban_after",
        "duplicate_message_enabled",
        "duplicate_message_max_count",
        "duplicate_message_window_seconds",
        "duplicate_message_action",
        "duplicate_message_reason",
        "scan_bio_links",
        "bio_link_delete_message",
        "bio_link_restrict_seconds",
        "bio_scan_cache_seconds",
        "bio_link_warning_text",
        "bio_link_notice_delete_seconds",
        "media_spam_max_messages",
        "media_spam_window_seconds",
        "media_spam_action",
        "scan_hidden_links",
        "scan_text_link",
        "scan_text_mention",
        "allow_in_group_mentions",
        "hidden_link_action",
        "text_link_action",
        "text_mention_action",
        "hidden_link_reason",
        "hidden_link_delete_notice_seconds",
    }

    name = "moderation"
    priority = 0
    BIO_LINK_PATTERN = re.compile(r"(?i)(?:https?://)?(?:t\.me|telegram\.me|telegram\.dog)/[^\s]+")
    URL_PATTERN = re.compile(r"(?i)\b(?:https?://)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:/[^\s]*)?")

    def is_enabled(self):
        return self.module_enabled("moderation", True)

    def module_enabled(self, module_key, default=True):
        for row in self.store.rows("module_settings"):
            if (row.get("module_key") or "").strip() == module_key:
                return as_bool(row.get("enabled"), default)
        return default

    def register(self):
        self.bot.message_handler(content_types=SERVICE_CONTENT_TYPES)(self.active(self.handle_service_message))
        self.bot.my_chat_member_handler()(self.active(self.handle_my_chat_member))
        self.bot.message_handler(commands=["policy", "rules", "quydinh", "noiquy"])(self.active(self.handle_policy))
        self.bot.message_handler(commands=["warn", "canhbao"])(self.active(self.admin_only(self.handle_warn_command)))
        self.bot.message_handler(commands=["ban", "cam"])(self.active(self.admin_only(self.handle_ban_command)))
        self.bot.message_handler(commands=["unban", "bocam"])(self.active(self.admin_only(self.handle_unban_command)))
        self.bot.message_handler(commands=["checkbio", "scanbio", "kiemtrabio"])(self.active(self.admin_only(self.handle_check_bio_command)))
        self.bot.message_handler(commands=["debuggroup", "groupdebug", "kiemtragroup"])(self.active(self.admin_only(self.handle_debug_group_command)))
        self.bot.message_handler(commands=["reload", "refresh"])(self.active(self.admin_only(self.handle_reload_command)))
        self.bot.message_handler(
            func=lambda message: normalize_text(getattr(message, "text", "")) in {"quy dinh", "noi quy"},
            content_types=["text"],
        )(self.active(self.handle_policy_text))
        self.bot.message_handler(
            func=lambda message: not self.is_command_message(message),
            content_types=MESSAGE_CONTENT_TYPES,
        )(self.active(self.handle_group_message))

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
        delete_service_message = self.setting_bool(chat_id, "delete_system_messages", True) or self.is_bot_membership_service_message(message)
        if delete_service_message:
            deleted = self.safe_delete(message, f"service:{message.content_type}")
            if not deleted:
                retry_seconds = self.setting_int(chat_id, "violation_delete_retry_seconds", 2)
                if retry_seconds > 0:
                    self.delete_later(chat_id, message.message_id, retry_seconds, f"service:{message.content_type}:retry")

        if message.content_type == "new_chat_members":
            self.handle_new_members(message)
        return self.continue_handling()

    @staticmethod
    def continue_handling():
        return ContinueHandling() if ContinueHandling is not None else None

    def is_bot_membership_service_message(self, message):
        if message.content_type == "new_chat_members":
            return any(getattr(user, "is_bot", False) for user in message.new_chat_members or [])
        if message.content_type == "left_chat_member":
            left_member = getattr(message, "left_chat_member", None)
            return bool(getattr(left_member, "is_bot", False))
        return False

    def handle_my_chat_member(self, update):
        chat = getattr(update, "chat", None)
        new_member = getattr(update, "new_chat_member", None)
        old_member = getattr(update, "old_chat_member", None)
        if not chat or not new_member:
            return

        bot_user = self.bot.get_me()
        member_user = getattr(new_member, "user", None)
        if not member_user or getattr(member_user, "id", None) != getattr(bot_user, "id", None):
            return

        chat_type = getattr(chat, "type", "")
        if chat_type not in {"group", "supergroup", "channel"}:
            return

        status = (getattr(new_member, "status", "") or "").strip().lower()
        old_status = (getattr(old_member, "status", "") or "").strip().lower()
        if status not in {"member", "administrator", "restricted"} and old_status in {"left", "kicked"}:
            return

        self.sync_discovered_group(chat, status=status, old_status=old_status)

    def sync_discovered_group(self, chat, status="", old_status=""):
        group_id = str(getattr(chat, "id", "") or "").strip()
        if not group_id:
            return

        group_name = (
            getattr(chat, "title", None)
            or getattr(chat, "username", None)
            or getattr(chat, "first_name", None)
            or group_id
        )
        note = f"Auto-discovered from my_chat_member ({old_status or 'unknown'} -> {status or 'unknown'})."

        try:
            existing = None
            for row in self.store.rows("groups"):
                row_group_id = str(row.get("group_id") or row.get("chat_id") or "").strip()
                if row_group_id == group_id and (row.get("bot_key") or self.settings.bot_key) == self.settings.bot_key:
                    existing = row
                    break

            payload = {
                "bot_key": self.settings.bot_key,
                "group_id": group_id,
                "group_name": group_name,
                "notes": note,
            }

            if existing:
                updates = {}
                if group_name and group_name != existing.get("group_name"):
                    updates["group_name"] = group_name
                if note and note != existing.get("notes"):
                    updates["notes"] = note
                if updates:
                    self.store.update("groups", existing["id"], updates)
            else:
                payload["enabled"] = True
                self.store.insert("groups", payload)
        except Exception as exc:
            LOGGER.warning("Cannot sync discovered group %s: %s", group_id, exc)

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
            if self.admin_exempt(message.chat.id, getattr(user, "id", None)):
                continue
            self.start_verification(message.chat.id, user)
            self.detect_bio_link(message.chat.id, user)

    def handle_policy(self, message):
        self.send_policy(message.chat.id, message.message_id)

    def handle_policy_text(self, message):
        self.send_policy(message.chat.id, message.message_id)

    def handle_reload_command(self, message):
        self.store._cache.clear()
        self.safe_reply(message, "Đã tải lại cấu hình.")

    def handle_warn_command(self, message):
        target_id = self.target_user_id(message)
        if not target_id:
            self.safe_reply(message, "Hãy reply thành viên cần cảnh báo hoặc ghi /warn <user_id>.")
            return
        target_user = getattr(getattr(message, "reply_to_message", None), "from_user", None)
        count = self.warn_user(
            message.chat.id,
            target_id,
            reason=self.command_reason(message),
            user=target_user,
            actor_user_id=getattr(message.from_user, "id", ""),
            trigger="admin_command",
        )
        self.safe_reply(message, f"Đã cảnh báo user {target_id}. Tổng cảnh báo: {count}.")

    def handle_ban_command(self, message):
        target_id = self.target_user_id(message)
        if not target_id:
            self.safe_reply(message, "Hãy reply thành viên cần cấm hoặc ghi /ban <user_id>.")
            return
        self.ban_user(
            message.chat.id,
            target_id,
            reason=self.command_reason(message) or "Admin command",
            actor_user_id=getattr(message.from_user, "id", ""),
            trigger="admin_command",
        )
        self.safe_reply(message, f"Đã cấm user {target_id}.")

    def handle_unban_command(self, message):
        target_id = self.target_user_id(message)
        if not target_id:
            self.safe_reply(message, "Hãy ghi /unban <user_id>.")
            return
        try:
            self.bot.unban_chat_member(message.chat.id, target_id, only_if_banned=True)
            self.state.reset_warnings(message.chat.id, target_id)
            self.audit(
                message.chat.id,
                "unban",
                target_user_id=target_id,
                actor_user_id=getattr(message.from_user, "id", ""),
                details=self.audit_details(reason="Admin command", trigger="admin_command"),
            )
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
        if self.is_automatic_forward_allowed(message):
            self.state.mark_activity(message.chat.id)
            return
        if self.is_anonymous_admin_message(message):
            self.state.mark_activity(message.chat.id)
            return
        from_user = getattr(message, "from_user", None)
        if from_user and self.admin_exempt(message.chat.id, from_user.id):
            self.state.mark_activity(message.chat.id)
            return
        if from_user and self.handle_verification_answer(message):
            return
        if not from_user:
            self.state.mark_activity(message.chat.id)
            if self.detect_forward(message):
                return
            return
        via_bot = getattr(message, "via_bot", None)
        if via_bot and getattr(via_bot, "is_bot", False):
            if self.setting_bool(message.chat.id, "delete_messages_from_bots", True) and not self.bot_allowed(message.chat.id, via_bot):
                self.safe_delete(message, "bot_message")
            return
        if getattr(message.from_user, "is_bot", False):
            if self.setting_bool(message.chat.id, "delete_messages_from_bots", True) and not self.bot_allowed(message.chat.id, message.from_user):
                self.safe_delete(message, "bot_message")
            return

        self.state.mark_activity(message.chat.id)

        if self.detect_bio_link(message.chat.id, message.from_user):
            if self.setting_bool(message.chat.id, "bio_link_delete_message", True):
                bio = self.get_user_bio(message.from_user.id)
                self.delete_violation_message(
                    message,
                    "bio_link",
                    reason_label="Bio có link Telegram",
                    bio_link=self.extract_bio_link(bio),
                    bio_text=self.truncate_text(bio, 500),
                )
            return
        if self.detect_duplicate_message(message):
            return
        if self.detect_spam(message):
            return
        if self.detect_content_spam(message):
            return
        if self.detect_hidden_links_and_mentions(message):
            return
        if self.detect_blacklisted_link(message):
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
        # Chỉ bỏ qua khi đúng anonymous admin của chính group hiện tại.
        # Nếu sender_chat là channel/group bên ngoài thì vẫn phải đi qua luồng kiểm duyệt.
        return getattr(sender_chat, "id", None) == getattr(message.chat, "id", None)

    def admin_exempt(self, chat_id, user_id):
        if not user_id or not self.setting_bool(chat_id, "exempt_admins", True):
            return False
        return self.is_admin(chat_id, user_id)

    def detect_spam(self, message):
        limit = self.setting_int(message.chat.id, "spam_max_messages", 6)
        window = self.setting_int(message.chat.id, "spam_window_seconds", 12)
        if limit <= 0 or window <= 0:
            return False
        count = self.state.add_user_message(message.chat.id, message.from_user.id, window)
        if count <= limit:
            return False
        self.delete_violation_message(message, "spam", reason_label="Spam quá ngưỡng")
        action = self.setting(message.chat.id, "spam_action", "warn")
        self.apply_action(message, action, "Gửi quá nhiều tin trong thời gian ngắn.")
        return True

    def detect_duplicate_message(self, message):
        if not self.setting_bool(message.chat.id, "duplicate_message_enabled", True):
            return False

        fingerprint = self.duplicate_fingerprint(message)
        if not fingerprint:
            return False

        limit = self.setting_int(message.chat.id, "duplicate_message_max_count", 3)
        window = self.setting_int(message.chat.id, "duplicate_message_window_seconds", 600)
        if limit <= 0 or window <= 0:
            return False

        count = self.state.add_user_duplicate_message(message.chat.id, message.from_user.id, fingerprint, window)
        if count < limit:
            return False

        self.delete_violation_message(message, "duplicate_message", reason_label="Tin nhắn trùng lặp nhiều lần")
        action = self.setting(message.chat.id, "duplicate_message_action", "warn")
        reason = self.setting(
            message.chat.id,
            "duplicate_message_reason",
            "Gửi nội dung hoặc sticker giống nhau nhiều lần.",
        )
        self.apply_action(message, action, reason)
        return True

    def duplicate_fingerprint(self, message):
        content_type = getattr(message, "content_type", "")
        if content_type == "text":
            text = normalize_text(getattr(message, "text", "") or "")
            return f"text:{text}" if text else ""
        if content_type == "sticker":
            sticker = getattr(message, "sticker", None)
            unique_id = getattr(sticker, "file_unique_id", None) or getattr(sticker, "file_id", None)
            return f"sticker:{unique_id}" if unique_id else ""
        return ""

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

        self.delete_violation_message(message, f"{content_type}_spam", reason_label=f"Gửi quá nhiều {content_type}")
        action = self.setting(message.chat.id, "media_spam_action", "restrict")
        reason = f"Gửi quá nhiều {content_type} trong thời gian ngắn."
        if action == "restrict":
            self.restrict_user_for_spam(message.chat.id, message.from_user.id, reason=reason, trigger=f"{content_type}_spam")
            self.notify_temporary_restrict(message.chat.id, message.from_user, reason)
            return True

        self.apply_action(message, action, reason)
        return True

    def detect_forbidden_keyword(self, message):
        text = self.message_text(message)
        if not text:
            return False
        normalized = normalize_text(text)
        for row in self.store.enabled_rows("keywords"):
            raw_keyword = row.get("keyword") or row.get("word")
            keyword = normalize_text(raw_keyword)
            if not keyword:
                continue
            match_type = (row.get("match") or "contains").strip().lower()
            matched = bool(re.search(keyword, normalized)) if match_type == "regex" else keyword in normalized
            if matched:
                action = row.get("action") or "warn"
                reason = row.get("reason") or "Từ khóa cấm."
                self.delete_violation_message(
                    message,
                    f"keyword:{keyword}:before_{action}",
                    reason_label=reason,
                    matched_keyword=keyword,
                    matched_keyword_raw=raw_keyword,
                    keyword_rule_id=row.get("id"),
                    match_type=match_type,
                    rule_action=action,
                )
                self.apply_action(message, action, reason, trigger="keyword")
                if action == "delete":
                    # Keyword rules often want "xóa tin" as the visible action,
                    # but repeated violations should still escalate to a ban.
                    self.warn_user(
                        message.chat.id,
                        message.from_user.id,
                        reason,
                        user=message.from_user,
                        trigger="keyword",
                        send_notice=False,
                    )
                return True
        return False

    def detect_blacklisted_link(self, message):
        text = self.message_text(message)
        if not text:
            return False
        domains = self.message_domains(text)
        if not domains:
            return False
        for domain in domains:
            for row in self.store.enabled_rows("domain_blacklist"):
                blocked = (row.get("domain") or "").lower().strip()
                if blocked and (domain == blocked or domain.endswith("." + blocked)):
                    action = row.get("action") or "delete"
                    reason = row.get("notes") or "Link scam/phishing bị chặn."
                    self.delete_violation_message(
                        message,
                        f"domain:{domain}:before_{action}",
                        reason_label=reason,
                        blocked_domain=domain,
                        rule_action=action,
                    )
                    self.apply_action(message, action, reason, trigger="domain_blacklist")
                    return True
            for row in self.store.enabled_rows("link_shorteners"):
                blocked = (row.get("domain") or "").lower().strip()
                if blocked and (domain == blocked or domain.endswith("." + blocked)):
                    action = row.get("action") or "warn"
                    reason = row.get("notes") or "Không dùng link rút gọn trong nhóm."
                    self.delete_violation_message(
                        message,
                        f"shortener:{domain}:before_{action}",
                        reason_label=reason,
                        blocked_domain=domain,
                        rule_action=action,
                    )
                    self.apply_action(message, action, reason, trigger="link_shortener")
                    return True
        return False

    def detect_hidden_links_and_mentions(self, message):
        if not self.setting_bool(message.chat.id, "scan_hidden_links", True):
            return False

        entities = []
        entities.extend(getattr(message, "entities", None) or [])
        entities.extend(getattr(message, "caption_entities", None) or [])
        if not entities:
            return False

        matched = []
        current_group_usernames = self.current_scope_usernames(message.chat.id)
        known_bot_usernames = self.known_bot_usernames()
        known_group_usernames = self.known_group_usernames(message.chat.id)
        for entity in entities:
            entity_type = (getattr(entity, "type", "") or "").strip().lower()
            if entity_type not in {"text_link", "text_mention", "mention"}:
                continue

            detail = {"entity_type": entity_type}
            if entity_type == "text_link":
                if not self.setting_bool(message.chat.id, "scan_text_link", True):
                    continue
                url = getattr(entity, "url", "") or ""
                if not url:
                    continue
                detail["entity_url"] = url
                detail["rule_action"] = self.setting(message.chat.id, "text_link_action", self.setting(message.chat.id, "hidden_link_action", "warn"))
                matched.append(detail)
                continue
            elif entity_type == "text_mention":
                if not self.setting_bool(message.chat.id, "scan_text_mention", True):
                    continue
                user = getattr(entity, "user", None)
                if not user:
                    continue
                detail["entity_user_id"] = getattr(user, "id", "")
                detail["entity_user_username"] = getattr(user, "username", "")
                detail["entity_user_is_bot"] = getattr(user, "is_bot", False)
                detail["rule_action"] = self.setting(message.chat.id, "text_mention_action", self.setting(message.chat.id, "hidden_link_action", "warn"))
                matched.append(detail)
                continue

            mention_name = self.normalize_mention_name(self.entity_text(message, entity))
            if not mention_name:
                continue
            detail["entity_mention"] = mention_name
            if self.setting_bool(message.chat.id, "allow_in_group_mentions", True) and mention_name in current_group_usernames:
                continue
            if mention_name in known_bot_usernames:
                detail["matched_target"] = "bot"
            elif mention_name in known_group_usernames:
                detail["matched_target"] = "group"
            else:
                detail["matched_target"] = "unknown"
            detail["rule_action"] = self.setting(message.chat.id, "hidden_link_action", "warn")
            matched.append(detail)

        if not matched:
            return False

        reason = self.setting(
            message.chat.id,
            "hidden_link_reason",
            "Không được gắn link ẩn hoặc tag bot/user/channel/group bên ngoài.",
        )
        action = self.setting(message.chat.id, "hidden_link_action", "warn")
        self.delete_violation_message(
            message,
            "hidden_link_or_mention",
            reason_label="Link/mention ẩn trong tin",
            matched_entities=json.dumps(matched, ensure_ascii=False),
        )
        for item in matched:
            self.apply_action(message, item.get("rule_action") or action, reason, trigger="hidden_link_or_mention")
            break
        return True

    def message_domains(self, text):
        domains = []
        for match in self.URL_PATTERN.findall(text or ""):
            url = match if "://" in match else f"https://{match}"
            domain = (urlparse(url).hostname or "").lower().lstrip("www.")
            if domain:
                domains.append(domain)
        return domains

    def entity_text(self, message, entity):
        text = self.message_text(message) or getattr(message, "caption", "") or ""
        offset = getattr(entity, "offset", None)
        length = getattr(entity, "length", None)
        if offset is None or length is None:
            return ""
        try:
            return text[int(offset): int(offset) + int(length)]
        except Exception:
            return ""

    def normalize_mention_name(self, value):
        text = normalize_text(value or "")
        if text.startswith("@"):
            text = text[1:]
        return text.strip()

    def current_scope_usernames(self, chat_id):
        usernames = set()
        scope_chat_id = str(chat_id)
        for table in ("member_roles", "admins"):
            for row in self.store.rows(table):
                row_scope = str(row.get("chat_id") or row.get("group_id") or "").strip()
                if row_scope and row_scope != scope_chat_id:
                    continue
                username = self.normalize_mention_name(row.get("username") or row.get("target_username") or "")
                if username:
                    usernames.add(username)
        return usernames

    def known_bot_usernames(self):
        usernames = set()
        for row in self.store.rows("bots"):
            username = self.normalize_mention_name(row.get("username") or row.get("bot_username") or "")
            if username:
                usernames.add(username)
        return usernames

    def known_group_usernames(self, chat_id):
        usernames = set()
        scope_chat_id = str(chat_id)
        for row in self.store.rows("groups"):
            username = self.normalize_mention_name(row.get("group_username") or row.get("username") or "")
            if not username:
                continue
            row_scope = str(row.get("group_id") or row.get("chat_id") or "").strip()
            if row_scope and row_scope == scope_chat_id:
                continue
            usernames.add(username)
        return usernames

    def detect_forward(self, message):
        forwarded, forward_flags = self.forward_detection_flags(message)
        if not forwarded:
            return False
        if self.is_automatic_forward_allowed(message):
            return False
        if self.setting_bool(message.chat.id, "delete_forwarded_messages", True) and not self.setting_bool(message.chat.id, "allow_forward_messages", False):
            self.delete_violation_message(
                message,
                "forwarded_message",
                reason_label="Tin nhắn được forward",
                **self.forward_audit_details(message, forward_flags),
            )
            reason = self.setting(message.chat.id, "forward_warning_reason", "Không được forward video/bài vào nhóm.")
            action = (self.setting(message.chat.id, "forward_action", "warn") or "warn").strip().lower()
            if action in {"delete", "remove"}:
                ban_after = self.setting_int(message.chat.id, "ban_after_warnings", 3)
                if ban_after > 0:
                    self.warn_user(
                        message.chat.id,
                        message.from_user.id,
                        reason=reason,
                        user=message.from_user,
                        trigger="forwarded_message",
                        send_notice=False,
                    )
                return True
            self.apply_action(message, action, reason, trigger="forwarded_message")
            return True

        if self.forward_from_bot(message):
            self.handle_forward_violation(message, "Forward từ bot không được phép.", forward_flags)
            return True

        if not self.forward_source_allowed(message):
            allowed = self.forward_allowed_sources(message)
            allowed_text = ", ".join(sorted(allowed)) if allowed else "không giới hạn"
            self.handle_forward_violation(
                message,
                f"Chỉ cho phép forward từ: {allowed_text}.",
                forward_flags,
            )
            return True

        if not self.forward_content_allowed(message):
            allowed = self.forward_allowed_content_types(message)
            allowed_text = ", ".join(sorted(allowed)) if allowed else "không giới hạn"
            self.handle_forward_violation(
                message,
                f"Chỉ cho phép forward: {allowed_text}.",
                forward_flags,
            )
            return True

        spam_limit = self.setting_int(message.chat.id, "forward_spam_max_messages", 3)
        spam_window = self.setting_int(message.chat.id, "forward_spam_window_seconds", 30)
        if spam_limit > 0 and spam_window > 0:
            count = self.state.add_user_forward_message(message.chat.id, message.from_user.id, spam_window)
            if count > spam_limit:
                self.handle_forward_violation(
                    message,
                    f"Forward quá nhanh ({count}/{spam_limit} trong {spam_window} giây).",
                    forward_flags,
                )
                return True

        return False

    def forward_from_bot(self, message):
        origin = getattr(message, "forward_origin", None)
        sender_user = getattr(origin, "sender_user", None) or getattr(message, "forward_from", None)
        sender_chat = getattr(origin, "sender_chat", None) or getattr(message, "forward_from_chat", None)
        if getattr(message, "via_bot", None):
            return True
        if getattr(sender_user, "is_bot", False):
            return True
        if getattr(sender_chat, "type", "") == "bot":
            return True
        return False

    def forward_source(self, message):
        origin = getattr(message, "forward_origin", None)
        sender_user = getattr(origin, "sender_user", None) or getattr(message, "forward_from", None)
        sender_chat = getattr(origin, "sender_chat", None) or getattr(message, "forward_from_chat", None)
        if getattr(message, "via_bot", None) or getattr(sender_user, "is_bot", False) or getattr(sender_chat, "type", "") == "bot":
            return "bot"
        chat_type = str(getattr(sender_chat, "type", "") or "").lower()
        if chat_type == "channel":
            return "channel_public" if getattr(sender_chat, "username", None) else "channel_private"
        if chat_type in {"group", "supergroup"}:
            return "group_public" if getattr(sender_chat, "username", None) else "group_private"
        if getattr(sender_user, "id", None):
            return "user"
        return "unknown"

    def forward_allowed_sources(self, message):
        raw = self.setting(message.chat.id, "forward_allowed_sources", "").strip()
        if not raw:
            return set()
        aliases = {
            "channel": "channel_private",
            "channel_private": "channel_private",
            "channel_public": "channel_public",
            "group": "group_private",
            "group_private": "group_private",
            "group_public": "group_public",
            "user": "user",
            "bot": "bot",
            "kênh": "channel_private",
            "kênh riêng": "channel_private",
            "kênh công khai": "channel_public",
            "group riêng": "group_private",
            "group công khai": "group_public",
            "nguoi_dung": "user",
        }
        normalized = set()
        for item in raw.split(","):
            key = normalize_text(item).replace(" ", "_")
            if not key:
                continue
            normalized.add(aliases.get(key, key))
        return normalized

    def forward_allowed_content_types(self, message):
        raw = self.setting(message.chat.id, "forward_allowed_content_types", "").strip()
        if not raw:
            return set()
        aliases = {
            "anh": "photo",
            "ảnh": "photo",
            "image": "photo",
            "pic": "photo",
            "hinh": "photo",
            "video": "video",
            "gif": "animation",
            "sticker": "sticker",
            "doc": "document",
            "document": "document",
            "voice": "voice",
            "audio": "audio",
            "text": "text",
            "tin": "text",
            "note": "video_note",
            "video_note": "video_note",
        }
        normalized = set()
        for item in raw.split(","):
            key = normalize_text(item).replace(" ", "_")
            if not key:
                continue
            normalized.add(aliases.get(key, key))
        return normalized

    def forward_content_allowed(self, message):
        allowed = self.forward_allowed_content_types(message)
        if not allowed:
            return True
        content_type = (getattr(message, "content_type", "") or "").strip().lower()
        if content_type == "photo" and ("photo" in allowed or "image" in allowed):
            return True
        if content_type == "video" and "video" in allowed:
            return True
        if content_type == "animation" and ("gif" in allowed or "animation" in allowed):
            return True
        if content_type == "sticker" and "sticker" in allowed:
            return True
        if content_type == "document" and "document" in allowed:
            return True
        if content_type == "voice" and "voice" in allowed:
            return True
        if content_type == "audio" and "audio" in allowed:
            return True
        if content_type == "text" and "text" in allowed:
            return True
        if content_type == "video_note" and "video_note" in allowed:
            return True
        return content_type in allowed

    def forward_source_allowed(self, message):
        allowed = self.forward_allowed_sources(message)
        if not allowed:
            return True
        source = self.forward_source(message)
        return source in allowed

    def handle_forward_violation(self, message, reason, forward_flags=None):
        forward_flags = forward_flags or []
        self.delete_violation_message(
            message,
            "forwarded_message",
            reason_label="Tin nhắn chuyển tiếp không hợp lệ",
            **self.forward_audit_details(message, forward_flags),
        )
        count = self.state.add_forward_warning(message.chat.id, message.from_user.id)
        restrict_after = self.setting_int(message.chat.id, "forward_violation_restrict_after", 3)
        ban_after = self.setting_int(message.chat.id, "forward_violation_ban_after", 4)
        chat_id = message.chat.id
        user = message.from_user
        if ban_after and count >= ban_after:
            self.ban_user(chat_id, user.id, reason=reason, trigger="forwarded_message", actor_user_id=self.actor_for_system())
            self.state.reset_forward_warnings(chat_id, user.id)
            return
        if restrict_after and count >= restrict_after:
            self.restrict_user_for_spam(chat_id, user.id, reason=reason, trigger="forwarded_message")
            self.notify_temporary_restrict(chat_id, user, reason)
            self.audit(
                chat_id,
                "forward_restrict",
                target_user_id=user.id,
                actor_user_id=self.actor_for_system(),
                details=self.audit_details(reason=reason, forward_count=count, trigger="forwarded_message"),
            )
            return

        text = self.setting(chat_id, "forward_warning_text", "{mention} bạn đang gửi nội dung chuyển tiếp từ nguồn ngoài.\nLý do: {reason}\nCảnh báo: {count}/{limit}")
        mention = self.user_mention(user)
        try:
            sent = self.bot.send_message(
                chat_id,
                text.format(
                    mention=mention,
                    user_id=user.id,
                    reason=reason,
                    count=count,
                    limit=restrict_after or "-",
                ),
            )
            delete_after = self.setting_int(chat_id, "forward_warning_delete_seconds", 180)
            if delete_after > 0:
                self.delete_later(chat_id, sent.message_id, delete_after, "forward_warning")
        except Exception as exc:
            LOGGER.warning("Cannot send forward warning in %s: %s", chat_id, exc)
        self.audit(
            chat_id,
            "forward_warn",
            target_user_id=user.id,
            actor_user_id=self.actor_for_system(),
            details=self.audit_details(reason=reason, forward_count=count, trigger="forwarded_message"),
        )
        return

    def forward_detection_flags(self, message):
        flags = []
        origin = getattr(message, "forward_origin", None)
        if origin:
            flags.append("forward_origin")
        if getattr(message, "is_automatic_forward", False):
            flags.append("is_automatic_forward")
        if getattr(message, "story", None):
            flags.append("story")
        if getattr(message, "external_reply", None):
            flags.append("external_reply")
        quote = getattr(message, "quote", None)
        if quote and (
            getattr(quote, "text", None)
            or getattr(quote, "position", None) is not None
            or getattr(quote, "is_manual", None) is not None
        ):
            flags.append("quote")
        return bool(flags), flags

    def is_automatic_forward_allowed(self, message):
        return bool(getattr(message, "is_automatic_forward", False)) and self.setting_bool(message.chat.id, "allow_automatic_forwards", True)

    def detect_inline_keyboard(self, message):
        if not self.setting_bool(message.chat.id, "delete_inline_keyboard_messages", True):
            return False
        markup = getattr(message, "reply_markup", None)
        if not markup or not getattr(markup, "keyboard", None) and not getattr(markup, "inline_keyboard", None):
            return False
        self.delete_violation_message(message, "inline_keyboard", reason_label="Tin nhắn có nút bấm")
        self.apply_action(message, self.setting(message.chat.id, "inline_keyboard_action", "warn"), "Không được gửi bài có nút bấm.", trigger="inline_keyboard")
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
        bio_link = self.extract_bio_link(bio)
        has_link = bool(bio_link)
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

    def restrict_user_for_spam(self, chat_id, user_id, reason="", actor_user_id="", trigger="automatic_rule"):
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
            self.audit(
                chat_id,
                "restrict",
                target_user_id=user_id,
                actor_user_id=actor_user_id or self.actor_for_system(),
                details=self.audit_details(
                    reason=reason or "Tạm cấm chat theo luật tự động",
                    seconds=seconds,
                    until_date=until_date.isoformat() if until_date else "",
                    trigger=trigger,
                ),
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

    def extract_bio_link(self, bio):
        match = self.BIO_LINK_PATTERN.search(bio or "")
        return match.group(0) if match else ""

    def truncate_text(self, value, limit=1200):
        text = str(value or "")
        return text if len(text) <= limit else f"{text[:limit]}..."

    def audit_scalar(self, value):
        if value in (None, ""):
            return ""
        if hasattr(value, "isoformat"):
            try:
                return value.isoformat()
            except Exception:
                return str(value)
        return value

    def actor_for_system(self):
        return "bot"

    def audit_details(self, **values):
        cleaned = {key: value for key, value in values.items() if value not in (None, "")}
        return json.dumps(cleaned, ensure_ascii=False)

    def message_audit_details(self, message, reason, **extra):
        user = getattr(message, "from_user", None)
        text = self.message_text(message) or getattr(message, "caption", "") or ""
        return self.audit_details(
            reason=extra.pop("reason_label", None) or reason,
            deleted_text=self.truncate_text(text),
            message_id=getattr(message, "message_id", ""),
            message_type=getattr(message, "content_type", ""),
            from_user_id=getattr(user, "id", ""),
            from_username=getattr(user, "username", ""),
            from_name=" ".join(
                part for part in (
                    getattr(user, "first_name", ""),
                    getattr(user, "last_name", ""),
                )
                if part
            ),
            **extra,
        )

    def forward_audit_details(self, message, forward_flags=None):
        origin = getattr(message, "forward_origin", None)
        story = getattr(message, "story", None)
        story_chat = getattr(story, "chat", None)
        external_reply = getattr(message, "external_reply", None)
        quote = getattr(message, "quote", None)
        return {
            "forward_detected": "true",
            "forward_flags": ",".join(forward_flags or []),
            "forward_origin_type": getattr(origin, "type", ""),
            "forward_origin_chat_id": getattr(getattr(origin, "chat", None), "id", ""),
            "forward_origin_chat_title": getattr(getattr(origin, "chat", None), "title", ""),
            "forward_origin_message_id": getattr(origin, "message_id", ""),
            "forward_origin_sender_user_id": getattr(getattr(origin, "sender_user", None), "id", ""),
            "forward_origin_sender_chat_id": getattr(getattr(origin, "sender_chat", None), "id", ""),
            "is_automatic_forward": getattr(message, "is_automatic_forward", ""),
            "story_id": getattr(story, "id", ""),
            "story_date": self.audit_scalar(getattr(story, "date", "")),
            "story_chat_id": getattr(story_chat, "id", ""),
            "story_chat_title": getattr(story_chat, "title", ""),
            "story_chat_username": getattr(story_chat, "username", ""),
            "external_reply_present": "true" if external_reply else "",
            "external_reply_chat_id": getattr(getattr(external_reply, "chat", None), "id", ""),
            "external_reply_chat_title": getattr(getattr(external_reply, "chat", None), "title", ""),
            "external_reply_message_id": getattr(external_reply, "message_id", ""),
            "external_reply_origin_chat_id": getattr(getattr(getattr(external_reply, "origin", None), "chat", None), "id", ""),
            "external_reply_origin_message_id": getattr(getattr(external_reply, "origin", None), "message_id", ""),
            "quote_present": "true" if quote else "",
            "quote_text": self.truncate_text(getattr(quote, "text", ""), 350),
            "quote_position": getattr(quote, "position", ""),
        }

    def delete_violation_message(self, message, reason, **details):
        deleted = self.safe_delete(message, reason, audit_details=self.message_audit_details(message, reason, **details))
        retry_seconds = self.setting_int(message.chat.id, "violation_delete_retry_seconds", 2)
        if not deleted and retry_seconds > 0:
            self.delete_later(message.chat.id, message.message_id, retry_seconds, f"{reason}:retry")

    def apply_action(self, message, action, reason, trigger="automatic_rule"):
        action = (action or "warn").strip().lower()
        if action in {"delete", "remove"}:
            return
        if action == "ban":
            self.ban_user(message.chat.id, message.from_user.id, reason=reason, trigger=trigger)
            return
        if action in {"mute", "restrict"}:
            self.restrict_user_for_spam(message.chat.id, message.from_user.id, reason=reason, trigger=trigger)
            self.notify_temporary_restrict(message.chat.id, message.from_user, reason)
            return
        if action == "kick":
            self.kick_user(message.chat.id, message.from_user.id, reason=reason, trigger=trigger)
            return
        if action == "warn":
            self.warn_user(message.chat.id, message.from_user.id, reason, user=message.from_user, trigger=trigger)

    def warn_user(self, chat_id, user_id, reason="", user=None, actor_user_id="", trigger="automatic_rule", send_notice=True):
        count = self.state.add_warning(chat_id, user_id)
        ban_after = self.setting_int(chat_id, "ban_after_warnings", 3)
        details = self.audit_details(reason=reason, warning_count=count, warning_limit=ban_after, trigger=trigger)
        if ban_after and count >= ban_after:
            self.ban_user(
                chat_id,
                user_id,
                reason=reason or "Đạt giới hạn cảnh báo",
                actor_user_id=actor_user_id or self.actor_for_system(),
                trigger=trigger,
                warning_count=count,
                warning_limit=ban_after,
            )
            return count

        if send_notice:
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
        self.audit(
            chat_id,
            "warn",
            target_user_id=user_id,
            actor_user_id=actor_user_id or self.actor_for_system(),
            details=details,
        )
        return count

    def ban_user(self, chat_id, user_id, reason="", actor_user_id="", trigger="automatic_rule", warning_count=None, warning_limit=None):
        try:
            seconds = self.setting_int(chat_id, "ban_seconds", 0)
            until_date = datetime.now() + timedelta(seconds=seconds) if seconds > 0 else None
            self.bot.ban_chat_member(chat_id, user_id, until_date=until_date)
            self.state.reset_warnings(chat_id, user_id)
            self.audit(
                chat_id,
                "ban",
                target_user_id=user_id,
                actor_user_id=actor_user_id or self.actor_for_system(),
                details=self.audit_details(
                    reason=reason or "Ban theo luật tự động",
                    seconds=seconds,
                    until_date=until_date.isoformat() if until_date else "",
                    trigger=trigger,
                    warning_count=warning_count,
                    warning_limit=warning_limit,
                ),
            )
        except Exception as exc:
            LOGGER.warning("Cannot ban %s in %s: %s", user_id, chat_id, exc)

    def kick_user(self, chat_id, user_id, reason="", actor_user_id="", trigger="automatic_rule"):
        try:
            self.bot.ban_chat_member(chat_id, user_id)
            self.bot.unban_chat_member(chat_id, user_id, only_if_banned=True)
            self.state.reset_warnings(chat_id, user_id)
            self.audit(
                chat_id,
                "kick",
                target_user_id=user_id,
                actor_user_id=actor_user_id or self.actor_for_system(),
                details=self.audit_details(reason=reason or "Kick theo luật tự động", trigger=trigger),
            )
        except Exception as exc:
            LOGGER.warning("Cannot kick %s in %s: %s", user_id, chat_id, exc)

    def safe_delete(self, message, reason="unknown", audit_details=""):
        user = getattr(message, "from_user", None)
        try:
            self.bot.delete_message(message.chat.id, message.message_id)
            self.audit(
                message.chat.id,
                "delete_message",
                target_user_id=getattr(user, "id", ""),
                actor_user_id=self.actor_for_system(),
                details=audit_details or self.message_audit_details(message, reason),
            )
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
            try:
                self.audit(
                    message.chat.id,
                    "delete_message_failed",
                    target_user_id=getattr(user, "id", ""),
                    actor_user_id=self.actor_for_system(),
                    details=self.audit_details(
                        reason=reason,
                        error=str(exc),
                        message_id=getattr(message, "message_id", ""),
                        message_type=getattr(message, "content_type", ""),
                    ),
                )
            except Exception:
                pass
            return False

    def start_verification(self, chat_id, user):
        settings = self.verification_settings(chat_id)
        if not settings:
            return False
        a = random.randint(1, 9)
        b = random.randint(1, 9)
        answer = str(a + b)
        timeout = as_int(settings.get("verify_timeout_seconds"), 180)
        text = self.setting(
            chat_id,
            "captcha_text",
            "{mention} vui lòng trả lời phép tính trong {seconds}s để xác minh: {question}",
        )
        try:
            sent = self.bot.send_message(
                chat_id,
                text.format(mention=self.user_mention(user), user_id=user.id, seconds=timeout, question=f"{a} + {b} = ?"),
            )
            self.state.set_pending_verification(chat_id, user.id, {
                "answer": answer,
                "deadline": datetime.now() + timedelta(seconds=timeout),
                "notice_message_id": sent.message_id,
                "kick": as_bool(settings.get("kick_unverified"), True),
            })
            self.delete_later(chat_id, sent.message_id, timeout, "captcha_notice")
            if as_bool(settings.get("kick_unverified"), True):
                self.schedule_unverified_kick(chat_id, user.id, timeout)
            return True
        except Exception as exc:
            LOGGER.warning("Cannot start verification in %s for %s: %s", chat_id, user.id, exc)
            return False

    def handle_verification_answer(self, message):
        pending = self.state.get_pending_verification(message.chat.id, message.from_user.id)
        if not pending:
            return False
        if datetime.now() > pending["deadline"]:
            self.state.clear_pending_verification(message.chat.id, message.from_user.id)
            self.delete_violation_message(message, "captcha_expired")
            return True
        if (getattr(message, "text", "") or "").strip() == str(pending["answer"]):
            self.state.clear_pending_verification(message.chat.id, message.from_user.id)
            self.audit(message.chat.id, "verify_success", target_user_id=message.from_user.id)
            try:
                self.safe_delete(message, "captcha_answer")
            except Exception:
                pass
            return True
        self.delete_violation_message(message, "captcha_wrong_answer")
        return True

    def schedule_unverified_kick(self, chat_id, user_id, delay_seconds):
        def worker():
            pending = self.state.get_pending_verification(chat_id, user_id)
            if not pending:
                return
            self.state.clear_pending_verification(chat_id, user_id)
            self.kick_user(chat_id, user_id)

        timer = threading.Timer(delay_seconds, worker)
        timer.daemon = True
        timer.start()

    def verification_settings(self, chat_id):
        for row in self.store.enabled_rows("verification_settings"):
            row_chat = row.get("chat_id")
            if not row_chat or row_chat == str(chat_id):
                return row
        return None

    def audit(self, chat_id, action, target_user_id="", details="", actor_user_id=""):
        try:
            self.store.insert("audit_logs", {
                "chat_id": str(chat_id),
                "actor_user_id": str(actor_user_id or ""),
                "action": action,
                "target_user_id": str(target_user_id or ""),
                "details": details,
            })
        except Exception:
            pass

    def safe_reply(self, message, text):
        try:
            self.bot.reply_to(message, text)
        except Exception as exc:
            LOGGER.warning("Cannot reply in %s: %s", message.chat.id, exc)

    def send_policy(self, chat_id, reply_to_message_id=None):
        text = self.setting(chat_id, "policy_text", None) or self.store.value(
            "policy_text",
            "Quy định nhóm:\n1. Tôn trọng thành viên.\n2. Không spam/quảng cáo.\n3. Không gửi nội dung cấm.",
        )
        try:
            self.bot.send_message(chat_id, self.clean_text(text), reply_to_message_id=reply_to_message_id)
        except Exception as exc:
            LOGGER.warning("Cannot send policy to %s: %s", chat_id, exc)

    def clean_text(self, text):
        return str(text or "").replace("\\r\\n", "\n").replace("\\n", "\n")

    def group_enabled(self, chat_id):
        rows = self.store.enabled_rows("groups")
        if not rows:
            return True
        chat_id = str(chat_id)
        return any(normalize_id(row.get("group_id") or row.get("chat_id")) == chat_id for row in rows)

    def moderation_enabled(self, chat_id):
        return self.setting_bool(chat_id, "moderation_enabled", True)

    def group_row(self, chat_id):
        chat_id = str(chat_id)
        for row in self.store.enabled_rows("groups"):
            if normalize_id(row.get("group_id") or row.get("chat_id")) == chat_id:
                return row
        return {}

    def setting(self, chat_id, key, default=None):
        if key in self.MODULE_SETTING_KEYS:
            module_value = self.module_setting(key)
            if module_value not in (None, ""):
                return module_value
        row = self.group_row(chat_id)
        if row.get(key) not in (None, ""):
            return row.get(key)
        return self.store.value(key, default)

    def module_setting(self, key):
        for row in self.store.rows("module_settings"):
            if (row.get("module_key") or "").strip().lower() != "moderation":
                continue
            settings = row.get("settings")
            if isinstance(settings, str):
                try:
                    settings = json.loads(settings)
                except Exception:
                    settings = {}
            if isinstance(settings, dict):
                return settings.get(key)
            return None
        return None

    def setting_bool(self, chat_id, key, default=False):
        return as_bool(self.setting(chat_id, key, default), default)

    def setting_int(self, chat_id, key, default=0):
        return as_int(self.setting(chat_id, key, default), default)

    def bot_allowed(self, chat_id, user):
        if getattr(user, "id", None) == self.bot.get_me().id:
            return True
        rows = self.store.enabled_rows("bot_allowlist")
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
        for row in self.store.enabled_rows("admins"):
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
