import unittest
from unittest.mock import Mock
from types import SimpleNamespace
import telebot
from modules.moderation import ModerationModule


class RichSpamTests(unittest.TestCase):
    def setUp(self):
        self.bot = telebot.TeleBot('123:test', threaded=False)
        self.m = ModerationModule(SimpleNamespace(bot=self.bot, store=Mock(), state=Mock(), settings=Mock()))
        self.m.bot_active = Mock(return_value=True)
        self.m.moderation_enabled = Mock(return_value=True)
        self.m.setting_bool = Mock(return_value=True)
        self.m.is_automatic_forward_allowed = Mock(return_value=False)
        self.m.is_admin = Mock(return_value=False)
        self.m.delete_violation_message = Mock()
        self.m.ban_user = Mock()
        self.m.audit = Mock()
        self.bot.ban_chat_sender_chat = Mock()
        self.m.register()

    def payload(self):
        return {'message_id': 1, 'date': 1, 'chat': {'id': -1001, 'type': 'supergroup'},
                'from': {'id': 42, 'is_bot': False, 'first_name': 'Test'},
                'rich_message': {'blocks': [{'type': 'details', 'blocks': [
                    {'type': 'buttons', 'buttons': [{'text': {'type': 'plain', 'text': 'Open'},
                                                   'style': 'danger', 'url': 'https://example.com'}]}]}]}}

    def test_raw_new_and_edited_updates_reach_filter(self):
        for kind in ('message', 'edited_message'):
            self.bot.process_new_updates([telebot.types.Update.de_json({'update_id': 1, kind: self.payload()})])
        self.assertEqual(self.m.ban_user.call_count, 2)
        self.assertTrue(self.m.ban_user.call_args.kwargs['permanent'])
        self.assertEqual(self.m.delete_violation_message.call_count, 2)

    def test_embedded_text_button(self):
        self.assertTrue(self.m.rich_has_buttons({'blocks': [{'type': 'paragraph', 'text': {
            'type': 'button', 'button': {'url': 'https://example.com'}}}]}))
        self.assertFalse(self.m.rich_has_buttons({'blocks': [{'type': 'paragraph', 'text': 'button'}]}))

    def test_channel_identity(self):
        data = self.payload()
        data['sender_chat'] = {'id': -2002, 'type': 'channel', 'title': 'Channel'}
        self.m.handle_rich_message(telebot.types.Message.de_json(data))
        self.bot.ban_chat_sender_chat.assert_called_once_with(-1001, -2002)
        self.m.ban_user.assert_not_called()

    def test_admin_and_disabled_rule(self):
        msg = telebot.types.Message.de_json(self.payload())
        self.m.is_admin.return_value = True
        self.m.handle_rich_message(msg)
        self.m.is_admin.return_value = False
        self.m.setting_bool.return_value = False
        self.m.handle_rich_message(msg)
        self.m.delete_violation_message.assert_not_called()
        self.m.ban_user.assert_not_called()

    def test_permanent_ignores_temporary_ban_setting(self):
        self.m.setting_int = Mock(return_value=3600)
        self.bot.ban_chat_member = Mock()
        self.m.record_member_moderation_state = Mock()
        self.m.actor_for_system = Mock(return_value='bot')
        ModerationModule.ban_user(self.m, -1001, 42, permanent=True)
        self.bot.ban_chat_member.assert_called_once_with(-1001, 42, until_date=None)
        self.m.setting_int.assert_not_called()

if __name__ == '__main__':
    unittest.main()
