import os
from threading import Lock, Thread
import time
from flask import Flask, jsonify

app = Flask("")
BOOT_TIME = time.time()
STALE_SECONDS = max(60, int(os.environ.get("HEALTH_STALE_SECONDS", "180") or 180))

_LOCK = Lock()
_HEARTBEATS = {}
_SERVER_STARTED = False


def register_bot(bot_key):
    now = time.time()
    with _LOCK:
        _HEARTBEATS[str(bot_key)] = {
            "status": "starting",
            "last_ok": now,
            "registered_at": now,
            "error": "",
        }


def record_heartbeat(bot_key):
    now = time.time()
    with _LOCK:
        current = _HEARTBEATS.get(str(bot_key), {"registered_at": now})
        current["status"] = "running"
        current["last_ok"] = now
        current["error"] = ""
        _HEARTBEATS[str(bot_key)] = current


def mark_bot_error(bot_key, error=""):
    now = time.time()
    with _LOCK:
        current = _HEARTBEATS.get(str(bot_key), {"registered_at": now, "last_ok": now})
        current["status"] = "error"
        current["error"] = str(error or "")[:300]
        _HEARTBEATS[str(bot_key)] = current


def health_snapshot():
    now = time.time()
    bots = {}
    healthy = True
    with _LOCK:
        items = list(_HEARTBEATS.items())

    for bot_key, entry in items:
        age = max(0, int(now - entry.get("last_ok", now)))
        status = entry.get("status", "unknown")
        is_stale = age > STALE_SECONDS
        bot_ok = status != "error" and not is_stale
        if not bot_ok:
            healthy = False
        bots[bot_key] = {
            "status": "stale" if (status != "error" and is_stale) else status,
            "last_ok_age_seconds": age,
            "error": entry.get("error", ""),
        }
    return healthy, bots


@app.route("/")
def home():
    healthy, _ = health_snapshot()
    if not healthy:
        return "Bot polling degraded!", 503
    return "Bot is alive!", 200


@app.route("/health")
@app.route("/healthz")
def health():
    healthy, bots = health_snapshot()
    payload = {
        "status": "healthy" if healthy else "degraded",
        "service": "cu-bot-worker",
        "uptime_seconds": int(time.time() - BOOT_TIME),
        "stale_threshold_seconds": STALE_SECONDS,
        "bots": bots,
    }
    return jsonify(payload), (200 if healthy else 503)


def run(port=8080):
    app.run(host="0.0.0.0", port=port)


def keep_alive(port=8080):
    global _SERVER_STARTED
    with _LOCK:
        if _SERVER_STARTED:
            return
        _SERVER_STARTED = True
    t = Thread(target=run, args=(port,), daemon=True)
    t.start()
