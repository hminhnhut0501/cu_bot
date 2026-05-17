import logging
import random
import time
from datetime import datetime, timedelta

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
            if (row.get("module_key") or "").strip() == self.name:
                return as_bool(row.get("enabled"), True)
        return True

    def schedule_daily_jobs(self, force=False):
        if not self.bot_active() or not self.module_active():
            self.scheduler.clear("daily_messages")
            self.scheduler.clear("daily_videos")
            self.schedule_signature = None
            return

        groups = self.target_groups()
        signature = self.build_schedule_signature(groups)
        if not force and signature == self.schedule_signature:
            return
        self.schedule_signature = signature

        self.scheduler.clear("daily_messages")
        self.scheduler.clear("daily_videos")

        for group in groups:
            if as_bool(group.get("daily_enabled"), True):
                run_at = self.random_time(
                    group.get("daily_window_start") or self.store.value("daily_window_start", "20:00"),
                    group.get("daily_window_end") or self.store.value("daily_window_end", "23:59"),
                )
                self.scheduler.every().day.at(run_at).do(self.send_random_message, group).tag("daily_messages")
                LOGGER.info("Daily message for bot %s group %s scheduled at %s", self.settings.bot_key, group["group_id"], run_at)

            if as_bool(group.get("video_enabled"), False):
                run_at = self.random_time(
                    group.get("video_window_start") or self.store.value("video_window_start", "20:00"),
                    group.get("video_window_end") or self.store.value("video_window_end", "23:59"),
                )
                self.scheduler.every().day.at(run_at).do(self.copy_random_video, group).tag("daily_videos")
                LOGGER.info("Daily video for bot %s group %s scheduled at %s", self.settings.bot_key, group["group_id"], run_at)

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
        chat_id = int(group["group_id"])
        send_if_silent = as_bool(group.get("send_if_silent") or self.store.value("send_if_silent", "false"), False)
        if not force and not send_if_silent and not self.state.consume_activity(chat_id):
            LOGGER.info("Skip bot %s group %s because group is silent.", self.settings.bot_key, chat_id)
            return

        pool = group.get("message_pool") or "default"
        candidates = [
            row for row in self.store.enabled_rows("messages")
            if (row.get("pool") or "default") == pool and (row.get("message") or row.get("text"))
        ]
        selected = weighted_choice(candidates)
        if not selected:
            LOGGER.warning("No message candidate for bot %s pool %s", self.settings.bot_key, pool)
            return

        try:
            self.bot.send_message(chat_id, selected.get("message") or selected.get("text"))
            LOGGER.info("Sent scheduled message for bot %s to %s", self.settings.bot_key, chat_id)
        except Exception as exc:
            LOGGER.warning("Cannot send scheduled message for bot %s to %s: %s", self.settings.bot_key, chat_id, exc)

    def copy_random_video(self, group):
        if not self.bot_active() or not self.module_active():
            return
        chat_id = int(group["group_id"])
        pool = group.get("video_pool") or "default"
        candidates = [
            row for row in self.store.enabled_rows("video_messages")
            if (row.get("pool") or "default") == pool and row.get("from_chat_id") and row.get("message_id")
        ]
        selected = weighted_choice(candidates)
        if not selected:
            LOGGER.warning("No video candidate for bot %s pool %s", self.settings.bot_key, pool)
            return

        try:
            self.bot.copy_message(
                chat_id=chat_id,
                from_chat_id=int(selected["from_chat_id"]),
                message_id=as_int(selected["message_id"]),
                caption=selected.get("caption") or None,
            )
            LOGGER.info("Copied anonymous video for bot %s to %s", self.settings.bot_key, chat_id)
        except Exception as exc:
            LOGGER.warning("Cannot copy video for bot %s to %s: %s", self.settings.bot_key, chat_id, exc)

    def target_groups(self):
        groups = []
        for row in self.store.enabled_rows("groups"):
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
