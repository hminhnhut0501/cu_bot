import random

import telebot

from core.utils import weighted_choice
from modules.base import BotModule


class CommandsModule(BotModule):
    name = "commands"
    priority = 1

    def register(self):
        self.bot.message_handler(commands=["start", "help"])(self.handle_start)
        self.bot.callback_query_handler(func=lambda call: call.data == "show_policy")(self.handle_policy_callback)

    def handle_start(self, message):
        selected = weighted_choice(self.sheets.enabled_rows("messages"))
        text = (
            selected.get("message") or selected.get("text")
            if selected
            else "Bot đang hoạt động. Hãy cấu hình tab messages để thay đổi nội dung."
        )
        self.bot.reply_to(message, text, reply_markup=self.policy_markup())

    def handle_policy_callback(self, call):
        self.bot.answer_callback_query(call.id)
        text = self.sheets.value(
            "policy_text",
            "Quy định nhóm:\n1. Tôn trọng thành viên.\n2. Không spam/quảng cáo.\n3. Không gửi nội dung cấm.",
        )
        self.bot.send_message(call.message.chat.id, text, reply_to_message_id=call.message.message_id)

    def policy_markup(self):
        markup = telebot.types.InlineKeyboardMarkup()
        markup.add(telebot.types.InlineKeyboardButton("Quy định", callback_data="show_policy"))
        return markup
