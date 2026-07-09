import logging
import time
from datetime import datetime
from zoneinfo import ZoneInfo

from core.utils import as_int
from modules.base import BotModule


LOGGER = logging.getLogger(__name__)


class AnalyticsModule(BotModule):
    name = "analytics"
    priority = 95

    def is_enabled(self):
        return True

    def start(self):
        if not self.bot_active():
            return
        self.app.run_background(f"analytics-heartbeat-{self.settings.bot_key}", self.run_loop)

    def run_loop(self):
        time.sleep(10)
        while True:
            try:
                self.flush_active_members()
                self.sync_member_counts()
            except Exception as exc:
                LOGGER.warning("Analytics heartbeat failed for bot %s: %s", self.settings.bot_key, exc)
            time.sleep(self.heartbeat_seconds())

    def heartbeat_seconds(self):
        configured = self.store.value("analytics_heartbeat_seconds", "")
        return max(60, as_int(configured, max(self.settings.data_refresh_seconds, 300)))

    def today_key(self):
        try:
            tz = ZoneInfo(self.settings.timezone or "Asia/Ho_Chi_Minh")
        except Exception:
            tz = ZoneInfo("Asia/Ho_Chi_Minh")
        return datetime.now(tz).date().isoformat()

    def flush_active_members(self):
        active = self.state.consume_active_users()
        if not active:
            return

        now = datetime.utcnow().isoformat() + "Z"
        activity_date = self.today_key()
        rows = []
        existing_counts = self.existing_activity_counts(activity_date)
        for chat_id, users in active.items():
            for user_id, profile in users.items():
                key = (str(chat_id), str(user_id))
                next_count = int(existing_counts.get(key, 0)) + int(profile.get("message_count") or 1)
                rows.append({
                    "bot_key": self.settings.bot_key,
                    "chat_id": str(chat_id),
                    "user_id": str(user_id),
                    "username": str(profile.get("username") or ""),
                    "display_name": str(profile.get("display_name") or ""),
                    "activity_date": activity_date,
                    "last_seen_at": now,
                    "message_count": next_count,
                })
        if not rows:
            return
        try:
            self.store.upsert(
                "analytics_member_activity",
                rows,
                "bot_key,chat_id,user_id,activity_date",
            )
            LOGGER.info("Flushed %s active member heartbeat row(s) for bot %s.", len(rows), self.settings.bot_key)
        except Exception as exc:
            LOGGER.warning("Cannot flush active member heartbeat for bot %s: %s", self.settings.bot_key, exc)

    def existing_activity_counts(self, activity_date):
        counts = {}
        try:
            for row in self.store.fresh_rows("analytics_member_activity"):
                if str(row.get("activity_date") or "")[:10] != str(activity_date):
                    continue
                chat_id = str(row.get("chat_id") or "")
                user_id = str(row.get("user_id") or "")
                if chat_id and user_id:
                    counts[(chat_id, user_id)] = int(row.get("message_count") or 0)
        except Exception as exc:
            LOGGER.warning("Cannot load existing active member counts for bot %s: %s", self.settings.bot_key, exc)
        return counts

    def sync_member_counts(self):
        stat_date = self.today_key()
        now = datetime.utcnow().isoformat() + "Z"
        rows = []
        for group in self.store.enabled_rows("groups"):
            chat_id = str(group.get("group_id") or group.get("chat_id") or "").strip()
            if not chat_id:
                continue
            try:
                count = self.get_member_count(chat_id)
            except Exception as exc:
                LOGGER.warning("Cannot read member count for bot %s chat %s: %s", self.settings.bot_key, chat_id, exc)
                continue
            rows.append({
                "bot_key": self.settings.bot_key,
                "chat_id": chat_id,
                "stat_date": stat_date,
                "member_count": int(count),
                "member_count_checked_at": now,
                "updated_at": now,
            })
        if not rows:
            return
        try:
            self.store.upsert("analytics_daily_stats", rows, "bot_key,chat_id,stat_date")
            LOGGER.info("Synced member count for %s group(s) on bot %s.", len(rows), self.settings.bot_key)
        except Exception as exc:
            LOGGER.warning("Cannot sync member count heartbeat for bot %s: %s", self.settings.bot_key, exc)

    def get_member_count(self, chat_id):
        if hasattr(self.bot, "get_chat_member_count"):
            return self.bot.get_chat_member_count(chat_id)
        return self.bot.get_chat_members_count(chat_id)
