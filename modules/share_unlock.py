from datetime import datetime, timezone
from html import escape

import telebot

from core.utils import as_bool, as_int
from modules.base import BotModule


class ShareUnlockModule(BotModule):
    name = "share_unlock"
    priority = 34

    def register(self):
        self.bot.message_handler(commands=["shareunlock", "moikhoashare"])(self.active(self.handle_shareunlock))
        self.bot.message_handler(commands=["shareprogress", "tiendoshare"])(self.active(self.handle_shareprogress))
        self.bot.callback_query_handler(func=lambda call: (call.data or "").startswith("shareunlock:"))(self.active(self.handle_callback))

    def is_enabled(self):
        return self.module_enabled("share_unlock", True)

    def module_enabled(self, module_key, default=True):
        for row in self.store.rows("module_settings"):
            if (row.get("module_key") or "").strip() == module_key:
                return as_bool(row.get("enabled"), default)
        return default

    def handle_shareunlock(self, message):
        campaign = self.resolve_campaign(self.command_text(message), message.chat.id)
        if not campaign:
            self.reply(message, "Chưa có campaign mở khóa nào đang bật trong group này.")
            return
        invite_row = self.ensure_personal_invite(campaign, message.from_user.id)
        progress = self.progress(campaign, message.from_user.id)
        text = self.render_share_card(campaign, progress, invite_row.get("invite_link") or "")
        self.reply_html(message, text, self.share_markup(campaign, invite_row.get("invite_link") or ""))

    def handle_shareprogress(self, message):
        campaign = self.resolve_campaign(self.command_text(message), message.chat.id)
        if not campaign:
            self.reply(message, "Chưa có campaign mở khóa nào đang bật trong group này.")
            return
        invite_row = self.find_invite(campaign.get("id"), message.from_user.id)
        progress = self.progress(campaign, message.from_user.id)
        if progress["unlocked"]:
            self.reply_html(message, self.render_unlock_text(campaign, progress))
            return
        text = self.render_share_card(campaign, progress, invite_row.get("invite_link") if invite_row else "")
        self.reply_html(message, text, self.share_markup(campaign, invite_row.get("invite_link") if invite_row else ""))

    def handle_callback(self, call):
        data = str(call.data or "")
        _, action, campaign_id = (data.split(":", 2) + ["", "", ""])[:3]
        campaign = self.find_campaign(campaign_id)
        if not campaign:
            self.bot.answer_callback_query(call.id, "Campaign không còn hoạt động.")
            return
        if action == "link":
            invite_row = self.ensure_personal_invite(campaign, call.from_user.id)
            progress = self.progress(campaign, call.from_user.id)
            text = self.render_share_card(campaign, progress, invite_row.get("invite_link") or "")
            self.bot.answer_callback_query(call.id, "Đã tạo link riêng cho bạn.")
            self.safe_send(call.from_user.id, text, self.share_markup(campaign, invite_row.get("invite_link") or ""))
            return
        if action == "progress":
            progress = self.progress(campaign, call.from_user.id)
            self.bot.answer_callback_query(call.id, f"Tiến độ {progress['count']}/{progress['required']}")
            text = self.render_unlock_text(campaign, progress) if progress["unlocked"] else self.render_share_card(campaign, progress, "")
            self.safe_send(call.from_user.id, text)

    def handle_new_members(self, message):
        invite = getattr(message, "invite_link", None)
        if not invite:
            return
        invite_link = getattr(invite, "invite_link", "") or ""
        invite_name = getattr(invite, "name", "") or ""
        invite_row = self.find_invite_by_link(invite_link, invite_name)
        if not invite_row:
            return
        campaign = self.find_campaign(invite_row.get("campaign_id"))
        if not campaign or str(campaign.get("status") or "open") != "open":
            return
        referrer_user_id = str(invite_row.get("referrer_user_id") or "")
        for user in getattr(message, "new_chat_members", []) or []:
            user_id = str(getattr(user, "id", "") or "")
            if not user_id or user_id == referrer_user_id or getattr(user, "is_bot", False):
                continue
            try:
                self.store.insert("share_unlock_referrals", {
                    "campaign_id": campaign.get("id"),
                    "referrer_user_id": referrer_user_id,
                    "invitee_user_id": user_id,
                    "invitee_username": getattr(user, "username", "") or "",
                    "invitee_chat_id": str(message.chat.id),
                    "invite_link": invite_link,
                    "counted": True,
                })
            except Exception:
                continue
        self.deliver_unlock_if_ready(campaign, invite_row)

    def resolve_campaign(self, raw_text, chat_id):
        campaign_id = str(raw_text or "").strip()
        if campaign_id:
            return self.find_campaign(campaign_id, chat_id)
        rows = [
            row for row in self.store.enabled_rows("share_unlock_campaigns")
            if str(row.get("source_chat_id") or "") == str(chat_id) and str(row.get("status") or "open") == "open"
        ]
        return rows[0] if rows else None

    def find_campaign(self, campaign_id, chat_id=None):
        for row in self.store.enabled_rows("share_unlock_campaigns"):
            if str(row.get("id")) != str(campaign_id):
                continue
            if chat_id is not None and str(row.get("source_chat_id") or "") != str(chat_id):
                continue
            return row
        return None

    def find_invite(self, campaign_id, user_id):
        for row in self.store.rows("share_unlock_invites"):
            if str(row.get("campaign_id")) == str(campaign_id) and str(row.get("referrer_user_id")) == str(user_id):
                return row
        return None

    def find_invite_by_link(self, invite_link, invite_name):
        for row in self.store.rows("share_unlock_invites"):
            if invite_link and str(row.get("invite_link") or "") == str(invite_link):
                return row
            if invite_name and str(row.get("invite_name") or "") == str(invite_name):
                return row
        return None

    def ensure_personal_invite(self, campaign, user_id):
        existing = self.find_invite(campaign.get("id"), user_id)
        if existing and existing.get("invite_link"):
            return existing
        invite_name = f"su:{campaign.get('id')}:{user_id}"
        link = self.bot.create_chat_invite_link(str(campaign.get("source_chat_id")), name=invite_name)
        invite_link = getattr(link, "invite_link", "") or ""
        row = {
            "campaign_id": campaign.get("id"),
            "referrer_user_id": str(user_id),
            "source_chat_id": str(campaign.get("source_chat_id") or ""),
            "invite_link": invite_link,
            "invite_name": invite_name,
            "active": True,
        }
        if existing and existing.get("id"):
            self.store.update("share_unlock_invites", existing.get("id"), {**existing, **row})
            return {**existing, **row}
        return self.store.insert("share_unlock_invites", row)

    def progress(self, campaign, user_id):
        count = 0
        for row in self.store.rows("share_unlock_referrals"):
            if str(row.get("campaign_id")) == str(campaign.get("id")) and str(row.get("referrer_user_id")) == str(user_id) and as_bool(row.get("counted"), True):
                count += 1
        required = max(1, as_int(campaign.get("required_invites"), 5))
        invite_row = self.find_invite(campaign.get("id"), user_id)
        unlocked = bool(invite_row and invite_row.get("unlocked_at")) or count >= required
        return {
            "count": count,
            "required": required,
            "unlocked": unlocked,
            "remaining": max(required - count, 0),
        }

    def deliver_unlock_if_ready(self, campaign, invite_row):
        progress = self.progress(campaign, invite_row.get("referrer_user_id"))
        if not progress["unlocked"]:
            return
        if invite_row.get("reward_sent_at"):
            return
        reward_text = self.render_unlock_text(campaign, progress)
        sent = self.safe_send(invite_row.get("referrer_user_id"), reward_text, self.reward_markup(campaign))
        values = {
            **invite_row,
            "unlocked_at": invite_row.get("unlocked_at") or self.now_iso(),
        }
        if sent:
            values["reward_sent_at"] = self.now_iso()
            values["reward_message_id"] = str(getattr(sent, "message_id", "") or "")
        self.store.update("share_unlock_invites", invite_row.get("id"), values)

    def render_share_card(self, campaign, progress, invite_link):
        title = escape(str(campaign.get("title") or "Mở khóa"))
        description = escape(str(campaign.get("description") or ""))
        source_group = escape(self.group_name(campaign.get("source_chat_id")) or str(campaign.get("source_chat_id") or ""))
        invite_link = escape(invite_link or "Chưa tạo")
        message = campaign.get("share_message") or "Mời đủ {required} người vào {group} bằng link riêng của bạn để mở khóa."
        try:
            intro = str(message).format(required=progress["required"], group=source_group, count=progress["count"], remaining=progress["remaining"])
        except Exception:
            intro = str(message)
        return (
            f"<b>{title}</b>\n"
            f"{intro}\n\n"
            f"Group nguồn: <b>{source_group}</b>\n"
            f"Tiến độ: <b>{progress['count']}/{progress['required']}</b>\n"
            f"Còn lại: <b>{progress['remaining']}</b>\n"
            f"Link riêng: <code>{invite_link}</code>\n"
            f"{description}"
        )

    def render_unlock_text(self, campaign, progress):
        reward = str(campaign.get("unlock_target_value") or "").strip()
        message = campaign.get("unlock_message") or "Bạn đã đủ điều kiện mở khóa. Đây là link của bạn: {reward}"
        try:
            body = str(message).format(
                reward=reward,
                required=progress["required"],
                count=progress["count"],
                title=str(campaign.get("title") or "Mở khóa"),
            )
        except Exception:
            body = str(message)
        return f"<b>Da mo khoa</b>\n{escape(body).replace(escape(reward), reward)}"

    def share_markup(self, campaign, invite_link):
        markup = telebot.types.InlineKeyboardMarkup()
        if invite_link:
            markup.add(telebot.types.InlineKeyboardButton(text="Mo link rieng", url=invite_link))
        markup.add(
            telebot.types.InlineKeyboardButton(text="Lay link", callback_data=f"shareunlock:link:{campaign.get('id')}"),
            telebot.types.InlineKeyboardButton(text="Tien do", callback_data=f"shareunlock:progress:{campaign.get('id')}"),
        )
        return markup

    def reward_markup(self, campaign):
        reward = str(campaign.get("unlock_target_value") or "").strip()
        target_type = str(campaign.get("unlock_target_type") or "invite_link").strip().lower()
        if target_type not in {"invite_link", "url"} or not reward.startswith(("http://", "https://", "tg://", "t.me/")):
            return None
        markup = telebot.types.InlineKeyboardMarkup()
        markup.add(telebot.types.InlineKeyboardButton(text="Mo khoa ngay", url=reward))
        return markup

    def group_name(self, chat_id):
        for row in self.store.enabled_rows("groups"):
            if str(row.get("group_id") or row.get("chat_id") or "") == str(chat_id):
                return str(row.get("group_name") or "")
        return ""

    def command_text(self, message):
        parts = (message.text or "").split(maxsplit=1)
        return parts[1].strip() if len(parts) > 1 else ""

    def now_iso(self):
        return datetime.now(timezone.utc).isoformat()

    def reply(self, message, text):
        try:
            self.bot.reply_to(message, text)
        except Exception:
            pass

    def reply_html(self, message, text, reply_markup=None):
        try:
            self.bot.reply_to(message, text, parse_mode="HTML", reply_markup=reply_markup, disable_web_page_preview=True)
        except Exception:
            self.reply(message, text)

    def safe_send(self, chat_id, text, reply_markup=None):
        try:
            return self.bot.send_message(chat_id, text, parse_mode="HTML", reply_markup=reply_markup, disable_web_page_preview=True)
        except Exception:
            return None
