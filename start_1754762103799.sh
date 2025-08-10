#!/bin/bash

echo "🎰 Запуск Golden Palace Casino..."

# Убиваем существующие процессы
pkill -f "node"
pkill -f "integrated"

# Даем время процессам завершиться
sleep 2

# Устанавливаем переменные окружения
export TELEGRAM_BOT_TOKEN=443197:AA06UhNbGOfUiUDvaPyfdRWFB9FCKZgEMEe
export NODE_ENV=development

# Запускаем интегрированный сервер
echo "🔧 Запуск Golden Palace Casino сервера..."
node integrated-server.js &
SERVER_PID=$!

echo "✅ Сервер запущен!"
echo "🎰 Casino: http://localhost:3000"
echo "🔌 API: http://localhost:3000/api/health"
echo "📱 Telegram Bot Connected: ✅"

# Ждем завершения
wait $SERVER_PID