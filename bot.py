import telebot
import schedule
import time
import threading
import os
import random
from keep_alive import keep_alive

# Lấy Token từ môi trường Render
BOT_TOKEN = os.environ.get('BOT_TOKEN')
bot = telebot.TeleBot(BOT_TOKEN)

# --- CẤU HÌNH ID ---
TARGET_GROUP_ID = -1002151486481  # Group nhận tin nhắn tự động
GROUP_IDS = [
    -1002151486481, # Group Cú CCCCCCCCCCú
    -1003974574697, # Group 2
    -1003909621344  # Group 3
]

# --- DANH SÁCH DỮ LIỆU TIN NHẮN TƯƠNG TÁC (50 CÂU) ---
MESSAGES_LIST = [
    "Tối rồi mọi người ơi, nay ai online điểm danh cái nha 👀",
    "Hôm nay ai vừa xem xong gì hay ho không, chia sẻ đi 😏",
    "Có ai đang chill tối giống mình không ta ☕",
    "Tối nay group hơi im nha, ai thức thì thả cái icon cho xôm đi 🔥",
    "Mọi người hay online giờ này hay trễ hơn vậy 🤔",
    "Nay có ai “cày” gì không hay chỉ lướt lướt thôi 😆",
    "Tối rồi, ai đang nằm lướt điện thoại giơ tay ✋",
    "Có ai vừa ăn tối xong chưa, vào nói chuyện cho vui nè 🍜",
    "Nay trời mát ghê, ngồi lướt group chill thiệt 😌",
    "Tối nay mood mọi người sao rồi, vui hay buồn 🫶",
    "Có ai hay xem ban đêm giống mình không, ban ngày lười 😴",
    "Hôm nay có gì mới không ta, ai cập nhật mình với 👀",
    "Ai đang “ẩn danh” trong group thì lên tiếng đi 😏",
    "Tối nay ai rảnh thì tám chuyện chút đi nè 💬",
    "Có ai vừa vào group lần đầu không, chào cái cho quen nha 🤝",
    "Mọi người thường online giờ nào nhất vậy 🤔",
    "Nay ai có mood “chill nhẹ” không ta 🍃",
    "Group mình đông mà sao tối im quá 😆",
    "Ai đang nằm mà chưa ngủ điểm danh cái nào 🛏️",
    "Tối nay ai thức khuya không, mình chắc thức 😏",
    "Có ai vừa xem xong gì mà thấy “đáng” không 😆",
    "Mọi người thích xem kiểu nào hơn, nhanh gọn hay từ từ 🤔",
    "Nay ai có gì hay thì share nhẹ đi nè 👀",
    "Ai đang online mà không nói gì là bị phát hiện đó nha 😏",
    "Tối rồi, ai rảnh vào tám chuyện cho vui nè 💬",
    "Có ai vừa vào group mà chưa quen không, mình chào cái 🫶",
    "Nay mọi người có gì vui không, kể nghe với 😆",
    "Ai đang lướt mà chưa tương tác thì thả cái icon đi 🔥",
    "Tối nay ai đang ở nhà hết không hay đi chơi rồi 🤔",
    "Có ai kiểu càng khuya càng tỉnh giống mình không 😅",
    "Nay group hơi yên nha, cần người “khuấy động” 😏",
    "Ai đang online mà đọc tới đây thì comment cái coi 👀",
    "Tối nay có ai “chill nhẹ” không ta ☕",
    "Mọi người hay online giờ này hay giờ khác 🤔",
    "Ai vừa mới vào group thì giới thiệu nhẹ nha 🫶",
    "Nay ai có gì hay ho thì chia sẻ đi 😆",
    "Tối rồi, ai chưa ngủ thì vào nói chuyện chút đi 💬",
    "Có ai đang nằm lướt mà cười một mình không 😏",
    "Ai đang đọc mà không rep là bị để ý đó nha 👀",
    "Tối nay ai đang “rảnh rỗi” giống mình không 😆",
    "Nay mọi người hoạt động ít quá, kéo tương tác cái nào 🔥",
    "Ai online mà thấy tin này thì thả ❤️ cái nha",
    "Có ai vừa ăn tối xong chưa, vào tám chuyện đi 🍜",
    "Tối nay mood “chill chill” quá 😌",
    "Ai đang thức thì lên tiếng cho đỡ buồn nè 😏",
    "Có ai hay lướt group trước khi ngủ không 🤔",
    "Nay ai có câu chuyện gì vui không kể nghe với 😆",
    "Tối rồi, ai còn năng lượng thì vào quẩy nhẹ 💥",
    "Ai đang online mà chưa tương tác thì bị phát hiện rồi nha 👀",
    "Chúc mọi người tối vui vẻ nha, ai rảnh thì vào tám tiếp 🫶"
]

