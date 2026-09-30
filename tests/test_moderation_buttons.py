import unittest
from types import SimpleNamespace
from unittest.mock import Mock

from telebot import types
from modules.moderation import ModerationModule


class ButtonModerationTests(unittest.TestCase):
    def setUp(self):
        self.module = ModerationModule.__new__(ModerationModule)
        for name, value in [('moderation_enabled', True), ('is_automatic_forward_allowed', False),
                            ('is_anonymous_admin_message', False), ('admin_exempt', False),
                            ('setting_bool', True), ('setting', 'warn')]:
            setattr(self.module, name, Mock(return_value=value))
        self.module.delete_violation_message = Mock()
        self.module.apply_action = Mock()
        self.module.detect_emoji_spam = Mock(return_value=False)
        self.message = types.Message.de_json({
            'message_id': 10, 'date': 1,
            'chat': {'id': -100123, 'type': 'supergroup', 'title': 'Test'},
            'from': {'id': 123, 'is_bot': False, 'first_name': 'Test'},
            'text': 'Open',
            'forward_origin': {'type': 'channel', 'date': 1, 'message_id': 2,
                               'chat': {'id': -100456, 'type': 'channel', 'title': 'Source'}},
            'reply_markup': {'inline_keyboard': [[{'text': 'Watch', 'url': 'https://example.com', 'style': 'primary'}]]}
        })

    def test_forwarded_styled_button_is_deleted_before_other_checks(self):
        self.module.handle_group_message(self.message)
        self.module.delete_violation_message.assert_called_once()
        self.module.apply_action.assert_called_once()

    def test_inline_bot_message_still_checked(self):
        self.message.via_bot = SimpleNamespace(id=555, is_bot=True)
        self.module.handle_group_message(self.message)
        self.module.delete_violation_message.assert_called_once()

    def test_sender_chat_deleted_without_punishing_fake_user(self):
        self.message.sender_chat = SimpleNamespace(id=-100456)
        self.module.handle_group_message(self.message)
        self.module.delete_violation_message.assert_called_once()
        self.module.apply_action.assert_not_called()

    def test_edit_with_buttons_is_checked(self):
        self.module.handle_edited_group_message(self.message)
        self.module.delete_violation_message.assert_called_once()

    def test_edit_without_buttons_is_not_deleted(self):
        self.message.reply_markup = None
        self.module.handle_edited_group_message(self.message)
        self.module.delete_violation_message.assert_not_called()

    def test_disabled_rule_and_admin_exemption(self):
        self.module.setting_bool.return_value = False
        self.assertFalse(self.module.detect_inline_keyboard(self.message))
        self.module.setting_bool.return_value = True
        self.module.admin_exempt.return_value = True
        self.module.handle_edited_group_message(self.message)
        self.module.delete_violation_message.assert_not_called()

    def test_raw_markup_and_empty_keyboard(self):
        self.message.reply_markup = {'inline_keyboard': [[{'text': 'Open', 'url': 'https://example.com'}]]}
        self.assertTrue(self.module.detect_inline_keyboard(self.message))
        self.message.reply_markup = {'inline_keyboard': [[]]}
        self.assertFalse(self.module.detect_inline_keyboard(self.message))


if __name__ == '__main__':
    unittest.main()
