from functools import wraps


class BotModule:
    name = "base"
    priority = 100

    def __init__(self, app):
        self.app = app
        self.bot = app.bot
        self.store = app.store
        self.state = app.state
        self.settings = app.settings

    def is_enabled(self):
        return True

    def bot_active(self):
        return self.store.bot_active()

    def active(self, handler):
        @wraps(handler)
        def wrapped(*args, **kwargs):
            if not self.bot_active():
                return None
            return handler(*args, **kwargs)

        return wrapped

    def register(self):
        pass

    def start(self):
        pass
