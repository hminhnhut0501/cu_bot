import logging
import json

from modules.base import BotModule

try:
    from telebot.handler_backends import ContinueHandling
except ImportError:  # pragma: no cover - compatibility with old TeleBot builds
    ContinueHandling = None


LOGGER = logging.getLogger(__name__)


class JoinRouterModule(BotModule):
    name = "join_router"
    priority = 9

    def register(self):
        LOGGER.info("Register join router for bot %s.", self.settings.bot_key)
        self.bot.message_handler(content_types=["new_chat_members", "left_chat_member"])(self.active(self.handle_membership_message))
        if hasattr(self.bot, "chat_member_handler"):
            self.bot.chat_member_handler()(self.active(self.handle_chat_member))
        if hasattr(self.bot, "chat_join_request_handler"):
            self.bot.chat_join_request_handler()(self.active(self.handle_join_request))

    def is_enabled(self):
        # Always load the router so join events can be fanned out even when
        # moderation is disabled for a specific bot.
        return True

    def handle_membership_message(self, message):
        if getattr(message, "content_type", "") == "new_chat_members":
            self.handle_new_members(message)
        elif getattr(message, "content_type", "") == "left_chat_member":
            self.handle_left_member(message)
        return self.continue_handling()

    def handle_new_members(self, message):
        chat_id = getattr(getattr(message, "chat", None), "id", None)
        members = getattr(message, "new_chat_members", None) or []
        LOGGER.info(
            "Join router received event for bot %s in chat %s with %s new member(s).",
            self.settings.bot_key,
            chat_id,
            len(members),
        )
        for user in members:
            self.audit_member_event(chat_id, "member_joined", user, "service_message")
            self.block_blacklisted_join(chat_id, user, "service_message")
        self.forward(message, "welcome")
        self.forward(message, "share_unlock")

    def handle_left_member(self, message):
        chat_id = getattr(getattr(message, "chat", None), "id", None)
        user = getattr(message, "left_chat_member", None)
        if not user:
            return
        LOGGER.info(
            "Join router received leave event for bot %s in chat %s user %s.",
            self.settings.bot_key,
            chat_id,
            getattr(user, "id", None),
        )
        self.audit_member_event(chat_id, "member_left", user, "service_message")

    def handle_join_request(self, request):
        chat = getattr(request, "chat", None)
        user = getattr(request, "from_user", None)
        chat_id = getattr(chat, "id", None)
        if not chat or not user:
            return self.continue_handling()
        LOGGER.info(
            "Join router received join request for bot %s in chat %s user %s.",
            self.settings.bot_key,
            chat_id,
            getattr(user, "id", None),
        )
        self.audit_member_event(chat_id, "member_join_request", user, "chat_join_request")
        return self.continue_handling()

    @staticmethod
    def member_is_active(member):
        status = str(getattr(member, "status", "") or "").lower()
        is_member = getattr(member, "is_member", None)
        if is_member is not None:
            return bool(is_member)
        return status in {"creator", "administrator", "member"}

    @staticmethod
    def is_join_transition(old_member, new_member):
        old_status = str(getattr(old_member, "status", "") or "").lower()
        new_status = str(getattr(new_member, "status", "") or "").lower()

        old_is_member = getattr(old_member, "is_member", None)
        new_is_member = getattr(new_member, "is_member", None)
        was_member = JoinRouterModule.member_is_active(old_member) or (old_is_member is None and old_status == "restricted")
        is_member = JoinRouterModule.member_is_active(new_member) or (new_is_member is None and new_status == "restricted")
        return not was_member and is_member

    @staticmethod
    def is_leave_transition(old_member, new_member):
        old_status = str(getattr(old_member, "status", "") or "").lower()
        new_status = str(getattr(new_member, "status", "") or "").lower()

        old_is_member = getattr(old_member, "is_member", None)
        new_is_member = getattr(new_member, "is_member", None)
        was_member = JoinRouterModule.member_is_active(old_member) or (old_is_member is None and old_status == "restricted")
        is_member = JoinRouterModule.member_is_active(new_member) or (new_is_member is None and new_status == "restricted")
        return was_member and not is_member

    def handle_chat_member(self, update):
        chat = getattr(update, "chat", None)
        old_member = getattr(update, "old_chat_member", None)
        new_member = getattr(update, "new_chat_member", None)
        user = getattr(new_member, "user", None)
        chat_id = getattr(chat, "id", None)
        if not chat or not old_member or not new_member or not user or chat_id is None:
            LOGGER.warning("Join router received incomplete chat_member update for bot %s.", self.settings.bot_key)
            return self.continue_handling()

        old_status = str(getattr(old_member, "status", "") or "").lower()
        new_status = str(getattr(new_member, "status", "") or "").lower()
        old_is_member = self.member_is_active(old_member)
        new_is_member = self.member_is_active(new_member)
        LOGGER.info(
            "Join router received member state for bot %s chat %s user %s: "
            "%s(is_member=%s) -> %s(is_member=%s).",
            self.settings.bot_key,
            chat_id,
            getattr(user, "id", None),
            old_status or "-",
            old_is_member,
            new_status or "-",
            new_is_member,
        )

        if self.is_join_transition(old_member, new_member):
            self.audit_member_event(chat_id, "member_joined", user, "member_state")
            self.block_blacklisted_join(chat_id, user, "member_state")
            self.forward_chat_member(update, "welcome")
        elif self.is_leave_transition(old_member, new_member):
            self.audit_member_event(chat_id, "member_left", user, "member_state")
        else:
            LOGGER.info(
                "Join router ignored non-membership transition for bot %s chat %s user %s.",
                self.settings.bot_key,
                chat_id,
                getattr(user, "id", None),
            )
        return self.continue_handling()

    @staticmethod
    def continue_handling():
        return ContinueHandling() if ContinueHandling is not None else None

    def forward(self, message, module_name):
        try:
            for module in getattr(self.app, "modules", []) or []:
                if getattr(module, "name", "") != module_name:
                    continue
                handler = getattr(module, "handle_new_members", None)
                if callable(handler):
                    LOGGER.info(
                        "Join router forwarded event to %s for bot %s chat %s.",
                        module_name,
                        self.settings.bot_key,
                        getattr(getattr(message, "chat", None), "id", None),
                    )
                    handler(message)
                return
        except Exception as exc:
            LOGGER.warning("Join router cannot forward to %s for bot %s: %s", module_name, self.settings.bot_key, exc)

    def forward_chat_member(self, update, module_name):
        try:
            for module in getattr(self.app, "modules", []) or []:
                if getattr(module, "name", "") != module_name:
                    continue
                handler = getattr(module, "handle_chat_member", None)
                if callable(handler):
                    LOGGER.info(
                        "Join router forwarded member state to %s for bot %s chat %s.",
                        module_name,
                        self.settings.bot_key,
                        getattr(getattr(update, "chat", None), "id", None),
                    )
                    handler(update)
                return
            LOGGER.warning(
                "Join router cannot find module %s for bot %s.",
                module_name,
                self.settings.bot_key,
            )
        except Exception as exc:
            LOGGER.warning(
                "Join router cannot forward member state to %s for bot %s: %s",
                module_name,
                self.settings.bot_key,
                exc,
            )

    def audit_member_event(self, chat_id, action, user, source):
        user_id = str(getattr(user, "id", "") or "")
        first_name = getattr(user, "first_name", None) or ""
        last_name = getattr(user, "last_name", None) or ""
        display_name = " ".join(part for part in (first_name, last_name) if part).strip() or getattr(user, "username", "") or user_id
        username = getattr(user, "username", "") or ""
        details = json.dumps(
            {
                "source": source,
                "display_name": display_name,
                "username": username,
                "is_bot": bool(getattr(user, "is_bot", False)),
            },
            ensure_ascii=False,
        )
        try:
            self.store.insert(
                "audit_logs",
                {
                    "bot_key": self.settings.bot_key,
                    "chat_id": str(chat_id or ""),
                    "actor_user_id": "bot",
                    "action": action,
                    "target_user_id": user_id,
                    "details": details,
                },
            )
        except Exception as exc:
            LOGGER.warning("Join router cannot write %s audit for bot %s: %s", action, self.settings.bot_key, exc)

    def find_blacklist_state(self, chat_id, user_id):
        chat_id = str(chat_id or "").strip()
        user_id = str(user_id or "").strip()
        if not chat_id or not user_id:
            return None
        try:
            rows = self.store.fresh_rows("member_moderation_state")
        except Exception as exc:
            LOGGER.warning("Join router cannot load blacklist state for bot %s: %s", self.settings.bot_key, exc)
            rows = self.store.rows("member_moderation_state")
        for row in rows:
            if str(row.get("bot_key") or self.settings.bot_key) != self.settings.bot_key:
                continue
            if str(row.get("chat_id") or "").strip() != chat_id:
                continue
            if str(row.get("user_id") or "").strip() != user_id:
                continue
            if str(row.get("status") or "").strip().lower() == "blacklisted":
                return row
        return None

    def block_blacklisted_join(self, chat_id, user, source):
        user_id = str(getattr(user, "id", "") or "").strip()
        state = self.find_blacklist_state(chat_id, user_id)
        if not state:
            return False
        reason = state.get("reason") or "User nằm trong blacklist"
        blocked = False
        error = ""
        try:
            self.bot.ban_chat_member(chat_id, user_id)
            blocked = True
        except Exception as exc:
            error = str(exc)
            LOGGER.warning("Join router cannot block blacklisted user %s in chat %s: %s", user_id, chat_id, exc)
        details = {
            "source": source,
            "display_name": state.get("display_name") or self.display_name_for(user),
            "username": state.get("username") or getattr(user, "username", "") or "",
            "reason": reason,
            "member_status": "blacklisted",
            "blocked": blocked,
        }
        if error:
            details["error"] = error
        try:
            self.store.upsert(
                "member_moderation_state",
                {
                    "bot_key": self.settings.bot_key,
                    "chat_id": str(chat_id or ""),
                    "user_id": user_id,
                    "username": details["username"],
                    "display_name": details["display_name"],
                    "status": "blacklisted",
                    "reason": reason,
                    "updated_by": "bot",
                    "last_seen_at": self.utcnow_iso(),
                    "payload": {"trigger": "blacklist_join_block", "blocked": blocked, "source": source},
                },
                "bot_key,chat_id,user_id",
            )
        except Exception as exc:
            LOGGER.warning("Join router cannot refresh blacklist state for bot %s chat %s user %s: %s", self.settings.bot_key, chat_id, user_id, exc)
        self.audit_member_event_with_details(
            chat_id,
            "member_blacklist_join_blocked" if blocked else "member_blacklist_join_block_failed",
            user_id,
            details,
        )
        return blocked

    @staticmethod
    def utcnow_iso():
        from datetime import datetime

        return datetime.utcnow().isoformat() + "Z"

    @staticmethod
    def display_name_for(user):
        first_name = getattr(user, "first_name", None) or ""
        last_name = getattr(user, "last_name", None) or ""
        return " ".join(part for part in (first_name, last_name) if part).strip() or getattr(user, "username", "") or str(getattr(user, "id", "") or "")

    def audit_member_event_with_details(self, chat_id, action, target_user_id, details):
        try:
            self.store.insert(
                "audit_logs",
                {
                    "bot_key": self.settings.bot_key,
                    "chat_id": str(chat_id or ""),
                    "actor_user_id": "bot",
                    "action": action,
                    "target_user_id": str(target_user_id or ""),
                    "details": json.dumps(details, ensure_ascii=False),
                },
            )
        except Exception as exc:
            LOGGER.warning("Join router cannot write %s audit for bot %s: %s", action, self.settings.bot_key, exc)
