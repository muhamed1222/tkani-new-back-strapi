#!/bin/bash
# Скрипт запуска Strapi с полным логированием

cd "$(dirname "$0")" || exit 1

echo "=========================================="
echo "Запуск Strapi с полным логированием"
echo "=========================================="
echo ""

# Проверки
echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"
echo "✅ Директория: $(pwd)"
echo ""

# Очистка
echo "🧹 Очистка кэша..."
rm -rf .cache build
mkdir -p .tmp
echo ""

# Проверка порта
if lsof -i :1337 >/dev/null 2>&1; then
    echo "⚠️  Порт 1337 занят, освобождаю..."
    lsof -ti :1337 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo "🚀 Запуск Strapi..."
echo ""

# Запуск с перенаправлением всех потоков
exec node node_modules/@strapi/strapi/dist/cli.js develop 2>&1

