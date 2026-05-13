from collections import defaultdict, deque
from dataclasses import dataclass, field
from threading import Lock
from time import time


@dataclass
class RuntimeState:
    group_activity: dict[int, bool] = field(default_factory=lambda: defaultdict(bool))
    user_windows: dict[tuple[int, int], deque] = field(default_factory=lambda: defaultdict(deque))
    warnings: dict[tuple[int, int], int] = field(default_factory=lambda: defaultdict(int))
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

    def add_warning(self, chat_id, user_id):
        key = (int(chat_id), int(user_id))
        with self.lock:
            self.warnings[key] += 1
            return self.warnings[key]

    def reset_warnings(self, chat_id, user_id):
        with self.lock:
            self.warnings.pop((int(chat_id), int(user_id)), None)
