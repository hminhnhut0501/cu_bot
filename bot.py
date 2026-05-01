import telebot
import os
from keep_alive import keep_alive

# Lấy Token từ biến môi trường (Bảo mật)
BOT_TOKEN = os.environ.get('BOT_TOKEN')
bot = telebot.TeleBot(BOT_TOKEN)

# Lệnh /start cơ bản
@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.reply_to(message, "Xin chào! Tôi là bot quản lý nhóm.")

# Bạn có thể thêm code quản lý ở đây (ví dụ: cấm user, xóa link...)

# Bật server ảo chạy ngầm
keep_alive()

# Khởi động bot (Long Polling)
print("Bot đang chạy...")
bot.infinity_polling()