import telebot
import schedule
import time
import threading
import json
import os
import random
from keep_alive import keep_alive

BOT_TOKEN = os.environ.get('BOT_TOKEN')
bot = telebot.TeleBot(BOT_TOKEN)

CHANNEL_ID = -1003618704054 # THAY BẰNG ID CHANNEL CỦA BẠN (Kho lấy bài)

# --- 1. GROUP ĐẶC BIỆT CHỈ ĐỊNH NHẬN TIN NHẮN TỰ ĐỘNG ---
TARGET_GROUP_ID = -1002151486481

# --- 2. DANH SÁCH TẤT CẢ CÁC GROUP CẦN DỌN DẸP TIN HỆ THỐNG ---
# Nhớ cho cả cái TARGET_GROUP_ID ở trên vào đây để nó cũng được dọn dẹp nhé
GROUP_IDS = [
    -1002151486481, # Group Cú CCCCCCCCCCú
    -1003974574697, # Group 2
    -1003909621344  # Group 3
]

DATA_FILE = 'channel_messages.json'

# Sổ tay ghi nhớ tương tác cho ĐÚNG 1 GROUP mục tiêu
target_group_active = False

def load_message_ids():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return []

def save_message_id(msg_id):
    ids = load_message_ids()
    if msg_id not in ids:
        ids.append(msg_id)
        with open(DATA_FILE, 'w') as f:
            json.dump(ids, f)

# --- CHỨC NĂNG 1: XÓA TIN NHẮN HỆ THỐNG (ÁP DỤNG CHO TẤT CẢ GROUP TRONG DANH SÁCH) ---
@bot.message_handler(content_types=['new_chat_members', 'left_chat_member', 'new_chat_title', 'new_chat_photo', 'delete_chat_photo'])
def clean_system_messages(message):
    if message.chat.id in GROUP_IDS:
        try:
            bot.delete_message(message.chat.id, message.message_id)
        except Exception as e:
            print(f"Lỗi xóa tin nhắn hệ thống: {e}")

# --- CHỨC NĂNG 2: LẮNG NGHE TƯƠNG TÁC (CHỈ THEO DÕI GROUP MỤC TIÊU) ---
@bot.message_handler(func=lambda message: message.chat.id == TARGET_GROUP_ID, content_types=['text', 'photo', 'video', 'document', 'sticker', 'animation'])
def track_target_group_activity(message):
    global target_group_active
    target_group_active = True

# --- CHỨC NĂNG 3: THU THẬP BÀI TỪ CHANNEL ---
@bot.channel_post_handler(func=lambda message: message.chat.id == CHANNEL_ID)
def catch_channel_posts(message):
    save_message_id(message.message_id)
    print(f"Đã lưu tin mới từ Channel: ID {message.message_id}")

# --- CHỨC NĂNG 4: GỬI TIN VÀO GROUP MỤC TIÊU ---
def send_random_message():
    global target_group_active
    
    ids = load_message_ids()
    if not ids:
        return

    # Chỉ gửi nếu group mục tiêu có hoạt động trong ngày
    if target_group_active:
        random_id = random.choice(ids)
        try:
            bot.copy_message(chat_id=TARGET_GROUP_ID, from_chat_id=CHANNEL_ID, message_id=random_id)
            print(f"Đã gửi tin vào Group mục tiêu {TARGET_GROUP_ID}")
            
            # Reset lại trạng thái sổ tay cho ngày mai
            target_group_active = False
        except Exception as e:
            print(f"Lỗi gửi tin vào Group mục tiêu: {e}")
    else:
        print(f"Bỏ qua vì Group mục tiêu hôm nay không có tương tác.")

# Lên lịch gửi lúc 20:00 tối mỗi ngày
schedule.every().day.at("20:00").do(send_random_message)

def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    keep_alive()
    threading.Thread(target=run_scheduler, daemon=True).start()
    print("Bot quản lý nhiều nhóm & auto-post 1 nhóm đang chạy...")
    bot.infinity_polling()