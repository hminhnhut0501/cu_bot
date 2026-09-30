import unittest
from types import SimpleNamespace as Obj
from unittest.mock import Mock
from modules.moderation import ModerationModule


class EmojiSpamTests(unittest.TestCase):
    def message(self, text='', **kwargs):
        return Obj(chat=Obj(id=-1001), text=text, **kwargs)

    def module(self, limit=5, enabled=True):
        m = ModerationModule.__new__(ModerationModule)
        m.setting_bool = Mock(return_value=enabled)
        m.setting_int = Mock(return_value=limit)
        m.delete_violation_message = Mock()
        return m

    def test_boundary_repeated_emojis(self):
        m = self.module()
        self.assertFalse(m.detect_emoji_spam(self.message('😀' * 5)))
        self.assertTrue(m.detect_emoji_spam(self.message('😀' * 6)))
        m.delete_violation_message.assert_called_once()

    def test_sequences_count_as_one(self):
        self.assertEqual(ModerationModule.count_message_emojis(
            self.message('👨‍👩‍👧‍👦👍🏽🇻🇳1️⃣❤️')), 5)
        self.assertEqual(ModerationModule.count_message_emojis(self.message('123 abc tiếng Việt')), 0)

    def test_custom_emoji_utf16_not_double_counted(self):
        msg = self.message('😀👍🏽x', entities=[Obj(type='custom_emoji', offset=2, length=4),
                                                Obj(type='custom_emoji', offset=6, length=1)])
        self.assertEqual(ModerationModule.count_message_emojis(msg), 3)

    def test_forwarded_caption_and_config(self):
        msg = self.message(caption='🔥' * 6, forward_origin=Obj(type='channel'))
        self.assertTrue(self.module().detect_emoji_spam(msg))
        self.assertFalse(self.module(limit=6).detect_emoji_spam(msg))
        self.assertFalse(self.module(enabled=False).detect_emoji_spam(msg))

    def test_normal_and_edited_message_routes(self):
        for handler in ('handle_group_message', 'handle_edited_group_message'):
            m = self.module()
            m.moderation_enabled = Mock(return_value=True)
            m.is_automatic_forward_allowed = Mock(return_value=False)
            m.is_anonymous_admin_message = Mock(return_value=False)
            m.admin_exempt = Mock(return_value=False)
            msg = self.message('🔥' * 6, from_user=Obj(id=12))
            getattr(m, handler)(msg)
            m.delete_violation_message.assert_called_once()

    def test_module_settings_take_precedence(self):
        m = ModerationModule.__new__(ModerationModule)
        m.store = Mock()
        m.store.rows.return_value = [{'module_key': 'moderation', 'settings': {'emoji_spam_max_count': 9}}]
        self.assertEqual(m.setting_int(-1001, 'emoji_spam_max_count', 5), 9)
        m.store.group_value.assert_not_called()


if __name__ == '__main__':
    unittest.main()
