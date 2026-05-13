import logging
import random

import telebot

from core.utils import weighted_choice
from modules.base import BotModule


LOGGER = logging.getLogger(__name__)


class CommandsModule(BotModule):
    name = "commands"
    priority = 1

    def register(self):
        self.bot.message_handler(commands=["start"])(self.handle_start)
        self.bot.message_handler(commands=["help", "menu"])(self.handle_help)
        self.bot.callback_query_handler(func=lambda call: call.data == "show_policy")(self.handle_policy_callback)

    def start(self):
        self.register_bot_commands()

    def register_bot_commands(self):
        commands = [
            telebot.types.BotCommand("start", "Nhận một tin nhắn ngẫu nhiên"),
            telebot.types.BotCommand("help", "Xem menu chức năng"),
            telebot.types.BotCommand("policy", "Xem nội quy nhóm"),
            telebot.types.BotCommand("reload", "Tải lại cấu hình Google Sheet"),
            telebot.types.BotCommand("checkbio", "Kiểm tra bio thành viên"),
            telebot.types.BotCommand("warn", "Cảnh báo thành viên"),
            telebot.types.BotCommand("ban", "Cấm thành viên"),
            telebot.types.BotCommand("unban", "Bỏ cấm thành viên"),
        ]
        try:
            self.bot.set_my_commands(commands)
        except Exception as exc:
            LOGGER.warning("Cannot set bot commands menu: %s", exc)

    def handle_start(self, message):
        selected = weighted_choice(self.sheets.enabled_rows("messages"))
        text = (
            selected.get("message") or selected.get("text")
            if selected
            else "Bot đang hoạt động. Hãy cấu hình tab messages để thay đổi nội dung."
        )
        self.bot.reply_to(message, text, reply_markup=self.policy_markup())

    def handle_help(self, message):
        text = (
            "Menu chức năng:\n"
            "/start - Nhận một tin nhắn ngẫu nhiên\n"
            "/policy - Xem nội quy nhóm\n"
            "/reload - Tải lại cấu hình Google Sheet\n"
            "/checkbio - Kiểm tra bio thành viên\n"
            "/warn - Cảnh báo thành viên\n"
            "/ban - Cấm thành viên\n"
            "/unban - Bỏ cấm thành viên"
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
