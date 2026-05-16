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

    def start(self):
        self.schedule_daily_jobs()
        schedule.every().day.at("00:01").do(self.schedule_daily_jobs)
        self.app.run_background("scheduler", self.run_scheduler)
        self.send_boot_messages()

    def run_scheduler(self):
        while True:
            schedule.run_pending()
            time.sleep(1)

    def schedule_daily_jobs(self):
        schedule.clear("daily_messages")
        schedule.clear("daily_videos")

        for group in self.target_groups():
            if as_bool(group.get("daily_enabled"), True):
                run_at = self.random_time(
                    group.get("daily_window_start") or self.store.value("daily_window_start", "20:00"),
                    group.get("daily_window_end") or self.store.value("daily_window_end", "23:59"),
                )
                schedule.every().day.at(run_at).do(self.send_random_message, group).tag("daily_messages")
                LOGGER.info("Daily message for %s scheduled at %s", group["group_id"], run_at)

            if as_bool(group.get("video_enabled"), False):
                run_at = self.random_time(
                    group.get("video_window_start") or self.store.value("video_window_start", "20:00"),
                    group.get("video_window_end") or self.store.value("video_window_end", "23:59"),
                )
                schedule.every().day.at(run_at).do(self.copy_random_video, group).tag("daily_videos")
                LOGGER.info("Daily video for %s scheduled at %s", group["group_id"], run_at)

    def send_boot_messages(self):
        if not as_bool(self.store.value("send_on_boot", "false"), False):
            return
        for group in self.target_groups():
            self.send_random_message(group, force=True)

    def send_random_message(self, group, force=False):
        chat_id = int(group["group_id"])
        send_if_silent = as_bool(group.get("send_if_silent") or self.store.value("send_if_silent", "false"), False)
        if not force and not send_if_silent and not self.state.consume_activity(chat_id):
            LOGGER.info("Skip %s because group is silent.", chat_id)
            return

        pool = group.get("message_pool") or "default"
        candidates = [
            row for row in self.store.enabled_rows("messages")
            if (row.get("pool") or "default") == pool and (row.get("message") or row.get("text"))
        ]
        selected = weighted_choice(candidates)
        if not selected:
            LOGGER.warning("No message candidate for pool %s", pool)
            return

        try:
            self.bot.send_message(chat_id, selected.get("message") or selected.get("text"))
            LOGGER.info("Sent scheduled message to %s", chat_id)
        except Exception as exc:
            LOGGER.warning("Cannot send scheduled message to %s: %s", chat_id, exc)

    def copy_random_video(self, group):
        chat_id = int(group["group_id"])
        pool = group.get("video_pool") or "default"
        candidates = [
            row for row in self.store.enabled_rows("video_messages")
            if (row.get("pool") or "default") == pool and row.get("from_chat_id") and row.get("message_id")
        ]
        selected = weighted_choice(candidates)
        if not selected:
            LOGGER.warning("No video candidate for pool %s", pool)
            return

        try:
            self.bot.copy_message(
                chat_id=chat_id,
                from_chat_id=int(selected["from_chat_id"]),
                message_id=as_int(selected["message_id"]),
                caption=selected.get("caption") or None,
            )
            LOGGER.info("Copied anonymous video to %s", chat_id)
        except Exception as exc:
            LOGGER.warning("Cannot copy video to %s: %s", chat_id, exc)

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

    def random_time(self, start, end):
        start_dt = self.parse_time(start)
        end_dt = self.parse_time(end)
        if end_dt < start_dt:
            end_dt += timedelta(days=1)
        seconds = random.randint(0, int((end_dt - start_dt).total_seconds()))
        return (start_dt + timedelta(seconds=seconds)).strftime("%H:%M")

    def parse_time(self, value):
        return datetime.strptime((value or "00:00").strip(), "%H:%M")
