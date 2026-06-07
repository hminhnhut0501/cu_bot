import logging
import random
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import schedule

from core.utils import as_bool, as_int, weighted_choice
from modules.base import BotModule


LOGGER = logging.getLogger(__name__)


class ScheduledPostsModule(BotModule):
    name = "scheduled_posts"
    priority = 50

    def __init__(self, app):
        super().__init__(app)
        self.scheduler = schedule.Scheduler()
        self.schedule_signature = None
        self.inactive_log_state = None

    def start(self):
        self.schedule_daily_jobs(force=True)
        self.scheduler.every().day.at("00:01").do(self.schedule_daily_jobs, True)
        self.scheduler.every(max(self.settings.data_refresh_seconds, 60)).seconds.do(self.schedule_daily_jobs)
        self.app.run_background("scheduler", self.run_scheduler)
        self.send_boot_messages()

    def run_scheduler(self):
        while True:
            self.scheduler.run_pending()
            time.sleep(1)

    def module_active(self):
        for row in self.store.rows("module_settings"):
            if (row.get("bot_key") or "").strip() != self.settings.bot_key:
                continue
            if (row.get("module_key") or "").strip() == self.name:
                return as_bool(row.get("enabled"), True)
        return False

    def inactive_reason(self):
        if not self.bot_active():
            return "bot_inactive"
        if not self.module_active():
            return "module_disabled"
        return ""

    def schedule_daily_jobs(self, force=False):
        inactive_reason = self.inactive_reason()
        if inactive_reason:
            self.scheduler.clear("daily_messages")
            self.scheduler.clear("daily_videos")
            self.schedule_signature = None
            inactive_log_state = (self.settings.bot_key, inactive_reason)
            if inactive_log_state != self.inactive_log_state:
                LOGGER.info("Scheduled posts inactive for bot %s: %s.", self.settings.bot_key, inactive_reason)
                self.inactive_log_state = inactive_log_state
            return
        self.inactive_log_state = None

        groups = self.target_groups()
        signature = self.build_schedule_signature(groups)
        if not force and signature == self.schedule_signature:
            return
        self.schedule_signature = signature

        self.scheduler.clear("daily_messages")
        self.scheduler.clear("daily_videos")

        if not groups:
            LOGGER.warning(
                "No enabled group/channel configured for scheduled posts on bot %s. "
                "Add a groups row with the same bot_key before expecting automatic posts.",
                self.settings.bot_key,
            )
            self.record_audit(
                "",
                "scheduled_posts_not_configured",
                {"reason": "no_enabled_target_group", "timezone": self.settings.timezone},
            )
            return

        scheduled_messages = 0
        scheduled_videos = 0
        for group in groups:
            if as_bool(group.get("daily_enabled"), True):
                window_start = group.get("daily_window_start") or self.store.value("daily_window_start", "20:00")
                window_end = group.get("daily_window_end") or self.store.value("daily_window_end", "23:59")
                run_at = self.random_time(
                    window_start,
                    window_end,
                )
                self.scheduler.every().day.at(run_at, self.settings.timezone).do(self.send_random_message, group).tag("daily_messages")
                scheduled_messages += 1
                LOGGER.info(
                    "Daily message for bot %s group %s scheduled at %s (%s)",
                    self.settings.bot_key,
                    group["group_id"],
                    run_at,
                    self.settings.timezone,
                )
                if self.should_catch_up_today(run_at, window_start, window_end):
                    LOGGER.info(
                        "Daily message for bot %s group %s was loaded after %s; sending catch-up now (%s).",
                        self.settings.bot_key,
                        group["group_id"],
                        run_at,
                        self.settings.timezone,
                    )
                    self.record_audit(
                        group["group_id"],
                        "scheduled_message_catch_up",
                        {
                            "scheduled_at": run_at,
                            "window_start": window_start,
                            "window_end": window_end,
                            "timezone": self.settings.timezone,
                        },
                    )
                    self.app.run_background(
                        f"scheduled-message-catchup-{self.settings.bot_key}-{group['group_id']}",
                        lambda group=group: self.send_random_message(group),
                    )

            if as_bool(group.get("video_enabled"), False):
                window_start = group.get("video_window_start") or self.store.value("video_window_start", "20:00")
                window_end = group.get("video_window_end") or self.store.value("video_window_end", "23:59")
                run_at = self.random_time(
                    window_start,
                    window_end,
                )
                self.scheduler.every().day.at(run_at, self.settings.timezone).do(self.copy_random_video, group).tag("daily_videos")
                scheduled_videos += 1
                LOGGER.info(
                    "Daily video for bot %s group %s scheduled at %s (%s)",
                    self.settings.bot_key,
                    group["group_id"],
                    run_at,
                    self.settings.timezone,
                )
                if self.should_catch_up_today(run_at, window_start, window_end):
                    LOGGER.info(
                        "Daily video for bot %s group %s was loaded after %s; sending catch-up now (%s).",
                        self.settings.bot_key,
                        group["group_id"],
                        run_at,
                        self.settings.timezone,
                    )
                    self.record_audit(
                        group["group_id"],
                        "scheduled_video_catch_up",
                        {
                            "scheduled_at": run_at,
                            "window_start": window_start,
                            "window_end": window_end,
                            "timezone": self.settings.timezone,
                        },
                    )
                    self.app.run_background(
                        f"scheduled-video-catchup-{self.settings.bot_key}-{group['group_id']}",
                        lambda group=group: self.copy_random_video(group),
                    )
        LOGGER.info(
            "Scheduled posts ready for bot %s: %s message job(s), %s video job(s), timezone=%s.",
            self.settings.bot_key,
            scheduled_messages,
            scheduled_videos,
            self.settings.timezone,
        )
        self.record_audit(
            "",
            "scheduled_posts_jobs_loaded",
            {
                "message_jobs": scheduled_messages,
                "video_jobs": scheduled_videos,
                "timezone": self.settings.timezone,
            },
        )

    def send_boot_messages(self):
        if not self.bot_active() or not self.module_active():
            return
        if not as_bool(self.store.value("send_on_boot", "false"), False):
            return
        for group in self.target_groups():
            self.send_random_message(group, force=True)

    def send_random_message(self, group, force=False):
        if not self.bot_active() or not self.module_active():
            return
        chat_id = self.chat_target(group["group_id"])
        send_if_silent_value = group.get("send_if_silent")
        if send_if_silent_value in (None, ""):
            send_if_silent_value = self.store.value("send_if_silent", "false")
        send_if_silent = as_bool(send_if_silent_value, False)
        if isinstance(chat_id, int):
            had_activity = self.state.consume_activity(chat_id)
            LOGGER.info(
                "Scheduled send gate for bot %s group %s: send_if_silent=%s had_activity=%s force=%s",
                self.settings.bot_key,
                chat_id,
                send_if_silent,
                had_activity,
                force,
            )

        pool = group.get("message_pool") or "default"
        candidates = [
            row for row in self.store.enabled_rows("messages")
            if (row.get("pool") or "default") == pool and (row.get("message") or row.get("text"))
        ]
        selected = weighted_choice(candidates)
        if not selected:
            LOGGER.warning("No message candidate for bot %s pool %s", self.settings.bot_key, pool)
            self.record_audit(chat_id, "scheduled_message_skipped", {"reason": "empty_message_pool", "pool": pool})
            return

        try:
            self.bot.send_message(chat_id, selected.get("message") or selected.get("text"))
            LOGGER.info("Sent scheduled message for bot %s to %s", self.settings.bot_key, chat_id)
            self.record_audit(chat_id, "scheduled_message_sent", {"pool": pool, "message_id": selected.get("id")})
        except Exception as exc:
            LOGGER.warning("Cannot send scheduled message for bot %s to %s: %s", self.settings.bot_key, chat_id, exc)
            self.record_audit(chat_id, "scheduled_message_failed", {"pool": pool, "error": str(exc)})

    def copy_random_video(self, group):
        if not self.bot_active() or not self.module_active():
            return
        chat_id = self.chat_target(group["group_id"])
        pool = group.get("video_pool") or "default"
        candidates = [
            row for row in self.store.enabled_rows("video_messages")
            if (row.get("pool") or "default") == pool and row.get("from_chat_id") and row.get("message_id")
        ]
        selected = weighted_choice(candidates)
        if not selected:
            LOGGER.warning("No video candidate for bot %s pool %s", self.settings.bot_key, pool)
            self.record_audit(chat_id, "scheduled_video_skipped", {"reason": "empty_video_pool", "pool": pool})
            return

        try:
            self.bot.copy_message(
                chat_id=chat_id,
                from_chat_id=int(selected["from_chat_id"]),
                message_id=as_int(selected["message_id"]),
                caption=selected.get("caption") or None,
            )
            LOGGER.info("Copied anonymous video for bot %s to %s", self.settings.bot_key, chat_id)
            self.record_audit(chat_id, "scheduled_video_sent", {"pool": pool, "video_id": selected.get("id")})
        except Exception as exc:
            LOGGER.warning("Cannot copy video for bot %s to %s: %s", self.settings.bot_key, chat_id, exc)
            self.record_audit(chat_id, "scheduled_video_failed", {"pool": pool, "error": str(exc)})

    def target_groups(self):
        groups = []
        for row in self.store.enabled_rows("groups"):
            if (row.get("bot_key") or "").strip() not in {"", self.settings.bot_key}:
                continue
            chat_id = row.get("group_id") or row.get("chat_id")
            if not chat_id:
                continue
            row = dict(row)
            row["group_id"] = chat_id
            groups.append(row)
        return groups

    def build_schedule_signature(self, groups):
        group_values = []
        for group in groups:
            group_values.append((
                group.get("group_id"),
                group.get("enabled"),
                group.get("daily_enabled"),
                group.get("daily_window_start"),
                group.get("daily_window_end"),
                group.get("send_if_silent"),
                group.get("message_pool"),
                group.get("video_enabled"),
                group.get("video_window_start"),
                group.get("video_window_end"),
                group.get("video_pool"),
            ))
        message_values = [
            (row.get("id"), row.get("enabled"), row.get("pool"), row.get("weight"))
            for row in self.store.rows("messages")
        ]
        video_values = [
            (row.get("id"), row.get("enabled"), row.get("pool"), row.get("weight"))
            for row in self.store.rows("video_messages")
        ]
        return (tuple(group_values), tuple(message_values), tuple(video_values))

    def random_time(self, start, end):
        start_dt = self.parse_time(start)
        end_dt = self.parse_time(end)
        if end_dt < start_dt:
            end_dt += timedelta(days=1)
        seconds = random.randint(0, int((end_dt - start_dt).total_seconds()))
        return (start_dt + timedelta(seconds=seconds)).strftime("%H:%M")

    def parse_time(self, value):
        return datetime.strptime((value or "00:00").strip(), "%H:%M")

    def now_in_timezone(self):
        try:
            return datetime.now(ZoneInfo(self.settings.timezone))
        except ZoneInfoNotFoundError:
            LOGGER.warning("Invalid timezone %s for scheduled posts; using server timezone.", self.settings.timezone)
            return datetime.now()

    def should_catch_up_today(self, run_at, window_start, window_end):
        if not as_bool(self.store.value("catch_up_missed_daily_posts", "true"), True):
            return False
        now = self.now_in_timezone()
        run_dt = self.local_time_today(now, run_at)
        start_dt = self.local_time_today(now, window_start)
        end_dt = self.local_time_today(now, window_end)
        if end_dt < start_dt:
            if now < start_dt:
                start_dt -= timedelta(days=1)
                run_dt -= timedelta(days=1)
            else:
                end_dt += timedelta(days=1)
                if run_dt < start_dt:
                    run_dt += timedelta(days=1)
        return start_dt <= now <= end_dt and run_dt <= now

    def local_time_today(self, now, value):
        parsed = self.parse_time(value)
        return now.replace(hour=parsed.hour, minute=parsed.minute, second=0, microsecond=0)

    def chat_target(self, value):
        text = str(value or "").strip()
        if text.lstrip("-").isdigit():
            return int(text)
        return text

    def record_audit(self, chat_id, action, details):
        try:
            self.store.insert(
                "audit_logs",
                {
                    "chat_id": str(chat_id or ""),
                    "actor_user_id": "bot",
                    "action": action,
                    "details": details,
                },
            )
        except Exception as exc:
            LOGGER.warning("Cannot write scheduled-post audit %s for bot %s: %s", action, self.settings.bot_key, exc)
