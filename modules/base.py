class BotModule:
    name = "base"
    priority = 100

    def __init__(self, app):
        self.app = app
        self.bot = app.bot
        self.sheets = app.sheets
        self.state = app.state
        self.settings = app.settings

    def is_enabled(self):
        return True

    def register(self):
        pass

    def start(self):
        pass
