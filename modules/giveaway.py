import json
import random
from html import escape

import telebot

from core.utils import as_int
from modules.base import BotModule


class GiveawayModule(BotModule):
    name = "giveaway"
    priority = 35

    def register(self):
        self.bot.message_handler(commands=["giveaway", "taogiveaway"])(self.active(self.handle_create))
        self.bot.message_handler(commands=["giveaways", "giveawaylist"])(self.active(self.handle_list))
        self.bot.message_handler(commands=["join", "thamgia"])(self.active(self.handle_join))
        self.bot.message_handler(commands=["draw", "quayso"])(self.active(self.handle_draw))
        self.bot.message_handler(commands=["closegiveaway", "donggiveaway"])(self.active(self.handle_close))
        self.bot.callback_query_handler(func=lambda call: (call.data or "").startswith("giveaway_join:"))(self.active(self.handle_join_callback))

    def is_enabled(self):
        return self.module_enabled("giveaway", True)

    def module_enabled(self, module_key, default=True):
        for row in self.store.enabled_rows("module_settings"):
            if (row.get("module_key") or "").strip() == module_key:
                return str(row.get("enabled", default)).lower() in {"1", "true", "yes", "on"}
        return default

    def handle_create(self, message):
        if not self.is_admin(message.chat.id, message.from_user.id):
            self.reply(message, self.text("admin_only_text", "Lệnh này chỉ dành cho admin."))
            return
        parts = self.command_text(message).split("|")
        title = parts[0].strip() if parts and parts[0].strip() else "Giveaway"
        prize = parts[1].strip() if len(parts) > 1 else ""
        winner_count = as_int(parts[2], 1) if len(parts) > 2 else 1
        row = self.store.insert("giveaway_campaigns", {
            "chat_id": str(message.chat.id),
            "title": title,
            "prize": prize,
            "description": "",
            "status": "open",
            "winner_count": max(winner_count, 1),
            "require_keyword": "",
            "enabled": True,
            "notes": json.dumps({
                "join_message": self.default_join_message(),
                "result_message": self.default_result_message(),
                "buttons_text": self.default_buttons_text(),
                "created_by": message.from_user.id,
            }, ensure_ascii=False),
        })
        self.send_campaign_card(message, row)

    def handle_list(self, message):
        rows = [
            row for row in self.store.enabled_rows("giveaway_campaigns")
            if str(row.get("chat_id")) == str(message.chat.id) and row.get("status") == "open"
        ]
        if not rows:
            self.reply(message, self.text("giveaway_empty_text", "Hiện chưa có giveaway đang mở."))
            return
        lines = [
            f"#{row.get('id')} - {row.get('title')} | Quà: {row.get('prize') or '-'} | /join {row.get('id')}"
            for row in rows[:10]
        ]
        self.reply(message, self.text("giveaway_list_title", "Giveaway đang mở:") + "\n" + "\n".join(lines))

    def handle_join(self, message):
        text = self.command_text(message).strip()
        giveaway_id, join_note = self.split_join_text(text)
        if not giveaway_id:
            self.reply(message, self.text("giveaway_join_usage_text", "Gửi: /join <giveaway_id>"))
            return
        campaign = self.find_campaign(giveaway_id, message.chat.id)
        if not campaign:
            self.reply(message, self.text("giveaway_not_found_open_text", "Không tìm thấy giveaway đang mở."))
            return
        required = (campaign.get("require_keyword") or "").strip().lower()
        if required and required not in join_note.lower():
            self.reply(message, self.text("giveaway_keyword_required_text", "Giveaway này yêu cầu nhập từ khóa: /join {id} {keyword}", id=giveaway_id, keyword=required))
            return
        user = message.from_user
        try:
            row = self.store.insert("giveaway_entries", {
                "giveaway_id": as_int(giveaway_id),
                "chat_id": str(message.chat.id),
                "user_id": str(user.id),
                "username": getattr(user, "username", "") or "",
                "display_name": self.display_name(user),
                "entry_note": join_note,
            })
            self.reply(message, self.text("giveaway_joined_text", "Đã ghi nhận tham gia giveaway #{id}. Mã lượt: {entry_id}", id=giveaway_id, entry_id=row.get("id")))
        except Exception:
            self.reply(message, self.text("giveaway_join_duplicate_text", "Bạn đã tham gia giveaway này rồi hoặc dữ liệu chưa hợp lệ."))

    def handle_draw(self, message):
        if not self.is_admin(message.chat.id, message.from_user.id):
            self.reply(message, self.text("admin_only_text", "Lệnh này chỉ dành cho admin."))
            return
        giveaway_id = self.command_text(message).strip()
        if not giveaway_id:
            self.reply(message, self.text("giveaway_draw_usage_text", "Gửi: /draw <giveaway_id>"))
            return
        campaign = self.find_campaign(giveaway_id, message.chat.id, allow_closed=True)
        if not campaign:
            self.reply(message, self.text("giveaway_not_found_text", "Không tìm thấy giveaway."))
            return
        entries = [
            row for row in self.store.enabled_rows("giveaway_entries")
            if str(row.get("giveaway_id")) == str(giveaway_id) and str(row.get("chat_id")) == str(message.chat.id)
        ]
        if not entries:
            self.reply(message, self.text("giveaway_no_entries_text", "Giveaway chưa có người tham gia."))
            return
        winner_count = min(as_int(campaign.get("winner_count"), 1), len(entries))
        winners = random.sample(entries, winner_count)
        winner_lines = [
            f"{index}. {self.escape_html(row.get('display_name') or row.get('username') or row.get('user_id'))} ({self.escape_html(row.get('user_id'))})"
            for index, row in enumerate(winners, start=1)
        ]
        winner_text = "\n".join(winner_lines)
        self.store.update("giveaway_campaigns", giveaway_id, {
            "status": "drawn",
            "winners": winner_text,
        })
        notes = self.campaign_notes(campaign)
        result_message = self.render_template(
            notes.get("result_message") or self.default_result_message(),
            campaign,
            winners=winner_text,
        )
        self.reply_html(
            message,
            result_message,
            reply_markup=self.build_markup(notes, campaign, joined=False, drawn=True),
        )

    def handle_close(self, message):
        if not self.is_admin(message.chat.id, message.from_user.id):
            self.reply(message, self.text("admin_only_text", "Lệnh này chỉ dành cho admin."))
            return
        giveaway_id = self.command_text(message).strip()
        if not giveaway_id:
            self.reply(message, self.text("giveaway_close_usage_text", "Gửi: /closegiveaway <giveaway_id>"))
            return
        campaign = self.find_campaign(giveaway_id, message.chat.id, allow_closed=True)
        if not campaign:
            self.reply(message, self.text("giveaway_not_found_text", "Không tìm thấy giveaway."))
            return
        self.store.update("giveaway_campaigns", giveaway_id, {"status": "closed"})
        self.reply(message, self.text("giveaway_closed_text", "Đã đóng giveaway #{id}.", id=giveaway_id))

    def handle_join_callback(self, call):
        try:
            giveaway_id = str(call.data or "").split(":", 1)[1]
        except Exception:
            return
        message = call.message
        if not message:
            return
        campaign = self.find_campaign(giveaway_id, message.chat.id)
        if not campaign:
            self.bot.answer_callback_query(call.id, "Không tìm thấy giveaway đang mở.")
            return
        user = call.from_user
        try:
            self.store.insert("giveaway_entries", {
                "giveaway_id": as_int(giveaway_id),
                "chat_id": str(message.chat.id),
                "user_id": str(user.id),
                "username": getattr(user, "username", "") or "",
                "display_name": self.display_name(user),
                "entry_note": "callback_join",
            })
            self.bot.answer_callback_query(call.id, "Đã tham gia giveaway.")
        except Exception:
            self.bot.answer_callback_query(call.id, "Bạn đã tham gia rồi hoặc dữ liệu chưa hợp lệ.")

    def find_campaign(self, giveaway_id, chat_id, allow_closed=False):
        for row in self.store.enabled_rows("giveaway_campaigns"):
            if str(row.get("id")) != str(giveaway_id):
                continue
            if str(row.get("chat_id")) != str(chat_id):
                continue
            if not allow_closed and row.get("status") != "open":
                continue
            return row
        return None

    def campaign_notes(self, row):
        raw = row.get("notes") or ""
        if not raw:
            return {}
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}

    def default_join_message(self):
        return "🎉 <b>GIVEAWAY</b> 🎉\n\n🎁 Phần thưởng: {prize}\n🏆 Số người thắng: {winner_count}\n👥 Group: {group}\n👇 Nhấn nút bên dưới để tham gia!"

    def default_result_message(self):
        return "🎉 <b>CHÚC MỪNG NGƯỜI CHIẾN THẮNG!</b>\n\n🏆 Danh sách:\n{winners}\n\n🎁 Phần thưởng: {prize}\n⭐ Số người thắng: {winner_count}\n👥 Group: {group}"

    def default_buttons_text(self):
        return "Tham Gia | giveaway_join"

    def render_template(self, template, row, **extra):
        values = {
            "id": row.get("id") or "",
            "title": self.escape_html(row.get("title") or ""),
            "prize": self.escape_html(row.get("prize") or ""),
            "group": self.escape_html(row.get("group_name") or self.campaign_notes(row).get("group_name") or row.get("chat_id") or ""),
            "group_id": self.escape_html(row.get("chat_id") or ""),
            "winner_count": row.get("winner_count") or 1,
            "description": self.escape_html(row.get("description") or ""),
            "winners": extra.get("winners", ""),
            "sponsor": self.escape_html(row.get("notes") or ""),
        }
        values.update(extra)
        try:
            return str(template).format(**values)
        except Exception:
            return str(template)

    def build_markup(self, notes, campaign, joined=False, drawn=False):
        raw = notes.get("buttons_text") or ""
        buttons = []
        for line in str(raw).splitlines():
            line = line.strip()
            if not line or "|" not in line:
                continue
            label, target = [part.strip() for part in line.split("|", 1)]
            if not label or not target:
                continue
            target = target.format(id=campaign.get("id") or "", title=campaign.get("title") or "")
            if target.startswith("/join") or target.startswith("giveaway_join"):
                buttons.append(telebot.types.InlineKeyboardButton(text=label, callback_data=f"giveaway_join:{campaign.get('id')}"))
            elif target.startswith("http://") or target.startswith("https://"):
                buttons.append(telebot.types.InlineKeyboardButton(text=label, url=target))
        if not buttons or drawn:
            return None
        markup = telebot.types.InlineKeyboardMarkup()
        for button in buttons:
            markup.add(button)
        return markup

    def send_campaign_card(self, message, campaign):
        notes = self.campaign_notes(campaign)
        join_message = self.render_template(
            notes.get("join_message") or self.default_join_message(),
            campaign,
        )
        markup = self.build_markup(notes, campaign)
        self.reply_html(message, join_message, reply_markup=markup)

    def is_admin(self, chat_id, user_id):
        if int(user_id) in self.settings.owner_ids:
            return True
        for row in self.store.enabled_rows("admins"):
            row_chat = row.get("chat_id")
            if row_chat and row_chat != str(chat_id):
                continue
            if row.get("user_id") == str(user_id) and row.get("role") in {"owner", "mod"}:
                return True
        try:
            member = self.bot.get_chat_member(chat_id, user_id)
            return member.status in {"creator", "administrator"}
        except Exception:
            return False

    def command_text(self, message):
        parts = (message.text or "").split(maxsplit=1)
        return parts[1].strip() if len(parts) > 1 else ""

    def split_join_text(self, text):
        parts = text.split(maxsplit=1)
        giveaway_id = parts[0].strip() if parts else ""
        join_note = parts[1].strip() if len(parts) > 1 else ""
        return giveaway_id, join_note

    def display_name(self, user):
        full_name = " ".join(part for part in (getattr(user, "first_name", ""), getattr(user, "last_name", "")) if part).strip()
        return full_name or getattr(user, "username", "") or str(user.id)

    def escape_html(self, value):
        return escape(str(value or ""))

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

    def text(self, key, default, **values):
        template = self.store.value(key, default)
        try:
            return str(template).format(**values)
        except Exception:
            return str(template)
