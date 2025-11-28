#!/bin/bash
# Ручная настройка PostgreSQL (без интерактивного ввода)

# Настройки (измените по необходимости)
DB_NAME="tkani_db"
DB_USER="tkani_user"
DB_PASSWORD="change_this_password"  # ИЗМЕНИТЕ ПАРОЛЬ!
DB_HOST="localhost"
DB_PORT="5432"

echo "=========================================="
echo "🐘 Настройка PostgreSQL для Tkani"
echo "=========================================="
echo ""
echo "Настройки:"
echo "  База данных: $DB_NAME"
echo "  Пользователь: $DB_USER"
echo "  Хост: $DB_HOST"
echo "  Порт: $DB_PORT"
echo ""
echo "⚠️  ВАЖНО: Измените пароль в скрипте перед запуском!"
echo ""
read -p "Продолжить? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено"
    exit 1
fi

# SQL скрипт
SQL_SCRIPT=$(cat <<EOF
-- Создание базы данных
CREATE DATABASE $DB_NAME;

-- Создание пользователя
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Права на базу данных
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Подключение к базе данных
\c $DB_NAME

-- Права на схему (для PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF
)

# Выполнение SQL
echo "Создание базы данных и пользователя..."
echo "$SQL_SCRIPT" | sudo -u postgres psql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ База данных и пользователь созданы успешно!"
    echo ""
    echo "📝 Добавьте в .env файл:"
    echo ""
    echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    echo ""
    echo "🔧 Следующие шаги:"
    echo "  1. Примените миграции: flask db upgrade"
    echo "  2. Проверьте подключение"
else
    echo ""
    echo "❌ Ошибка при создании базы данных"
    echo "Возможные причины:"
    echo "  - База данных или пользователь уже существуют"
    echo "  - Нет прав для создания БД"
    echo "  - PostgreSQL не запущен"
fi

