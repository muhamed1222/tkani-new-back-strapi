#!/bin/bash

# Скрипт установки Strapi CMS

echo "🚀 Установка Strapi CMS..."

# Переходим в директорию strapi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRAPI_DIR="$SCRIPT_DIR/strapi"

if [ ! -d "$STRAPI_DIR" ]; then
    echo "❌ Директория strapi не найдена!"
    exit 1
fi

cd "$STRAPI_DIR" || exit 1

echo "📦 Установка зависимостей..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при установке зависимостей!"
    exit 1
fi

echo "✅ Зависимости установлены!"

# Создаем .env файл если его нет
if [ ! -f .env ]; then
    echo "📝 Создание .env файла..."
    
    # Генерируем ключи
    echo "🔑 Генерация ключей..."
    KEY1=$(openssl rand -base64 32)
    KEY2=$(openssl rand -base64 32)
    KEY3=$(openssl rand -base64 32)
    KEY4=$(openssl rand -base64 32)
    ADMIN_JWT=$(openssl rand -base64 32)
    API_TOKEN=$(openssl rand -base64 32)
    TRANSFER_TOKEN=$(openssl rand -base64 32)
    
    cat > .env << EOF
# App Keys (auto-generated)
APP_KEYS=$KEY1,$KEY2,$KEY3,$KEY4

# Admin JWT Secret (auto-generated)
ADMIN_JWT_SECRET=$ADMIN_JWT

# API Token Salt (auto-generated)
API_TOKEN_SALT=$API_TOKEN

# Transfer Token Salt (auto-generated)
TRANSFER_TOKEN_SALT=$TRANSFER_TOKEN

# Database (SQLite для разработки)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Server
HOST=0.0.0.0
PORT=1337

# CORS (разрешенные источники)
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:5001,http://localhost:5173
EOF
    
    echo "✅ Файл .env создан с автоматически сгенерированными ключами!"
else
    echo "⚠️  Файл .env уже существует, пропускаем создание"
fi

echo ""
echo "✅ Strapi установлен и настроен!"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Запустите Strapi: cd strapi && npm run develop"
echo "   2. При первом запуске создайте администраторский аккаунт"
echo "   3. Создайте API Token в Strapi: Settings > API Tokens > Create new API Token"
echo "   4. Добавьте токен в .env проекта: STRAPI_API_TOKEN=your-token"
echo ""
echo "🌐 Strapi админ-панель будет доступна на: http://localhost:1337/admin"

