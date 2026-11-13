import time
import unittest
from types import SimpleNamespace
from unittest.mock import Mock

import keep_alive
from modules.base import BotModule
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

    def test_strict_group_allowlist_filters_groups_and_private_chats(self):
        app = SimpleNamespace(
            bot=SimpleNamespace(),
            store=SimpleNamespace(
                bot_active=Mock(return_value=True),
                rows=Mock(return_value=[
                    {"bot_key": "main", "group_id": "-100111", "enabled": True},
                    {"bot_key": "main", "group_id": "-100222", "enabled": False},
                ]),
            ),
            state=SimpleNamespace(),
            settings=SimpleNamespace(bot_key="main", allowed_chat_ids=set()),
        )
        module = BotModule(app)
        self.assertTrue(module.group_allowed(-100111))
        self.assertFalse(module.group_allowed(-100222))
        self.assertFalse(module.group_allowed(-100999))

        handled = []
        wrapped = module.active(lambda msg: handled.append(msg.chat.id))
        wrapped(SimpleNamespace(chat=SimpleNamespace(id=-100999, type="supergroup")))
        wrapped(SimpleNamespace(chat=SimpleNamespace(id=-100222, type="supergroup")))
        wrapped(SimpleNamespace(chat=SimpleNamespace(id=-100111, type="supergroup")))
        wrapped(SimpleNamespace(chat=SimpleNamespace(id=777, type="private")))
        self.assertEqual(handled, [-100111, 777])

        # Env ALLOWED_CHAT_IDS overrides table rows
        app.settings.allowed_chat_ids = {"-100555"}
        self.assertTrue(module.group_allowed(-100555))
        self.assertFalse(module.group_allowed(-100111))

    def test_care_events_anti_fraud_and_cooldown(self):
        app = SimpleNamespace(
            bot=SimpleNamespace(
                message_handler=lambda *a, **k: (lambda fn: fn),
                callback_query_handler=lambda *a, **k: (lambda fn: fn),
                get_chat_member=Mock(return_value=SimpleNamespace(status="member")),
            ),
            store=SimpleNamespace(
                enabled_rows=Mock(return_value=[]),
                rows=Mock(return_value=[]),
            ),
            state=SimpleNamespace(),
            settings=SimpleNamespace(owner_ids=set(), bot_key="main"),
        )
        module = CareEventsModule(app)

        # 1. Reject bots
        bot_user = SimpleNamespace(id=999, is_bot=True)
        ok, err = module.check_vote_eligibility(-1001, bot_user)
        self.assertFalse(ok)
        self.assertIn("Bot", err)

        # 2. Accept normal member
        human_user = SimpleNamespace(id=123, is_bot=False)
        ok, err = module.check_vote_eligibility(-1001, human_user)
        self.assertTrue(ok)

        # 3. Rate limiting cooldown rejects rapid subsequent clicks
        ok, err = module.check_vote_eligibility(-1001, human_user)
        self.assertFalse(ok)
        self.assertIn("nhanh", err)

        # 4. Reject left or kicked members
        module._user_cooldowns.clear()
        app.bot.get_chat_member = Mock(return_value=SimpleNamespace(status="left"))
        ok, err = module.check_vote_eligibility(-1001, human_user)
        self.assertFalse(ok)
        self.assertIn("thành viên", err)

        # 5. Reject disciplined/restricted members
        module._user_cooldowns.clear()
        app.bot.get_chat_member = Mock(return_value=SimpleNamespace(status="member"))
        app.store.rows = Mock(return_value=[
            {"chat_id": "-1001", "user_id": "123", "status": "restricted"}
        ])
        ok, err = module.check_vote_eligibility(-1001, human_user)
        self.assertFalse(ok)
        self.assertIn("kỷ luật", err)

    def test_moderation_ban_deduplication(self):
        module = ModerationModule.__new__(ModerationModule)
        module.state = SimpleNamespace(
            get_warning=Mock(return_value=0),
            set_warning=Mock(),
            add_warning=Mock(return_value=3),
            reset_warnings=Mock(),
        )
        module.store = SimpleNamespace(rows=Mock(return_value=[]))
        module.bot = SimpleNamespace(
            ban_chat_member=Mock(),
            send_message=Mock(return_value=SimpleNamespace(message_id=999)),
        )
        module.settings = SimpleNamespace(owner_ids=set(), bot_key="main")
        module.setting_int = Mock(return_value=3)
        module.actor_for_system = Mock(return_value="system")
        module.audit_details = Mock(return_value={})
        module.record_member_moderation_state = Mock()
        module.delete_later = Mock()
        module.audit = Mock()

        # First ban should succeed and record user as banned
        module.ban_user(-1001, 777, reason="Spam", warning_count=3, warning_limit=3)
        self.assertEqual(module.bot.ban_chat_member.call_count, 1)
        self.assertEqual(module.bot.send_message.call_count, 1)
        self.assertTrue(module.is_user_banned_or_handled(-1001, 777))

        # Subsequent ban attempts for the same burst should be ignored (no duplicate notifications)
        module.ban_user(-1001, 777, reason="Spam", warning_count=5, warning_limit=3)
        self.assertEqual(module.bot.ban_chat_member.call_count, 1)
        self.assertEqual(module.bot.send_message.call_count, 1)

        # warn_user should also ignore already banned user
        res = module.warn_user(-1001, 777, reason="Spam")
        self.assertEqual(res, 0)


if __name__ == "__main__":
    unittest.main()
