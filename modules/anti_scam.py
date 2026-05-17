import re

from modules.base import BotModule


class AntiScamModule(BotModule):
    name = "anti_scam"
    priority = 20

    def register(self):
        self.bot.message_handler(commands=["check", "kiemtra", "tra"])(self.handle_check)
        self.bot.message_handler(commands=["report", "baocao"])(self.handle_report)
        self.bot.message_handler(commands=["addscam", "themscam"])(self.handle_add_scam)

    def is_enabled(self):
        return self.module_enabled("anti_scam", True)

    def module_enabled(self, module_key, default=True):
        for row in self.store.enabled_rows("module_settings"):
            if (row.get("module_key") or "").strip() == module_key:
                return str(row.get("enabled", default)).lower() in {"1", "true", "yes", "on"}
        return default

    def handle_check(self, message):
        if getattr(message.chat, "type", "") != "private":
            return
        query = self.command_text(message)
        if not query:
            self.reply(message, "Gửi: /check uid, username, số tài khoản hoặc số điện thoại cần tra cứu.")
            return

        matches = self.find_scam_entities(query)
        if not matches:
            self.reply(message, f"Chưa thấy dữ liệu scam cho: {query}")
            return

        lines = ["Kết quả tra cứu:"]
        for row in matches[:5]:
            lines.extend([
                "",
                f"Trạng thái: {row.get('risk_level') or row.get('status') or 'scam'}",
                f"UID: {row.get('uid') or '-'}",
                f"Username: {row.get('username') or '-'}",
                f"Số tài khoản: {row.get('bank_account') or '-'}",
                f"SĐT: {row.get('phone') or '-'}",
                f"Lý do: {row.get('reason') or '-'}",
            ])
        self.reply(message, "\n".join(lines))

    def handle_report(self, message):
        if getattr(message.chat, "type", "") != "private":
            return
        text = self.command_text(message)
        if not text:
            self.reply(message, "Gửi: /report nội dung báo cáo, UID/username/số tài khoản và bằng chứng.")
            return

        parsed = self.parse_report_text(text)
        reporter = message.from_user
        row = self.store.insert("scam_reports", {
            "reporter_user_id": str(reporter.id),
            "reporter_username": getattr(reporter, "username", "") or "",
            "target_uid": parsed.get("uid", ""),
            "target_username": parsed.get("username", ""),
            "bank_account": parsed.get("bank_account", ""),
            "phone": parsed.get("phone", ""),
            "evidence": text,
            "status": "pending",
        })
        self.reply(message, f"Đã ghi nhận báo cáo #{row.get('id', '-')}. Admin sẽ kiểm tra và xác nhận.")
        self.notify_review_channel(row, text)

    def handle_add_scam(self, message):
        if not self.is_admin(message.chat.id, message.from_user.id):
            self.reply(message, "Lệnh này chỉ dành cho admin.")
            return
        text = self.command_text(message)
        if not text:
            self.reply(message, "Gửi: /addscam uid | username | số tài khoản | lý do")
            return
        parts = [part.strip() for part in re.split(r"[|,\n]", text) if part.strip()]
        row = self.store.insert("scam_entities", {
            "uid": parts[0] if len(parts) > 0 and parts[0].isdigit() else "",
            "username": parts[1] if len(parts) > 1 else "",
            "bank_account": parts[2] if len(parts) > 2 else "",
            "reason": parts[3] if len(parts) > 3 else text,
            "risk_level": "scam",
            "status": "confirmed",
            "source": f"admin:{message.from_user.id}",
            "enabled": True,
        })
        self.reply(message, f"Đã thêm dữ liệu scam #{row.get('id', '-')}.")

    def find_scam_entities(self, query):
        normalized = query.strip().lower().lstrip("@")
        matches = []
        for row in self.store.enabled_rows("scam_entities"):
            candidates = [
                row.get("uid"),
                (row.get("username") or "").lower().lstrip("@"),
                row.get("bank_account"),
                row.get("phone"),
                (row.get("name") or "").lower(),
            ]
            if any(str(item).strip().lower().lstrip("@") == normalized for item in candidates if item):
                matches.append(row)
        return matches

    def parse_report_text(self, text):
        username_match = re.search(r"@([a-zA-Z0-9_]{5,})", text)
        numbers = re.findall(r"\b\d{6,}\b", text)
        phone = next((item for item in numbers if len(item) in {9, 10, 11}), "")
        bank_account = next((item for item in numbers if item != phone), "")
        return {
            "username": username_match.group(1) if username_match else "",
            "uid": numbers[0] if numbers else "",
            "phone": phone,
            "bank_account": bank_account,
        }

    def notify_review_channel(self, row, text):
        channel_id = self.store.value("scam_review_channel_id", "")
        if not channel_id:
            return
        try:
            self.bot.send_message(channel_id, f"Báo cáo scam mới #{row.get('id', '-')}:\n{text}")
        except Exception:
            return

    def is_admin(self, chat_id, user_id):
        if int(user_id) in self.settings.owner_ids:
            return True
        for row in self.store.enabled_rows("admins"):
            row_chat = row.get("chat_id")
            if row_chat and row_chat != str(chat_id):
                continue
            if row.get("user_id") == str(user_id) and row.get("role") in {"owner", "mod"}:
                return True
        return False

    def command_text(self, message):
        return (message.text or "").split(maxsplit=1)[1].strip() if len((message.text or "").split(maxsplit=1)) > 1 else ""

    def reply(self, message, text):
        try:
            self.bot.reply_to(message, text)
        except Exception:
            pass
