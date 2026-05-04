import telebot
import schedule
import time
import threading
import os
import random
import requests
import csv
from datetime import datetime
from keep_alive import keep_alive

# Lấy Token từ môi trường Render
BOT_TOKEN = os.environ.get('BOT_TOKEN')
bot = telebot.TeleBot(BOT_TOKEN)

# --- CẤU HÌNH ---
# Thay link CSV của bạn vào đây
SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJtSjUmfI3lS603OkbqIAalNvlz3wMV3dDCIl9n9Kaf2bb3yF7JW3cReYITDrZukvPBwKcU6gvwwZo/pub?gid=1041570934&single=true&output=csv"

TARGET_GROUP_ID = -1002151486481 
GROUP_IDS = [
    -1002151486481, # Group Cú CCCCCCCCCCú
    -1003974574697, # Group 2[cite: 1]
    -1003909621344  # Group 3[cite: 1]
]

START_MESSAGES = [
    "Chào sếp! Bot Sheets đã online và sẵn sàng trực chiến. 🚀",
    "Hệ thống đã kết nối thành công! Tôi sẽ canh group cẩn thận. 🛡️",
    "Báo cáo: Code đã được cập nhật mới nhất. Mọi thứ đều ổn định! ✅",
    "Chào bạn! Tôi vẫn đang theo dõi Sheets để lấy tin nhắn cho group đây. 🤖"
]

target_group_active = False[cite: 1]

# --- HÀM LẤY DỮ LIỆU TỪ SHEETS[cite: 1] ---
def get_messages_from_sheet():
    try:
        response = requests.get(SHEET_CSV_URL)
        response.encoding = 'utf-8'
        decoded_content = response.content.decode('utf-8')
        cr = csv.reader(decoded_content.splitlines(), delimiter=',')
        return [row[0] for row in list(cr) if row]
    except Exception as e:
        print(f"Lỗi đọc Sheets: {e}")
        return []

# --- PHẢN HỒI LỆNH /START[cite: 1] ---
@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = random.choice(START_MESSAGES)
    bot.reply_to(message, welcome_text)

# --- XÓA TIN NHẮN HỆ THỐNG (3 GROUP)[cite: 1] ---
@bot.message_handler(content_types=['new_chat_members', 'left_chat_member', 'new_chat_title', 'new_chat_photo', 'delete_chat_photo'])
def clean_system_messages(message):
    if message.chat.id in GROUP_IDS:
        try:
            bot.delete_message(message.chat.id, message.message_id)
        except Exception as e:
            print(f"Lỗi xóa tin nhắn hệ thống: {e}")

# --- THEO DÕI TƯƠNG TÁC TRONG GROUP MỤC TIÊU[cite: 1] ---
@bot.message_handler(func=lambda message: message.chat.id == TARGET_GROUP_ID, 
                     content_types=['text', 'photo', 'video', 'document', 'sticker', 'animation'])
def track_activity(message):
    global target_group_active
    if not message.from_user.is_bot:
        target_group_active = True

# --- HÀM GỬI TIN NHẮN[cite: 1] ---
def job_send_message(is_first_run=False):
    global target_group_active
    
    if is_first_run or target_group_active:
        messages = get_messages_from_sheet()
        if messages:
            msg = random.choice(messages)
            try:
                prefix = "🚀 [Khởi động hệ thống]\n" if is_first_run else ""
                bot.send_message(TARGET_GROUP_ID, f"{prefix}{msg}")
                target_group_active = False 
                print(f"[{datetime.now()}] Đã gửi tin nhắn thành công.")
            except Exception as e:
                print(f"Lỗi gửi tin: {e}")
    else:
        print(f"[{datetime.now()}] Bỏ qua vì group im lặng.")

# Lên lịch cố định 20:00 mỗi tối[cite: 1]
schedule.every().day.at("20:00").do(job_send_message)

def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

# --- KHỞI CHẠY[cite: 1] ---
if __name__ == "__main__":
    keep_alive()
    
    # 1. Gửi tin nhắn chào sân ngay lập tức khi vừa đẩy code[cite: 1]
    print("Đang gửi tin nhắn chào sân...")
    job_send_message(is_first_run=True)
    
    # 2. Chạy luồng lịch trình ngầm[cite: 1]
    threading.Thread(target=run_scheduler, daemon=True).start()
    
    print("--- Bot Sheets (Cố định 20:00) đang chạy ---")
    bot.infinity_polling()