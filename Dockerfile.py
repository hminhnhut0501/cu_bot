# File nay duoc giu lai de tuong thich voi thiet lap cu.
# Khuyen dung file Dockerfile moi o repo root.
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["python", "bot.py"]
