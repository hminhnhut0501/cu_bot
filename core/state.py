from collections import defaultdict, deque
from dataclasses import dataclass, field
from threading import Lock
from time import time


@dataclass
class RuntimeState:
    group_activity: dict[int, bool] = field(default_factory=lambda: defaultdict(bool))
    user_windows: dict[tuple[int, int], deque] = field(default_factory=lambda: defaultdict(deque))
    user_content_windows: dict[tuple[int, int, str], deque] = field(default_factory=lambda: defaultdict(deque))
    user_duplicate_windows: dict[tuple[int, int, str], deque] = field(default_factory=lambda: defaultdict(deque))
    warnings: dict[tuple[int, int], int] = field(default_factory=lambda: defaultdict(int))
    bio_scan_cache: dict[tuple[int, int], tuple[float, bool]] = field(default_factory=dict)
    pending_verifications: dict[tuple[int, int], dict] = field(default_factory=dict)
    auto_reply_user_cooldown: dict[tuple[int, int, str], float] = field(default_factory=dict)
    auto_reply_trigger_cooldown: dict[tuple[int, str], float] = field(default_factory=dict)
    recent_welcome_events: dict[tuple[int, int], float] = field(default_factory=dict)
    lock: Lock = field(default_factory=Lock)

    def mark_activity(self, chat_id):
        with self.lock:
            self.group_activity[int(chat_id)] = True

    def consume_activity(self, chat_id):
        with self.lock:
            active = self.group_activity.get(int(chat_id), False)
            self.group_activity[int(chat_id)] = False
            return active

    def add_user_message(self, chat_id, user_id, window_seconds):
        key = (int(chat_id), int(user_id))
        current_time = time()
        with self.lock:
            window = self.user_windows[key]
            window.append(current_time)
            while window and current_time - window[0] > window_seconds:
                window.popleft()
            return len(window)

    def add_user_content_message(self, chat_id, user_id, content_type, window_seconds):
        key = (int(chat_id), int(user_id), str(content_type))
        current_time = time()
        with self.lock:
            window = self.user_content_windows[key]
            window.append(current_time)
            while window and current_time - window[0] > window_seconds:
                window.popleft()
            return len(window)

    def add_user_duplicate_message(self, chat_id, user_id, fingerprint, window_seconds):
        key = (int(chat_id), int(user_id), str(fingerprint))
        current_time = time()
        with self.lock:
            window = self.user_duplicate_windows[key]
            window.append(current_time)
            while window and current_time - window[0] > window_seconds:
                window.popleft()
            return len(window)

    def add_warning(self, chat_id, user_id):
        key = (int(chat_id), int(user_id))
        with self.lock:
            self.warnings[key] += 1
            return self.warnings[key]

    def reset_warnings(self, chat_id, user_id):
        with self.lock:
            self.warnings.pop((int(chat_id), int(user_id)), None)

    def cached_bio_scan(self, chat_id, user_id, ttl_seconds):
        key = (int(chat_id), int(user_id))
        current_time = time()
        with self.lock:
            cached = self.bio_scan_cache.get(key)
            if cached and current_time - cached[0] < ttl_seconds:
                return cached[1]
        return None

    def set_bio_scan(self, chat_id, user_id, has_blocked_link):
        key = (int(chat_id), int(user_id))
        with self.lock:
            self.bio_scan_cache[key] = (time(), bool(has_blocked_link))

    def set_pending_verification(self, chat_id, user_id, data):
        with self.lock:
            self.pending_verifications[(int(chat_id), int(user_id))] = data

    def get_pending_verification(self, chat_id, user_id):
        with self.lock:
            return self.pending_verifications.get((int(chat_id), int(user_id)))

    def clear_pending_verification(self, chat_id, user_id):
        with self.lock:
            self.pending_verifications.pop((int(chat_id), int(user_id)), None)

    def can_auto_reply(self, chat_id, user_id, trigger_key, user_cooldown_seconds, trigger_cooldown_seconds):
        now = time()
        user_key = (int(chat_id), int(user_id), str(trigger_key))
        trigger_key_scoped = (int(chat_id), str(trigger_key))
        with self.lock:
            last_user = self.auto_reply_user_cooldown.get(user_key, 0)
            if user_cooldown_seconds > 0 and now - last_user < user_cooldown_seconds:
                return False
            last_trigger = self.auto_reply_trigger_cooldown.get(trigger_key_scoped, 0)
            if trigger_cooldown_seconds > 0 and now - last_trigger < trigger_cooldown_seconds:
                return False
            self.auto_reply_user_cooldown[user_key] = now
            self.auto_reply_trigger_cooldown[trigger_key_scoped] = now
            return True

    def should_process_welcome(self, chat_id, user_id, dedupe_seconds=12):
        now = time()
        key = (int(chat_id), int(user_id))
        with self.lock:
            last_seen = self.recent_welcome_events.get(key, 0)
            if dedupe_seconds > 0 and now - last_seen < dedupe_seconds:
                return False
            self.recent_welcome_events[key] = now
            return True

    def release_welcome(self, chat_id, user_id):
        with self.lock:
            self.recent_welcome_events.pop((int(chat_id), int(user_id)), None)
