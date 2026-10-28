from flask import Flask, jsonify
from threading import Thread
import time

app = Flask('')
BOOT_TIME = time.time()

@app.route('/')
def home():
    return "Bot is alive!"

@app.route('/health')
@app.route('/healthz')
def health():
    return jsonify({
        "status": "healthy",
        "service": "cu-bot-worker",
        "uptime_seconds": int(time.time() - BOOT_TIME)
    }), 200

def run(port=8080):
    app.run(host='0.0.0.0', port=port)

def keep_alive(port=8080):
    t = Thread(target=run, args=(port,), daemon=True)
    t.start()
