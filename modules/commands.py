import logging
import random

import telebot

from core.utils import as_bool, as_list, normalize_id, weighted_choice
from modules.base import BotModule


LOGGER = logging.getLogger(__name__)

COMMAND_CATALOG = {
    "start": ("start", "Nhận một tin nhắn ngẫu nhiên"),
    "help": ("help", "Xem menu chức năng"),
    "policy": ("policy", "Xem nội quy nhóm"),
    "reload": ("reload", "Tải lại cấu hình"),
    "checkbio": ("checkbio", "Kiểm tra bio thành viên"),
    "debuggroup": ("debuggroup", "Kiểm tra quyền bot trong group"),
    "warn": ("warn", "Cảnh báo thành viên"),
    "ban": ("ban", "Cấm thành viên"),
    "unban": ("unban", "Bỏ cấm thành viên"),
    "giveaway": ("giveaway", "Tạo giveaway"),
    "giveaways": ("giveaways", "Xem giveaway đang mở"),
    "join": ("join", "Tham gia giveaway"),
    "draw": ("draw", "Quay số giveaway"),
    "check": ("check", "Tra cứu scam"),
    "report": ("report", "Báo cáo scam"),
}


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
        command_keys = as_list(self.store.value("bot_menu_commands", "start,help,policy"))
        commands = [telebot.types.BotCommand(*COMMAND_CATALOG[key]) for key in command_keys if key in COMMAND_CATALOG]
        try:
            self.bot.set_my_commands(commands)
        except Exception as exc:
            LOGGER.warning("Cannot set bot commands menu: %s", exc)

    def handle_start(self, message):
        selected = weighted_choice(self.store.enabled_rows("messages"))
        text = (
            selected.get("message") or selected.get("text")
            if selected
            else self.store.value("start_fallback_text", "Bot đang hoạt động. Hãy cấu hình tab Tin nhắn để thay đổi nội dung.")
        )
        self.bot.reply_to(message, self.clean_text(text), reply_markup=self.policy_markup(message.chat.id))

    def handle_help(self, message):
        command_keys = as_list(self.setting(message.chat.id, "help_menu_commands", "start,policy,reload,checkbio,debuggroup,warn,ban,unban"))
        lines = [self.setting(message.chat.id, "help_menu_title", "Menu chức năng:")]
        for key in command_keys:
            if key in COMMAND_CATALOG:
                command, description = COMMAND_CATALOG[key]
                lines.append(f"/{command} - {description}")
        self.bot.reply_to(message, "\n".join(lines), reply_markup=self.policy_markup(message.chat.id))

    def handle_policy_callback(self, call):
        self.bot.answer_callback_query(call.id)
        text = self.setting(
            call.message.chat.id,
            "policy_text",
            "Quy định nhóm:\n1. Tôn trọng thành viên.\n2. Không spam/quảng cáo.\n3. Không gửi nội dung cấm.",
        )
        self.bot.send_message(call.message.chat.id, self.clean_text(text), reply_to_message_id=call.message.message_id)

    def policy_markup(self, chat_id):
        if not as_bool(self.setting(chat_id, "show_policy_button", "false"), False):
            return None
        markup = telebot.types.InlineKeyboardMarkup()
        button_text = self.setting(chat_id, "policy_button_text", "Quy định")
        markup.add(telebot.types.InlineKeyboardButton(self.clean_text(button_text), callback_data="show_policy"))
        return markup

    def setting(self, chat_id, key, default=None):
        row = self.group_row(chat_id)
        if row.get(key) not in (None, ""):
            return row.get(key)
        return self.store.value(key, default)

    def group_row(self, chat_id):
        chat_id = str(chat_id)
        for row in self.store.enabled_rows("groups"):
            if normalize_id(row.get("group_id") or row.get("chat_id")) == chat_id:
                return row
        return {}

    def clean_text(self, text):
        return str(text or "").replace("\\r\\n", "\n").replace("\\n", "\n")
