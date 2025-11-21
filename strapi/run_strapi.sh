#!/bin/bash
# Скрипт для запуска Strapi с подробными логами

cd "$(dirname "$0")" || exit 1

echo "🚀 Запуск Strapi..."
echo "📂 Директория: $(pwd)"
echo ""

# Проверка Node.js
echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"
echo ""

# Очистка кэша
echo "🧹 Очистка кэша..."
rm -rf .cache build
echo ""

# Создание директории для БД
mkdir -p .tmp

# Проверка порта
if lsof -i :1337 >/dev/null 2>&1; then
    echo "⚠️  Порт 1337 занят, убиваю процесс..."
    lsof -ti :1337 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo "🚀 Запуск Strapi в режиме разработки..."
echo "📝 Логи будут выводиться ниже"
echo ""

# Запуск с подробными логами
STRAPI_LOG_LEVEL=debug NODE_ENV=development npm run develop