# --- DANH SÁCH CÂU CHÀO KHI NHẤN /START ---
START_MESSAGES = [
    "Chào bạn! Tôi là trợ lý quản lý nhóm. Bot đang online 24/7! ☀️",
    "Hê-lô! Hệ thống vận hành tốt. Bạn cần giúp gì không? 🤖",
    "Chào sếp! Mọi group đều đang được giám sát chặt chẽ. 🛡️",
    "Ting ting! Bot nghe rõ trả lời. Chúc sếp ngày mới rực rỡ! 🚀"
]

# Biến ghi nhớ tương tác
target_group_active = False

# --- CHỨC NĂNG: PHẢN HỒI /START ---
@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    welcome_text = random.choice(START_MESSAGES)
    bot.reply_to(message, welcome_text)

# --- CHỨC NĂNG 1: XÓA TIN NHẮN HỆ THỐNG (3 GROUP) ---
@bot.message_handler(content_types=['new_chat_members', 'left_chat_member', 'new_chat_title', 'new_chat_photo', 'delete_chat_photo'])
def clean_system_messages(message):
    if message.chat.id in GROUP_IDS:
        try:
            bot.delete_message(message.chat.id, message.message_id)
        except Exception as e:
            print(f"Lỗi xóa tin nhắn hệ thống: {e}")

# --- CHỨC NĂNG 2: LẮNG NGHE TƯƠNG TÁC (CHỈ GROUP MỤC TIÊU) ---
@bot.message_handler(func=lambda message: message.chat.id == TARGET_GROUP_ID, 
                     content_types=['text', 'photo', 'video', 'document', 'sticker', 'animation'])
def track_group_activity(message):
    global target_group_active
    # Nếu tin nhắn không phải của bot, đánh dấu group có hoạt động
    if not message.from_user.is_bot:
        target_group_active = True

# --- CHỨC NĂNG 3: GỬI TIN NHẮN NGẪU NHIÊN ---
def send_random_message():
    global target_group_active
    
    if target_group_active:
        random_text = random.choice(MESSAGES_LIST)
        try:
            bot.send_message(chat_id=TARGET_GROUP_ID, text=random_text)
            print(f"Lịch chạy: Đã gửi thành công tin nhắn tương tác vào Group {TARGET_GROUP_ID}")
            # Reset trạng thái
            target_group_active = False
        except Exception as e:
            print(f"Lỗi gửi tin định kỳ: {e}")
    else:
        print(f"Lịch chạy: Bỏ qua Group {TARGET_GROUP_ID} vì hôm nay không có tương tác thành viên.")

# Lên lịch gửi lúc 20:00 tối mỗi ngày
schedule.every().day.at("20:00").do(send_random_message)

def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

# --- KHỞI CHẠY ---
if __name__ == "__main__":
    keep_alive()
    threading.Thread(target=run_scheduler, daemon=True).start()
    print("--- Bot tương tác tối 20:00 đã sẵn sàng ---")
    bot.infinity_polling()