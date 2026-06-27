import re
import os
import json
import requests

from modules.base import BotModule
from core.utils import normalize_text


class AntiScamModule(BotModule):
    name = "anti_scam"
    priority = 20

    def register(self):
        self.bot.message_handler(commands=["check", "kiemtra", "tra"])(self.active(self.handle_check))
        self.bot.message_handler(commands=["report", "baocao"])(self.active(self.handle_report))
        self.bot.message_handler(commands=["addscam", "themscam"])(self.active(self.handle_add_scam))
        self.bot.message_handler(commands=["scamconfirm", "scamreject", "scamdup", "scamneed"])(self.active(self.handle_review_command))
        self.bot.message_handler(content_types=["photo", "document", "video"])(self.active(self.handle_media_report))

    def api_base_url(self):
        return (os.environ.get("SCAM_API_BASE_URL") or os.environ.get("CONTROL_PANEL_URL") or os.environ.get("NEXT_PUBLIC_SITE_URL") or "").rstrip("/")

    def api_password(self):
        return os.environ.get("SCAM_API_PASSWORD") or os.environ.get("CP_ADMIN_PASSWORD") or ""

    def api_headers(self):
        headers = {"content-type": "application/json", "accept": "application/json"}
        password = self.api_password()
        if password:
            headers["x-cp-password"] = password
        return headers

    def api_get(self, path, params=None):
        base = self.api_base_url()
        if not base:
            return None
        response = requests.get(f"{base}{path}", headers=self.api_headers(), params=params or {}, timeout=15)
        response.raise_for_status()
        return response.json()

    def api_post(self, path, payload):
        base = self.api_base_url()
        if not base:
            return None
        response = requests.post(f"{base}{path}", headers=self.api_headers(), json=payload, timeout=15)
        response.raise_for_status()
        return response.json()

    def api_patch(self, path, payload):
        base = self.api_base_url()
        if not base:
            return None
        response = requests.patch(f"{base}{path}", headers=self.api_headers(), json=payload, timeout=15)
        response.raise_for_status()
        return response.json()

    def review_group_id(self):
        return self.store.value("scam_review_group_id", "") or self.store.value("scam_review_channel_id", "")

    def telegram_file_url(self, file_id):
        token = os.environ.get("BOT_TOKEN") or os.environ.get("TELEGRAM_BOT_TOKEN") or ""
        if not token or not file_id:
            return ""
        try:
            response = requests.get(
                f"https://api.telegram.org/bot{token}/getFile",
                params={"file_id": file_id},
                timeout=15,
            )
            response.raise_for_status()
            payload = response.json()
            file_path = ((payload or {}).get("result") or {}).get("file_path") or ""
            if not file_path:
                return ""
            return f"https://api.telegram.org/file/bot{token}/{file_path}"
        except Exception:
            return ""

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
            self.reply(message, self.text("check_usage_text", "Gửi: /check uid, username, số tài khoản hoặc số điện thoại cần tra cứu."))
            return

        matches = self.lookup_scam(query)
        if not matches:
            self.reply(message, self.text("check_not_found_text", "Chưa thấy dữ liệu scam cho: {query}", query=query))
            return

        lines = [self.text("check_result_title", "Kết quả tra cứu:")]
        for row in matches[:5]:
            percent = row.get("scam_percent") or row.get("confidence_score") or row.get("risk_level") or "scam"
            lines.extend([
                "",
                f"Trạng thái: {row.get('risk_level') or row.get('status') or 'scam'}",
                f"Scam score: {percent}",
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
            self.reply(message, self.text("report_usage_text", "Gửi: /report nội dung báo cáo, UID/username/số tài khoản và bằng chứng."))
            return
        row = self.submit_report(message, text)
        self.reply(message, self.text("report_received_text", "Đã ghi nhận báo cáo #{id}. Admin sẽ kiểm tra và xác nhận.", id=row.get("id", "-")))
        self.notify_review_channel(row, text)

    def handle_media_report(self, message):
        if getattr(message.chat, "type", "") != "private":
            return
        caption = getattr(message, "caption", "") or ""
        if not caption.strip().startswith(("/report", "/baocao")):
            return
        text = self.command_text_from_text(caption)
        if not text:
            text = caption.strip()
        row = self.submit_report(message, text)
        self.reply(message, self.text("report_received_text", "Đã ghi nhận báo cáo #{id}. Admin sẽ kiểm tra và xác nhận.", id=row.get("id", "-")))
        self.notify_review_channel(row, text)

    def handle_review_command(self, message):
        if getattr(message.chat, "type", "") == "private":
            return
        if not self.is_admin(message.chat.id, message.from_user.id):
            return
        command = (message.text or "").split(maxsplit=1)[0].lstrip("/").lower()
        report = self.resolve_report_from_message(message)
        if not report:
            self.reply(message, self.text("admin_only_text", "Không tìm thấy report để xử lý."))
            return
        if command == "scamconfirm":
            self.confirm_report(report, message.from_user.id)
            self.reply(message, f"Đã xác nhận report #{report.get('id', '-')}.")
        elif command == "scamreject":
            self.reject_report(report, message.from_user.id, "")
            self.reply(message, f"Đã từ chối report #{report.get('id', '-')}.")
        elif command == "scamdup":
            self.duplicate_report(report, message.from_user.id, "")
            self.reply(message, f"Đã đánh dấu trùng report #{report.get('id', '-')}.")
        elif command == "scamneed":
            note = self.command_text(message) or "Vui lòng bổ sung thêm thông tin/bằng chứng."
            self.need_more_info_report(report, message.from_user.id, note)
            self.reply(message, f"Đã chuyển report #{report.get('id', '-')} sang cần bổ sung.")

    def handle_add_scam(self, message):
        if not self.is_admin(message.chat.id, message.from_user.id):
            self.reply(message, self.text("admin_only_text", "Lệnh này chỉ dành cho admin."))
            return
        text = self.command_text(message)
        if not text:
            self.reply(message, self.text("addscam_usage_text", "Gửi: /addscam uid | username | số tài khoản | lý do"))
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
        self.reply(message, self.text("addscam_success_text", "Đã thêm dữ liệu scam #{id}.", id=row.get("id", "-")))

    def resolve_report_from_message(self, message):
        text = message.text or ""
        match = re.search(r"#?(\d+)", text)
        report_id = match.group(1) if match else ""
        replied = getattr(message, "reply_to_message", None)
        if not report_id and replied:
            reply_text = getattr(replied, "text", "") or getattr(replied, "caption", "") or ""
            reply_match = re.search(r"Report\s*#(\d+)", reply_text, re.IGNORECASE)
            report_id = reply_match.group(1) if reply_match else ""
        if not report_id:
            return None
        try:
            payload = self.api_get("/api/scam_reports", params={"search": report_id, "limit": 20})
            for row in (payload or {}).get("rows", []):
                if str(row.get("id") or "") == str(report_id):
                    return row
        except Exception:
            pass
        return None

    def lookup_scam(self, query):
        try:
            payload = self.api_get("/api/scam_lookup", params={"q": query})
            if payload and isinstance(payload.get("matches"), list):
                return self.rank_matches(payload["matches"], query)
        except Exception:
            pass

        normalized = query.strip().lower().lstrip("@")
        matches = []
        for row in self.store.enabled_rows("scam_entities"):
            candidates = [
                row.get("uid"),
                row.get("normalized_uid"),
                (row.get("username") or "").lower().lstrip("@"),
                row.get("normalized_username"),
                row.get("bank_account"),
                row.get("normalized_bank_account"),
                row.get("phone"),
                row.get("normalized_phone"),
                (row.get("name") or "").lower(),
                row.get("normalized_name"),
            ]
            if any(normalize_text(str(item or "")) == normalize_text(normalized) for item in candidates if item):
                matches.append(row)
        return self.rank_matches(matches, query)

    def rank_matches(self, rows, query):
        normalized = self.normalize_value(query)
        ranked = []
        for row in rows:
            tokens = [
                row.get("normalized_uid"),
                row.get("normalized_username"),
                row.get("normalized_bank_account"),
                row.get("normalized_phone"),
                row.get("normalized_name"),
                row.get("uid"),
                row.get("username"),
                row.get("bank_account"),
                row.get("phone"),
                row.get("name"),
            ]
            tokens = [self.normalize_value(item) for item in tokens if item]
            exact = any(token == normalized for token in tokens)
            contains = any(normalized and normalized in token for token in tokens)
            exact_count = sum(1 for token in tokens if token == normalized)
            score = int(row.get("scam_percent") or row.get("confidence_score") or 0)
            if exact:
                score += 100
            elif contains:
                score += 30
            if exact_count > 1:
                score += min(20, exact_count * 5)
            if str(row.get("status") or "").lower() == "confirmed":
                score += 20
            if str(row.get("result_type") or "") == "alias":
                score += 10
            ranked.append((score, row))
        ranked.sort(key=lambda item: item[0], reverse=True)
        return [row for _, row in ranked]

    def normalize_value(self, value):
        return normalize_text(str(value or "")).replace(" ", "").replace(".", "").replace("-", "").replace("_", "")

    def create_report(self, payload):
        try:
            created = self.api_post("/api/scam_reports", payload)
            if created and created.get("row"):
                return created["row"]
        except Exception:
            pass
        return self.store.insert("scam_reports", payload)

    def submit_report(self, message, text):
        parsed = self.parse_report_text(text)
        reporter = message.from_user
        attachments = self.extract_attachments(message)
        duplicates = self.find_duplicate_candidates(parsed)
        media_group_id = getattr(message, "media_group_id", None)
        payload = {
            "reporter_user_id": str(reporter.id),
            "reporter_username": getattr(reporter, "username", "") or "",
            "reporter_chat_id": str(message.chat.id),
            "source_chat_id": str(message.chat.id),
            "source_message_id": str(message.message_id),
            "target_uid": parsed.get("uid", ""),
            "target_username": parsed.get("username", ""),
            "target_name": parsed.get("name", ""),
            "bank_account": parsed.get("bank_account", ""),
            "phone": parsed.get("phone", ""),
            "group_name": getattr(message.chat, "title", "") or "",
            "group_id": str(message.chat.id),
            "scammer_name": parsed.get("name", ""),
            "admin_name": parsed.get("admin_name", ""),
            "reason": parsed.get("reason", "") or text,
            "notes": parsed.get("notes", ""),
            "evidence_text": text,
            "evidence_payload": {
                "raw_text": text,
                "files": attachments,
                "duplicates": duplicates,
                "media_group_id": media_group_id or "",
            },
            "attachment_count": len(attachments),
            "confidence_score": self.compute_report_score(parsed, text, attachments, duplicates),
            "scam_percent": self.compute_report_score(parsed, text, attachments, duplicates),
            "status": "pending",
        }
        if duplicates:
            payload["notes"] = self.append_note(payload.get("notes", ""), f"Phát hiện {len(duplicates)} candidate trùng.")
        row = self.create_report(payload)
        self.send_report_to_review_group(row)
        return row

    def extract_attachments(self, message):
        attachments = []
        file_specs = [
            ("photo", getattr(message, "photo", None)),
            ("document", getattr(message, "document", None)),
            ("video", getattr(message, "video", None)),
        ]
        for media_type, items in file_specs:
            if not items:
                continue
            if media_type == "photo":
                for item in items:
                    attachments.append({
                        "media_type": "photo",
                        "telegram_file_id": getattr(item, "file_id", ""),
                        "telegram_file_unique_id": getattr(item, "file_unique_id", ""),
                        "file_size": getattr(item, "file_size", None),
                        "width": getattr(item, "width", None),
                        "height": getattr(item, "height", None),
                        "caption": getattr(message, "caption", "") or "",
                    })
            else:
                item = items
                attachments.append({
                    "media_type": media_type,
                    "telegram_file_id": getattr(item, "file_id", ""),
                    "telegram_file_unique_id": getattr(item, "file_unique_id", ""),
                    "file_name": getattr(item, "file_name", "") or "",
                    "mime_type": getattr(item, "mime_type", "") or "",
                    "file_size": getattr(item, "file_size", None),
                    "caption": getattr(message, "caption", "") or "",
                })
        return attachments

    def find_duplicate_candidates(self, parsed):
        candidates = []
        keys = [parsed.get("uid"), parsed.get("username"), parsed.get("bank_account"), parsed.get("phone"), parsed.get("name")]
        search_terms = [term for term in keys if term]
        if not search_terms:
            return []
        query = " ".join(search_terms)
        try:
            payload = self.api_get("/api/scam_lookup", params={"q": query})
            for item in (payload or {}).get("matches", [])[:5]:
                if item.get("result_type") in {"entity", "report"}:
                    candidates.append({
                        "id": item.get("id"),
                        "result_type": item.get("result_type"),
                        "status": item.get("status"),
                        "score": item.get("scam_percent") or item.get("confidence_score") or 0,
                        "matched_on": item.get("matched_on") or "",
                    })
        except Exception:
            pass
        return candidates

    def compute_report_score(self, parsed, text, attachments=None, duplicates=None):
        attachments = attachments or []
        duplicates = duplicates or []
        score = 15
        if parsed.get("uid"):
            score += 20
        if parsed.get("username"):
            score += 15
        if parsed.get("bank_account"):
            score += 20
        if parsed.get("phone"):
            score += 15
        if parsed.get("name"):
            score += 10
        if attachments:
            score += min(15, len(attachments) * 5)
        if duplicates:
            score += min(20, len(duplicates) * 10)
            if any(item.get("result_type") == "entity" for item in duplicates):
                score += 10
        if parsed.get("bank_account") and parsed.get("uid"):
            score += 10
        if parsed.get("username") and parsed.get("bank_account"):
            score += 5
        if text:
            score += min(10, len(text.split()) // 6)
        return min(score, 100)

    def parse_report_text(self, text):
        username_match = re.search(r"@([a-zA-Z0-9_]{5,})", text)
        numbers = re.findall(r"\b\d{6,}\b", text)
        phone = next((item for item in numbers if len(item) in {9, 10, 11}), "")
        bank_account = next((item for item in numbers if item != phone), "")
        name_match = re.search(r"(?:ten|name|scammer)\s*[:=]\s*([^\n|,;]+)", text, re.IGNORECASE)
        reason_match = re.search(r"(?:ly do|reason)\s*[:=]\s*([^\n|,;]+)", text, re.IGNORECASE)
        notes_match = re.search(r"(?:ghi chu|note|notes)\s*[:=]\s*([^\n|,;]+)", text, re.IGNORECASE)
        admin_match = re.search(r"(?:admin)\s*[:=]\s*([^\n|,;]+)", text, re.IGNORECASE)
        return {
            "username": username_match.group(1) if username_match else "",
            "uid": numbers[0] if numbers else "",
            "phone": phone,
            "bank_account": bank_account,
            "name": name_match.group(1).strip() if name_match else "",
            "reason": reason_match.group(1).strip() if reason_match else "",
            "notes": notes_match.group(1).strip() if notes_match else "",
            "admin_name": admin_match.group(1).strip() if admin_match else "",
        }

    def notify_review_channel(self, row, text):
        channel_id = self.review_group_id()
        if not channel_id:
            return
        try:
            attachments = row.get("evidence_payload", {}).get("files", []) if isinstance(row.get("evidence_payload"), dict) else []
            attachment_lines = []
            for item in attachments[:3]:
                attachment_lines.append(f"- {item.get('media_type', 'file')}: {item.get('telegram_file_id', '-')}")
            body = self.text(
                "scam_review_channel_text",
                "Báo cáo scam mới #{id}:\n{text}",
                id=row.get("id", "-"),
                text=text,
            )
            if attachment_lines:
                body = f"{body}\n\nBằng chứng:\n" + "\n".join(attachment_lines)
            self.bot.send_message(channel_id, body)
            for item in attachments[:3]:
                file_id = item.get("telegram_file_id") or ""
                media_type = item.get("media_type") or "photo"
                if not file_id:
                    continue
                try:
                    if media_type == "photo":
                        self.bot.send_photo(channel_id, file_id, caption=item.get("caption") or "", **self.link_preview_kwargs(True))
                    elif media_type == "document":
                        self.bot.send_document(channel_id, file_id, caption=item.get("caption") or "", **self.link_preview_kwargs(True))
                    elif media_type == "video":
                        self.bot.send_video(channel_id, file_id, caption=item.get("caption") or "", **self.link_preview_kwargs(True))
                except Exception:
                    continue
        except Exception:
            return

    def send_report_to_review_group(self, row):
        group_id = self.review_group_id()
        if not group_id:
            return
        attachments = []
        evidence = row.get("evidence_payload", {})
        if isinstance(evidence, dict):
            attachments = evidence.get("files", []) or []
        header = self.text(
            "scam_review_channel_text",
            "Báo cáo scam mới #{id}:\n{text}",
            id=row.get("id", "-"),
            text=row.get("evidence_text") or row.get("reason") or "",
        )
        footer = f"\n\nLệnh: /scamconfirm #{row.get('id', '-')}\n/scamreject #{row.get('id', '-')}\n/scamdup #{row.get('id', '-')}\n/scamneed #{row.get('id', '-')}"
        try:
            self.bot.send_message(group_id, header + footer)
            for item in attachments[:10]:
                file_id = item.get("telegram_file_id") or ""
                if not file_id:
                    continue
                caption = item.get("caption") or f"Report #{row.get('id', '-')}"
                try:
                    if item.get("media_type") == "document":
                        self.bot.send_document(group_id, file_id, caption=caption, **self.link_preview_kwargs(True))
                    elif item.get("media_type") == "video":
                        self.bot.send_video(group_id, file_id, caption=caption, **self.link_preview_kwargs(True))
                    else:
                        self.bot.send_photo(group_id, file_id, caption=caption, **self.link_preview_kwargs(True))
                except Exception:
                    continue
        except Exception:
            return

    def confirm_report(self, report, reviewer_id):
        payload = {
            "reviewed_by": str(reviewer_id),
            "reason": report.get("admin_note") or report.get("reason") or "Xác nhận từ báo cáo thành viên",
            "scam_percent": report.get("scam_percent") or report.get("confidence_score") or 100,
            "confidence_score": report.get("confidence_score") or report.get("scam_percent") or 100,
        }
        try:
            self.api_post(f"/api/scam_reports/{report.get('id')}/confirm", payload)
        except Exception:
            pass

    def reject_report(self, report, reviewer_id, note):
        try:
            self.api_post(f"/api/scam_reports/{report.get('id')}/reject", {"reviewed_by": str(reviewer_id), "admin_note": note or ""})
        except Exception:
            pass

    def duplicate_report(self, report, reviewer_id, note):
        try:
            self.api_post(f"/api/scam_reports/{report.get('id')}/duplicate", {"reviewed_by": str(reviewer_id), "admin_note": note or "", "duplicate_of": report.get("duplicate_of") or ""})
        except Exception:
            pass

    def need_more_info_report(self, report, reviewer_id, note):
        try:
            self.api_post(f"/api/scam_reports/{report.get('id')}/need-more-info", {"reviewed_by": str(reviewer_id), "admin_note": note or ""})
        except Exception:
            pass

    def send_follow_up(self, report_row, admin_note):
        chat_id = report_row.get("reporter_chat_id") or report_row.get("source_chat_id")
        if not chat_id:
            return False
        try:
            body = self.text(
                "scam_report_need_more_info_text",
                "Báo cáo #{id} cần bổ sung:\n{note}",
                id=report_row.get("id", "-"),
                note=admin_note or "Vui lòng gửi thêm bill/ảnh group/UID/số tài khoản để admin duyệt.",
            )
            self.bot.send_message(chat_id, body)
            return True
        except Exception:
            return False

    def request_media_path(self, file_id):
        return self.telegram_file_url(file_id)

    def append_note(self, current, addition):
        current = (current or "").strip()
        addition = (addition or "").strip()
        if not current:
            return addition
        if not addition:
            return current
        return f"{current}\n{addition}"

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
        source = getattr(message, "text", "") or getattr(message, "caption", "") or ""
        return self.command_text_from_text(source)

    def command_text_from_text(self, source):
        parts = (source or "").split(maxsplit=1)
        return parts[1].strip() if len(parts) > 1 else ""

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
