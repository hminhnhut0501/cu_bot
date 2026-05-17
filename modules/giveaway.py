import random

from core.utils import as_int
from modules.base import BotModule


class GiveawayModule(BotModule):
    name = "giveaway"
    priority = 35

    def register(self):
        self.bot.message_handler(commands=["giveaway", "taogiveaway"])(self.handle_create)
        self.bot.message_handler(commands=["giveaways", "giveawaylist"])(self.handle_list)
        self.bot.message_handler(commands=["join", "thamgia"])(self.handle_join)
        self.bot.message_handler(commands=["draw", "quayso"])(self.handle_draw)
        self.bot.message_handler(commands=["closegiveaway", "donggiveaway"])(self.handle_close)

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
            "status": "open",
            "winner_count": max(winner_count, 1),
            "enabled": True,
            "notes": f"created_by:{message.from_user.id}",
        })
        self.reply(
            message,
            self.text(
                "giveaway_created_text",
                "Đã tạo giveaway #{id}.\nTên: {title}\nPhần thưởng: {prize}\nTham gia bằng: /join {id}",
                id=row.get("id"),
                title=title,
                prize=prize or "-",
            ),
        )

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
        winner_text = "\n".join(
            f"- {row.get('display_name') or row.get('username') or row.get('user_id')} ({row.get('user_id')})"
            for row in winners
        )
        self.store.update("giveaway_campaigns", giveaway_id, {
            "status": "drawn",
            "winners": winner_text,
        })
        self.reply(message, self.text("giveaway_result_text", "Kết quả giveaway #{id}:\n{winners}", id=giveaway_id, winners=winner_text))

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

    def reply(self, message, text):
        try:
            self.bot.reply_to(message, text)
        except Exception:
            pass

    def text(self, key, default, **values):
        template = self.store.value(key, default)
        try:
            return str(template).format(**values)
        except Exception:
            return str(template)
