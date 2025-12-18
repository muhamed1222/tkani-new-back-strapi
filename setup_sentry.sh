#!/bin/bash
# Скрипт для помощи в настройке Sentry

echo "=========================================="
echo "🐛 Настройка Sentry для мониторинга ошибок"
echo "=========================================="
echo ""

echo "📋 Шаги для настройки Sentry:"
echo ""
echo "1. Зарегистрируйтесь на https://sentry.io"
echo "2. Создайте новый проект:"
echo "   - Выберите платформу: Python"
echo "   - Выберите фреймворк: Flask"
echo "   - Назовите проект (например: Tkani Backend)"
echo ""
echo "3. После создания проекта вы получите DSN"
echo "   DSN выглядит так:"
echo "   https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o1234567.ingest.sentry.io/1234567"
echo ""

read -p "Введите ваш Sentry DSN (или нажмите Enter, чтобы пропустить): " SENTRY_DSN

if [ -z "$SENTRY_DSN" ]; then
    echo ""
    echo "⚠️  Sentry пропущен. Вы можете настроить его позже."
    echo "   См. инструкцию: SENTRY_SETUP.md"
    exit 0
fi

read -p "Окружение [production]: " SENTRY_ENV
SENTRY_ENV=${SENTRY_ENV:-production}

echo ""
echo "Добавление настроек в .env..."

# Проверяем, существует ли .env
if [ ! -f .env ]; then
    echo "Создание .env файла..."
    touch .env
fi

# Удаляем старые настройки Sentry, если есть
sed -i '' '/^SENTRY_DSN=/d' .env 2>/dev/null || sed -i '/^SENTRY_DSN=/d' .env 2>/dev/null
sed -i '' '/^SENTRY_ENVIRONMENT=/d' .env 2>/dev/null || sed -i '/^SENTRY_ENVIRONMENT=/d' .env 2>/dev/null

# Добавляем новые настройки
echo "" >> .env
echo "# Sentry (мониторинг ошибок)" >> .env
echo "SENTRY_DSN=$SENTRY_DSN" >> .env
echo "SENTRY_ENVIRONMENT=$SENTRY_ENV" >> .env

echo ""
echo "✅ Sentry настроен!"
echo ""
echo "📝 Добавлено в .env:"
echo "   SENTRY_DSN=$SENTRY_DSN"
echo "   SENTRY_ENVIRONMENT=$SENTRY_ENV"
echo ""
echo "🔧 Следующие шаги:"
echo "   1. Перезапустите приложение"
echo "   2. Проверьте Sentry Dashboard - ошибки должны появляться автоматически"
echo ""
echo "💡 Для тестирования создайте тестовую ошибку (см. SENTRY_SETUP.md)"

