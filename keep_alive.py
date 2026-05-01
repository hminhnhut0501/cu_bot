from flask import Flask
from threading import Thread
import os

app = Flask('')

@app.route('/')
def home():
    # Dòng chữ này sẽ hiện ra khi Cron-job truy cập vào web
    return "Bot is alive!"

def run():
    # Render sẽ tự động cấp một cổng (PORT) ngẫu nhiên, ta cần lấy cổng đó
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)

def keep_alive():
    t = Thread(target=run)
    t.start()