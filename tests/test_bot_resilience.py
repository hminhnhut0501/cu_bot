import time
import unittest
from types import SimpleNamespace
from unittest.mock import Mock

import keep_alive
from modules.care_events import CareEventsModule
from modules.moderation import ModerationModule


class BotResilienceTests(unittest.TestCase):
    def setUp(self):
        with keep_alive._LOCK:
            keep_alive._HEARTBEATS.clear()

    def test_keep_alive_heartbeat_and_error_states(self):
        keep_alive.register_bot("main")
        healthy, bots = keep_alive.health_snapshot()
        self.assertTrue(healthy)
        self.assertEqual(bots["main"]["status"], "starting")

        keep_alive.record_heartbeat("main")
        healthy, bots = keep_alive.health_snapshot()
        self.assertTrue(healthy)
        self.assertEqual(bots["main"]["status"], "running")

        keep_alive.mark_bot_error("main", "boom")
        healthy, bots = keep_alive.health_snapshot()
        self.assertFalse(healthy)
        self.assertEqual(bots["main"]["status"], "error")
        self.assertIn("boom", bots["main"]["error"])

    def test_keep_alive_marks_stale_bot_unhealthy(self):
        keep_alive.register_bot("main")
        keep_alive.record_heartbeat("main")
        with keep_alive._LOCK:
            keep_alive._HEARTBEATS["main"]["last_ok"] = time.time() - (keep_alive.STALE_SECONDS + 10)

        healthy, bots = keep_alive.health_snapshot()
        self.assertFalse(healthy)
        self.assertEqual(bots["main"]["status"], "stale")

    def test_is_command_message_only_allows_known_commands(self):
        module = ModerationModule.__new__(ModerationModule)
        self.assertTrue(module.is_command_message(SimpleNamespace(text="/help")))
        self.assertTrue(module.is_command_message(SimpleNamespace(text="/policy@cu_bot")))
        self.assertTrue(module.is_command_message(SimpleNamespace(text="/dexuat Sơn Tùng")))
        self.assertFalse(module.is_command_message(SimpleNamespace(text="/ib mua acc gia re")))
        self.assertFalse(module.is_command_message(SimpleNamespace(text="/spam https://evil.com")))
        self.assertFalse(module.is_command_message(SimpleNamespace(text="hello world")))

    def test_is_admin_caches_telegram_lookup(self):
        module = ModerationModule.__new__(ModerationModule)
        module.settings = SimpleNamespace(owner_ids=set())
        module.store = SimpleNamespace(enabled_rows=Mock(return_value=[]))
        module.bot = SimpleNamespace(
            get_chat_member=Mock(return_value=SimpleNamespace(status="member"))
        )

        self.assertFalse(module.is_admin(-1001, 42))
        self.assertFalse(module.is_admin(-1001, 42))
        module.bot.get_chat_member.assert_called_once_with(-1001, 42)

    def test_care_events_register_and_command_text(self):
        app = SimpleNamespace(
            bot=SimpleNamespace(
                message_handler=lambda *a, **k: (lambda fn: fn),
                callback_query_handler=lambda *a, **k: (lambda fn: fn),
            ),
            store=SimpleNamespace(enabled_rows=Mock(return_value=[])),
            state=SimpleNamespace(),
            settings=SimpleNamespace(owner_ids=set()),
        )
        module = CareEventsModule(app)
        module.register()
        self.assertEqual(module.command_text(SimpleNamespace(text="/moduacare Mùa 11")), "Mùa 11")
        self.assertEqual(module.command_text(SimpleNamespace(text="/moduacare")), "")


if __name__ == "__main__":
    unittest.main()
