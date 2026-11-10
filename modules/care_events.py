import json
import logging
import re
import threading
import time
from datetime import datetime, timezone
from difflib import SequenceMatcher
from html import escape

import telebot
from telebot.types import InlineKeyboardButton, InlineKeyboardMarkup

from core.utils import as_bool, as_int, normalize_text
from modules.base import BotModule


LOGGER = logging.getLogger(__name__)


def calculate_month_bounds(dt=None):
    """Calculate the start and end of the current month in UTC."""
    if dt is None:
        dt = datetime.now(timezone.utc)
    start_at = datetime(dt.year, dt.month, 1, 0, 0, 0, tzinfo=timezone.utc)
    if dt.month == 12:
        next_month = datetime(dt.year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    else:
        next_month = datetime(dt.year, dt.month + 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    return start_at, next_month


class CareEventsModule(BotModule):
    name = "care_events"
    priority = 36

    def __init__(self, app):
        super().__init__(app)
        self._vote_locks = {}
        self._global_lock = threading.Lock()

    def register(self):
        # User & Group Commands
        self.bot.message_handler(commands=["dexuat", "nominate"])(self.active(self.handle_nominate_command))
        self.bot.message_handler(commands=["idol", "idols", "vote", "binhchon"])(self.active(self.handle_list_command))
        self.bot.message_handler(commands=["topidol", "bxh", "leaderboard"])(self.active(self.handle_leaderboard_command))

        # Admin Management Commands
        self.bot.message_handler(commands=["moduacare", "openseason"])(self.active(self.admin_only(self.handle_open_season_command)))
        self.bot.message_handler(commands=["chotcare", "closeseason"])(self.active(self.admin_only(self.handle_close_season_command)))

        # Inline Button Callbacks
        self.bot.callback_query_handler(func=lambda call: (call.data or "").startswith("care_vote:"))(
            self.active(self.handle_vote_callback)
        )
        self.bot.callback_query_handler(func=lambda call: (call.data or "").startswith("care_page:"))(
            self.active(self.handle_page_callback)
        )
        self.bot.callback_query_handler(func=lambda call: (call.data or "").startswith("care_top:"))(
            self.active(self.handle_top_callback)
        )
        self.bot.callback_query_handler(func=lambda call: (call.data or "").startswith("care_refresh:"))(
            self.active(self.handle_refresh_callback)
        )

    def is_enabled(self):
        return self.module_enabled("care_events", True)

    def module_enabled(self, module_key, default=True):
        for row in self.store.enabled_rows("module_settings"):
            if (row.get("module_key") or "").strip() == module_key:
                return str(row.get("enabled", default)).lower() in {"1", "true", "yes", "on"}
        return default

    def start(self):
        if not self.bot_active():
            return
        self.app.run_background("care-event-scheduler", self.scheduler_loop)

    def scheduler_loop(self):
        """Background loop to check and auto-close expired monthly seasons, then announce winners."""
        while True:
            try:
                time.sleep(300)  # Check every 5 minutes
                if not self.bot_active() or not self.is_enabled():
                    continue
                self.check_and_process_expired_seasons()
            except Exception as exc:
                LOGGER.warning("CareEvents scheduler loop encountered error: %s", exc)

    def get_lock(self, chat_id):
        with self._global_lock:
            if chat_id not in self._vote_locks:
                self._vote_locks[chat_id] = threading.Lock()
            return self._vote_locks[chat_id]

    # ==========================================
    # SEASON MANAGEMENT & STORAGE HELPERS
    # ==========================================

    def get_or_create_current_season(self, chat_id):
        """Find the active season for this group or auto-initialize a new monthly season."""
        chat_id_str = str(chat_id)
        now = datetime.now(timezone.utc)
        season_code = now.strftime("%Y-%m")

        # 1. Search existing open season in Supabase
        seasons = [
            s for s in self.store.rows("care_seasons")
            if str(s.get("chat_id") or "") == chat_id_str
            and s.get("status") == "open"
            and as_bool(s.get("enabled"), True)
        ]
        if seasons:
            # Sort by id desc to get latest
            seasons.sort(key=lambda s: int(s.get("id") or 0), reverse=True)
            active_season = seasons[0]
            # Verify if season is still within expiration date
            end_at_str = active_season.get("end_at")
            if end_at_str:
                try:
                    end_at = datetime.fromisoformat(str(end_at_str).replace("Z", "+00:00"))
                    if now < end_at:
                        return active_season
                except Exception:
                    return active_season

        # 2. Auto-create new season for this month
        start_at, end_at = calculate_month_bounds(now)
        title = f"Bình chọn Idol Tháng {now.month}/{now.year}"
        new_season = self.store.insert("care_seasons", {
            "bot_key": self.settings.bot_key,
            "chat_id": chat_id_str,
            "season_code": season_code,
            "title": title,
            "start_at": start_at.isoformat(),
            "end_at": end_at.isoformat(),
            "status": "open",
            "settings": json.dumps({
                "votes_per_user": 1,
                "min_member_days": 0,
                "allow_change_vote": True,
                "require_approval": False,
            }, ensure_ascii=False),
            "enabled": True,
        })
        LOGGER.info("Created new Care season '%s' for chat %s", title, chat_id_str)
        return new_season

    def get_season_idols(self, season_id, chat_id, only_approved=True):
        """Retrieve idols for a given season ordered by vote_count descending."""
        idols = [
            i for i in self.store.rows("care_idols")
            if str(i.get("season_id") or "") == str(season_id)
            and (not only_approved or i.get("status") in {"approved", "active"})
        ]
        idols.sort(key=lambda x: (int(x.get("vote_count") or 0), -int(x.get("id") or 0)), reverse=True)
        return idols

    def find_similar_idol(self, season_id, name):
        """Check if an idol with a very similar name already exists in this season."""
        norm_target = normalize_text(name).replace(" ", "")
        if not norm_target:
            return None

        idols = self.get_season_idols(season_id, None, only_approved=False)
        for idol in idols:
            existing_norm = normalize_text(idol.get("name") or "").replace(" ", "")
            if not existing_norm:
                continue
            if norm_target == existing_norm:
                return idol
            # Substring matching
            if len(norm_target) >= 4 and (norm_target in existing_norm or existing_norm in norm_target):
                return idol
            # Levenshtein similarity ratio
            ratio = SequenceMatcher(None, norm_target, existing_norm).ratio()
            if ratio >= 0.85:
                return idol
        return None

    # ==========================================
    # USER COMMAND HANDLERS
    # ==========================================

    def handle_nominate_command(self, message):
        """Handle member nominating a new idol: /dexuat <Tên Idol> | [Mô tả/Lý do]"""
        chat_id = message.chat.id
        user = message.from_user
        if not user:
            return

        text = (getattr(message, "text", "") or "").strip()
        parts = text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            self.bot.reply_to(
                message,
                "💡 <b>Hướng dẫn đề xuất Idol:</b>\n"
                "Gửi: <code>/dexuat Tên Idol | Mô tả hoặc lý do đề xuất</code>\n\n"
                "<i>Ví dụ: <code>/dexuat Sơn Tùng M-TP | Ca sĩ tài năng và phong độ</code></i>",
                parse_mode="HTML",
            )
            return

        payload = parts[1].strip()
        split_parts = payload.split("|", 1)
        idol_name = split_parts[0].strip()
        description = split_parts[1].strip() if len(split_parts) > 1 else ""

        if len(idol_name) < 2 or len(idol_name) > 60:
            self.bot.reply_to(message, "⚠️ Tên Idol phải có độ dài từ 2 đến 60 ký tự.")
            return

        lock = self.get_lock(chat_id)
        with lock:
            season = self.get_or_create_current_season(chat_id)
            if not season or season.get("status") != "open":
                self.bot.reply_to(message, "⚠️ Sự kiện bình chọn Idol hiện tại đang tạm đóng hoặc đã hết mùa.")
                return

            season_id = season.get("id")
            # Deduplication check
            duplicate = self.find_similar_idol(season_id, idol_name)
            if duplicate:
                dup_name = duplicate.get("name")
                dup_id = duplicate.get("id")
                dup_votes = duplicate.get("vote_count", 0)
                markup = InlineKeyboardMarkup()
                markup.add(
                    InlineKeyboardButton(f"⭐ Bấm để vote ngay cho {dup_name}", callback_data=f"care_vote:{season_id}:{dup_id}"),
                    InlineKeyboardButton("🏆 Xem Bảng Xếp Hạng", callback_data=f"care_top:{season_id}"),
                )
                self.bot.reply_to(
                    message,
                    f"💡 Idol <b>{escape(dup_name)}</b> đã được thành viên khác đề xuất trước đó!\n"
                    f"Hiện đang có: <b>{dup_votes} phiếu bầu</b>.\n\n"
                    "👉 Bạn có thể bấm nút bên dưới để bỏ phiếu ngay:",
                    parse_mode="HTML",
                    reply_markup=markup,
                )
                return

            # Insert new idol
            user_display = " ".join(part for part in (user.first_name, user.last_name) if part).strip() or user.username or str(user.id)
            new_idol = self.store.insert("care_idols", {
                "season_id": season_id,
                "bot_key": self.settings.bot_key,
                "chat_id": str(chat_id),
                "name": idol_name,
                "normalized_name": normalize_text(idol_name),
                "description": description,
                "nominated_by_user_id": str(user.id),
                "nominated_by_name": user_display,
                "vote_count": 0,
                "status": "approved",
            })

            new_id = new_idol.get("id")
            markup = InlineKeyboardMarkup()
            markup.row(
                InlineKeyboardButton(f"⭐ Vote cho {idol_name} (0)", callback_data=f"care_vote:{season_id}:{new_id}"),
                InlineKeyboardButton("🗳️ Danh sách Vote", callback_data=f"care_page:{season_id}:1"),
            )

            desc_text = f"\n💬 <i>\"{escape(description)}\"</i>" if description else ""
            self.bot.reply_to(
                message,
                f"🎉 <b>ĐỀ XUẤT THÀNH CÔNG!</b>\n\n"
                f"👤 <b>Idol:</b> <code>{escape(idol_name)}</code>{desc_text}\n"
                f"🎖️ <b>Người đề xuất:</b> {escape(user_display)}\n"
                f"📅 <b>Mùa giải:</b> {escape(season.get('title', 'Tháng này'))}\n\n"
                f"👉 Idol đã sẵn sàng trên bảng vote. Hãy bấm nút dưới để kêu gọi bạn bè bình chọn!",
                parse_mode="HTML",
                reply_markup=markup,
            )

    def handle_list_command(self, message):
        """Display list of idols to vote via inline keyboard buttons."""
        chat_id = message.chat.id
        season = self.get_or_create_current_season(chat_id)
        if not season:
            self.bot.reply_to(message, "Chưa có mùa giải Idol nào đang diễn ra.")
            return

        text, markup = self.build_vote_catalog_ui(season, page=1)
        self.bot.send_message(chat_id, text, parse_mode="HTML", reply_markup=markup)

    def handle_leaderboard_command(self, message):
        """Display real-time top leaderboard for current season."""
        chat_id = message.chat.id
        season = self.get_or_create_current_season(chat_id)
        if not season:
            self.bot.reply_to(message, "Chưa có mùa giải Idol nào đang diễn ra.")
            return

        text = self.build_leaderboard_text(season)
        markup = InlineKeyboardMarkup()
        markup.row(
            InlineKeyboardButton("🗳️ Mở Cổng Bình Chọn", callback_data=f"care_page:{season.get('id')}:1"),
            InlineKeyboardButton("🔄 Làm Mới BXH", callback_data=f"care_top:{season.get('id')}"),
        )
        self.bot.send_message(chat_id, text, parse_mode="HTML", reply_markup=markup)

    # ==========================================
    # ADMIN COMMANDS
    # ==========================================

    def handle_open_season_command(self, message):
        """Admin command to manually start or renew an event season."""
        chat_id = message.chat.id
        now = datetime.now(timezone.utc)
        start_at, end_at = calculate_month_bounds(now)
        parts = self.command_text(message).split("|")
        title = parts[0].strip() if parts and parts[0].strip() else f"Bình chọn Idol Tháng {now.month}/{now.year}"

        season = self.store.insert("care_seasons", {
            "bot_key": self.settings.bot_key,
            "chat_id": str(chat_id),
            "season_code": now.strftime("%Y-%m"),
            "title": title,
            "start_at": start_at.isoformat(),
            "end_at": end_at.isoformat(),
            "status": "open",
            "settings": json.dumps({"votes_per_user": 1, "min_member_days": 0, "allow_change_vote": True}, ensure_ascii=False),
            "enabled": True,
        })

        self.bot.reply_to(
            message,
            f"✅ <b>ĐÃ KHỞI TẠO MÙA GIẢI MỚI!</b>\n\n"
            f"🏆 <b>Tiêu đề:</b> {escape(title)}\n"
            f"📅 <b>Hạn chốt sổ:</b> 23:59 ngày {end_at.day}/{end_at.month}/{end_at.year} (UTC)\n\n"
            f"Thành viên có thể bắt đầu dùng lệnh <code>/dexuat</code> để đề cử Idol yêu thích!",
            parse_mode="HTML",
        )

    def handle_close_season_command(self, message):
        """Admin command to immediately close current season and broadcast winner announcement."""
        chat_id = message.chat.id
        season = self.get_or_create_current_season(chat_id)
        if not season or season.get("status") != "open":
            self.bot.reply_to(message, "Không có mùa giải nào đang mở để chốt sổ.")
            return

        self.close_and_announce_season(season)
        self.bot.reply_to(message, "✅ Đã chốt sổ và phát sóng vinh danh Idol thành công!")

    # ==========================================
    # CALLBACK HANDLERS (VOTE, PAGINATION, REFRESH)
    # ==========================================

    def handle_vote_callback(self, call):
        """Handle member clicking on a vote button: care_vote:<season_id>:<idol_id>"""
        user = call.from_user
        chat = call.message.chat
        data_parts = call.data.split(":")
        if len(data_parts) < 3:
            self.bot.answer_callback_query(call.id, "Dữ liệu không hợp lệ.")
            return

        season_id = data_parts[1]
        idol_id = data_parts[2]

        lock = self.get_lock(chat.id)
        with lock:
            # 1. Fetch Season
            seasons = [s for s in self.store.rows("care_seasons") if str(s.get("id")) == str(season_id)]
            if not seasons or seasons[0].get("status") != "open":
                self.bot.answer_callback_query(call.id, "⚠️ Mùa bình chọn này đã kết thúc hoặc bị đóng.", show_alert=True)
                return
            season = seasons[0]

            # 2. Fetch Idol
            idols = [i for i in self.store.rows("care_idols") if str(i.get("id")) == str(idol_id)]
            if not idols or idols[0].get("status") not in {"approved", "active"}:
                self.bot.answer_callback_query(call.id, "⚠️ Idol này không tồn tại hoặc đã bị ẩn.", show_alert=True)
                return
            target_idol = idols[0]
            idol_name = target_idol.get("name", "Idol")

            # 3. Check existing vote
            user_id_str = str(user.id)
            user_votes = [
                v for v in self.store.rows("care_votes")
                if str(v.get("season_id")) == str(season_id)
                and str(v.get("user_id")) == user_id_str
            ]

            user_display = " ".join(part for part in (user.first_name, user.last_name) if part).strip() or user.username or user_id_str

            if user_votes:
                current_vote = user_votes[0]
                current_voted_idol_id = str(current_vote.get("idol_id"))
                if current_voted_idol_id == str(idol_id):
                    self.bot.answer_callback_query(call.id, f"⭐️ Bạn đã bình chọn cho {idol_name} trước đó rồi!", show_alert=False)
                    return

                # User changing vote
                settings = {}
                try:
                    settings = json.loads(season.get("settings") or "{}")
                except Exception:
                    pass

                allow_change = settings.get("allow_change_vote", True)
                if not allow_change:
                    self.bot.answer_callback_query(call.id, "⚠️ Quy định mùa giải này không cho phép đổi phiếu vote.", show_alert=True)
                    return

                # Transfer vote
                old_idol_id = current_voted_idol_id
                # Decrement old idol
                for i in self.store.rows("care_idols"):
                    if str(i.get("id")) == old_idol_id:
                        old_count = max(0, int(i.get("vote_count") or 1) - 1)
                        self.store.update("care_idols", i.get("id"), {"vote_count": old_count})
                        break

                # Increment new idol
                new_count = int(target_idol.get("vote_count") or 0) + 1
                self.store.update("care_idols", target_idol.get("id"), {"vote_count": new_count})

                # Update vote record
                self.store.update("care_votes", current_vote.get("id"), {
                    "idol_id": target_idol.get("id"),
                    "voted_at": datetime.now(timezone.utc).isoformat(),
                    "user_name": user_display,
                })

                self.bot.answer_callback_query(call.id, f"🔄 Đã chuyển phiếu bình chọn sang: {idol_name}!", show_alert=False)
            else:
                # First time voting
                new_count = int(target_idol.get("vote_count") or 0) + 1
                self.store.update("care_idols", target_idol.get("id"), {"vote_count": new_count})
                self.store.insert("care_votes", {
                    "season_id": season.get("id"),
                    "idol_id": target_idol.get("id"),
                    "bot_key": self.settings.bot_key,
                    "chat_id": str(chat.id),
                    "user_id": user_id_str,
                    "user_name": user_display,
                    "vote_weight": 1,
                })
                self.bot.answer_callback_query(call.id, f"⭐ Đã vote thành công cho {idol_name}!", show_alert=False)

        # Refresh message UI quietly
        try:
            # Extract page from current view or default 1
            text, markup = self.build_vote_catalog_ui(season, page=1)
            self.bot.edit_message_reply_markup(chat.id, call.message.message_id, reply_markup=markup)
        except Exception:
            pass

    def handle_page_callback(self, call):
        """Pagination between idol catalog pages."""
        data_parts = call.data.split(":")
        if len(data_parts) < 3:
            return
        season_id = data_parts[1]
        page = as_int(data_parts[2], 1)

        seasons = [s for s in self.store.rows("care_seasons") if str(s.get("id")) == str(season_id)]
        if not seasons:
            self.bot.answer_callback_query(call.id, "Mùa giải không tồn tại.")
            return
        season = seasons[0]

        text, markup = self.build_vote_catalog_ui(season, page=page)
        try:
            self.bot.edit_message_text(text, call.message.chat.id, call.message.message_id, parse_mode="HTML", reply_markup=markup)
        except Exception:
            pass
        self.bot.answer_callback_query(call.id)

    def handle_top_callback(self, call):
        """Display leaderboard on button tap."""
        data_parts = call.data.split(":")
        if len(data_parts) < 2:
            return
        season_id = data_parts[1]
        seasons = [s for s in self.store.rows("care_seasons") if str(s.get("id")) == str(season_id)]
        if not seasons:
            return
        season = seasons[0]
        text = self.build_leaderboard_text(season)
        markup = InlineKeyboardMarkup()
        markup.row(
            InlineKeyboardButton("🗳️ Bảng Vote Idol", callback_data=f"care_page:{season_id}:1"),
            InlineKeyboardButton("🔄 Cập Nhật Lại", callback_data=f"care_top:{season_id}"),
        )
        try:
            self.bot.edit_message_text(text, call.message.chat.id, call.message.message_id, parse_mode="HTML", reply_markup=markup)
        except Exception:
            pass
        self.bot.answer_callback_query(call.id)

    def handle_refresh_callback(self, call):
        """Refresh current catalog view."""
        self.handle_page_callback(call)

    # ==========================================
    # UI BUILDERS (CATALOG & LEADERBOARD)
    # ==========================================

    def build_vote_catalog_ui(self, season, page=1, page_size=6):
        """Build the clean paginated inline keyboard catalog for idols."""
        season_id = season.get("id")
        idols = self.get_season_idols(season_id, season.get("chat_id"), only_approved=True)
        total_idols = len(idols)
        total_pages = max(1, (total_idols + page_size - 1) // page_size)
        current_page = max(1, min(page, total_pages))

        start_idx = (current_page - 1) * page_size
        page_idols = idols[start_idx: start_idx + page_size]

        title = season.get("title", "Cuộc Đua Idol")
        end_at_str = season.get("end_at", "")
        days_left_text = ""
        if end_at_str:
            try:
                end_at = datetime.fromisoformat(str(end_at_str).replace("Z", "+00:00"))
                delta = end_at - datetime.now(timezone.utc)
                days_left = max(0, delta.days)
                days_left_text = f"⏳ <i>Còn {days_left} ngày bình chọn</i>\n"
            except Exception:
                pass

        text = (
            f"🌟 <b>{escape(title).upper()}</b> 🌟\n"
            f"{days_left_text}"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"💡 <i>Bấm trực tiếp vào tên Idol bên dưới để bỏ phiếu. Mỗi thành viên được 1 phiếu bình chọn!</i>\n"
        )

        if not idols:
            text += "\n<i>Chưa có Idol nào được đề cử tháng này. Hãy là người đầu tiên đề xuất với lệnh:</i>\n<code>/dexuat Tên Idol | Lý do</code>"

        markup = InlineKeyboardMarkup()
        for idol in page_idols:
            name = idol.get("name")
            votes = int(idol.get("vote_count") or 0)
            idol_id = idol.get("id")
            # 1 button per idol with vote count
            markup.row(InlineKeyboardButton(f"⭐ {name}  [{votes} phiếu]", callback_data=f"care_vote:{season_id}:{idol_id}"))

        # Navigation row
        nav_buttons = []
        if current_page > 1:
            nav_buttons.append(InlineKeyboardButton("⬅️ Trước", callback_data=f"care_page:{season_id}:{current_page - 1}"))
        nav_buttons.append(InlineKeyboardButton(f"📄 {current_page}/{total_pages}", callback_data=f"care_refresh:{season_id}:{current_page}"))
        if current_page < total_pages:
            nav_buttons.append(InlineKeyboardButton("Sau ➡️", callback_data=f"care_page:{season_id}:{current_page + 1}"))

        if nav_buttons:
            markup.row(*nav_buttons)

        # Bottom Action Row
        markup.row(
            InlineKeyboardButton("🏆 Bảng Xếp Hạng Top", callback_data=f"care_top:{season_id}"),
            InlineKeyboardButton("➕ Đề Xuất Thêm", switch_inline_query_current_chat="/dexuat "),
        )

        return text, markup

    def build_leaderboard_text(self, season):
        """Build real-time top leaderboard text."""
        season_id = season.get("id")
        idols = self.get_season_idols(season_id, season.get("chat_id"), only_approved=True)
        title = season.get("title", "Cuộc Đua Idol")

        medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
        lines = []

        for idx, idol in enumerate(idols[:10]):
            medal = medals[idx] if idx < len(medals) else f"#{idx + 1}"
            name = idol.get("name")
            votes = int(idol.get("vote_count") or 0)
            nominator = idol.get("nominated_by_name", "")
            nom_text = f" <i>(bởi {escape(nominator)})</i>" if nominator else ""
            lines.append(f"{medal} <b>{escape(name)}</b> — <b>{votes}</b> phiếu{nom_text}")

        ranking_content = "\n".join(lines) if lines else "<i>Chưa có dữ liệu bình chọn.</i>"

        return (
            f"🏆 <b>BẢNG XẾP HẠNG: {escape(title).upper()}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"{ranking_content}\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"✨ <i>Bảng xếp hạng được tính tự động theo thời gian thực.</i>"
        )

    # ==========================================
    # AUTO-CLOSING & ANNOUNCEMENT ENGINE
    # ==========================================

    def check_and_process_expired_seasons(self):
        """Find seasons that reached deadline and trigger award announcements."""
        now = datetime.now(timezone.utc)
        for season in self.store.rows("care_seasons"):
            if season.get("status") != "open":
                continue
            end_at_str = season.get("end_at")
            if not end_at_str:
                continue
            try:
                end_at = datetime.fromisoformat(str(end_at_str).replace("Z", "+00:00"))
                if now >= end_at:
                    self.close_and_announce_season(season)
            except Exception as exc:
                LOGGER.warning("Failed parsing season end_at %s: %s", end_at_str, exc)

    def close_and_announce_season(self, season):
        """Close season, declare winner, send celebration broadcast and pin it."""
        season_id = season.get("id")
        chat_id = season.get("chat_id")
        title = season.get("title", "Mùa giải Idol")

        # 1. Update status to announced
        self.store.update("care_seasons", season_id, {"status": "announced"})

        # 2. Get Top Idols
        idols = self.get_season_idols(season_id, chat_id, only_approved=True)

        if not idols or int(idols[0].get("vote_count") or 0) == 0:
            announcement = (
                f"📢 <b>KẾT THÚC {escape(title).upper()}</b>\n\n"
                f"Mùa giải tháng này đã chính thức khép lại nhưng chưa ghi nhận phiếu bình chọn nào.\n"
                f"Hẹn gặp lại các bạn ở mùa giải tháng tới với nhiều idol xuất sắc hơn!"
            )
        else:
            winner = idols[0]
            winner_name = winner.get("name")
            winner_votes = winner.get("vote_count", 0)
            winner_nominator = winner.get("nominated_by_name", "Ẩn danh")

            runner_up_lines = []
            if len(idols) > 1 and int(idols[1].get("vote_count") or 0) > 0:
                runner_up_lines.append(f"🥈 <b>Á Quân 1:</b> {escape(idols[1].get('name'))} ({idols[1].get('vote_count')} phiếu)")
            if len(idols) > 2 and int(idols[2].get("vote_count") or 0) > 0:
                runner_up_lines.append(f"🥉 <b>Á Quân 2:</b> {escape(idols[2].get('name'))} ({idols[2].get('vote_count')} phiếu)")

            runners_text = ("\n" + "\n".join(runner_up_lines)) if runner_up_lines else ""

            announcement = (
                f"🎊 <b>VINH DANH QUÁN QUÂN: {escape(title).upper()}</b> 🎊\n"
                f"━━━━━━━━━━━━━━━━━━━━\n\n"
                f"👑 <b>IDOL ĐƯỢC YÊU THÍCH NHẤT THÁNG:</b>\n"
                f"✨ 🌟 <b>{escape(winner_name).upper()}</b> 🌟 ✨\n\n"
                f"⭐️ <b>Tổng số phiếu bầu:</b> <b>{winner_votes}</b> phiếu\n"
                f"🎖️ <b>Người đề cử sớm nhất:</b> {escape(winner_nominator)}\n"
                f"{runners_text}\n\n"
                f"━━━━━━━━━━━━━━━━━━━━\n"
                f"💖 <i>Cảm ơn toàn thể thành viên trong nhóm đã nhiệt tình đề xuất và bình chọn!</i>\n"
                f"🚀 <i>Mùa giải tiếp theo sẽ sớm được mở trong ít phút!</i>"
            )

        try:
            sent = self.bot.send_message(chat_id, announcement, parse_mode="HTML")
            try:
                self.bot.pin_chat_message(chat_id, sent.message_id)
            except Exception:
                pass
            LOGGER.info("Announced and pinned Care winner for season %s in chat %s", season_id, chat_id)
        except Exception as exc:
            LOGGER.warning("Could not send care winner announcement to %s: %s", chat_id, exc)

        # Automatically spawn next month's season
        try:
            self.get_or_create_current_season(chat_id)
        except Exception:
            pass
