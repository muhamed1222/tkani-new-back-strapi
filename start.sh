#!/bin/bash
# Скрипт для запуска всего проекта

echo "=========================================="
echo "🚀 Запуск проекта Tkani"
echo "=========================================="
echo ""

# Проверка портов
if lsof -ti:5001 >/dev/null 2>&1; then
    echo "⚠️  Порт 5001 занят. Остановите существующий процесс Flask."
    exit 1
fi

if lsof -ti:1337 >/dev/null 2>&1; then
    echo "⚠️  Порт 1337 занят. Остановите существующий процесс Strapi."
    exit 1
fi

# Запуск Flask в фоне
echo "📡 Запуск Flask backend..."
FLASK_ENV=development python3 app.py > flask.log 2>&1 &
FLASK_PID=$!
echo "   Flask PID: $FLASK_PID"
echo "   Логи: flask.log"
echo ""

# Ожидание запуска Flask
sleep 3

# Проверка Flask
if curl -s http://localhost:5001/api/v1/catalog/categories >/dev/null 2>&1; then
    echo "✅ Flask backend запущен: http://localhost:5001"
else
    echo "⚠️  Flask backend запускается..."
fi
echo ""

# Запуск Strapi в фоне
echo "📦 Запуск Strapi CMS..."
cd "$(dirname "$0")" || exit 1
./start_strapi.sh > strapi.log 2>&1 &
STRAPI_PID=$!
echo "   Strapi PID: $STRAPI_PID"
echo "   Логи: strapi.log"
echo ""

# Ожидание запуска Strapi
sleep 5

echo "=========================================="
echo "✅ Проект запущен!"
echo "=========================================="
echo ""
echo "📋 Доступные сервисы:"
echo ""
echo "1. Flask Backend API:"
echo "   - URL: http://localhost:5001"
echo "   - API: http://localhost:5001/api/v1"
echo "   - Swagger: http://localhost:5001/apispec/"
echo ""
echo "2. Strapi CMS:"
echo "   - Admin: http://localhost:1337/admin"
echo "   - API: http://localhost:1337/api"
echo ""
echo "📝 Логи:"
echo "   - Flask: tail -f flask.log"
echo "   - Strapi: tail -f strapi.log"
echo ""
echo "🛑 Для остановки:"
echo "   kill $FLASK_PID $STRAPI_PID"
echo "   или: pkill -f 'python3 app.py' && pkill -f 'start_strapi'"
echo ""


