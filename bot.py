import telebot
import schedule
import time
import threading
import json
import os
import random
from keep_alive import keep_alive

# Lấy Token từ môi trường Render
BOT_TOKEN = os.environ.get('BOT_TOKEN')
bot = telebot.TeleBot(BOT_TOKEN)

# --- CẤU HÌNH ID ---
CHANNEL_ID = -1003618704054 
TARGET_GROUP_ID = -1002151486481

GROUP_IDS = [
    -1002151486481, # Group Cú CCCCCCCCCCú
    -1003974574697, # Group 2
    -1003909621344  # Group 3
]

DATA_FILE = 'channel_messages.json'

# --- DANH SÁCH CÂU CHÀO NGẪU NHIÊN CHO LỆNH /START ---
START_MESSAGES = [
    "Chào bạn! Tôi là trợ lý quản lý nhóm của bạn. Chúc bạn một ngày tốt lành! ☀️",
    "Hê-lô! Bot đã sẵn sàng trực chiến. Bạn cần giúp gì không? 🤖",
    "Xin chào! Tôi vẫn đang hoạt động ổn định và theo dõi các group đây. 🛡️",
    "Chào sếp! Mọi hệ thống dọn dẹp và lên lịch đều đang vận hành trơn tru. 🚀",
    "Ting ting! Bot nghe rõ trả lời. Chúc bạn làm việc hiệu quả! 📈"
]

# Biến ghi nhớ tương tác
target_group_active = False

# --- HÀM HỖ TRỢ DỮ LIỆU ---
def load_message_ids():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_message_id(msg_id):
    ids = load_message_ids()
    if msg_id not in ids:
        ids.append(msg_id)
        with open(DATA_FILE, 'w') as f:
            json.dump(ids, f)

# --- CHỨC NĂNG: PHẢN HỒI /START NGẪU NHIÊN ---
@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = random.choice(START_MESSAGES)
    bot.reply_to(message, welcome_text)

# --- CHỨC NĂNG 1: XÓA TIN NHẮN HỆ THỐNG ---
@bot.message_handler(content_types=['new_chat_members', 'left_chat_member', 'new_chat_title', 'new_chat_photo', 'delete_chat_photo'])
def clean_system_messages(message):
    if message.chat.id in GROUP_IDS:
        try:
            bot.delete_message(message.chat.id, message.message_id)
            print(f"Đã xóa tin nhắn hệ thống tại Group: {message.chat.id}")
        except Exception as e:
            print(f"Lỗi xóa tin nhắn hệ thống: {e}")

# --- CHỨC NĂNG 2: LẮNG NGHE TƯƠNG TÁC (CHỈ GROUP MỤC TIÊU) ---
@bot.message_handler(func=lambda message: message.chat.id == TARGET_GROUP_ID, 
                     content_types=['text', 'photo', 'video', 'document', 'sticker', 'animation'])
def track_group_activity(message):
    global target_group_active
    if not target_group_active:
        target_group_active = True
        print(f"Đã ghi nhận tương tác tại Group mục tiêu: {TARGET_GROUP_ID}")

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
        print("Lịch chạy: Không có bài viết nào trong kho để gửi.")
        return

    if target_group_active:
        random_id = random.choice(ids)
        try:
            bot.copy_message(chat_id=TARGET_GROUP_ID, from_chat_id=CHANNEL_ID, message_id=random_id)
            print(f"Lịch chạy: Đã gửi tin (ID: {random_id}) vào Group {TARGET_GROUP_ID}")
            # Reset trạng thái cho ngày mới
            target_group_active = False
        except Exception as e:
            print(f"Lỗi gửi tin định kỳ: {e}")
    else:
        print(f"Lịch chạy: Bỏ qua Group {TARGET_GROUP_ID} vì hôm nay không có tương tác.")

# Lên lịch gửi lúc 20:00 tối mỗi ngày (Giờ VN nếu đã set TZ trên Render)
schedule.every().day.at("20:00").do(send_random_message)

def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

# --- KHỞI CHẠY ---
if __name__ == "__main__":
    # Bật server keep-alive cho Render
    keep_alive()
    
    # Chạy luồng lịch trình ngầm
    threading.Thread(target=run_scheduler, daemon=True).start()
    
    print("--- Hệ thống Bot đang hoạt động ---")
    print(f"Target Group: {TARGET_GROUP_ID}")
    print(f"Dọn dẹp tại: {len(GROUP_IDS)} groups")
    
    bot.infinity_polling()