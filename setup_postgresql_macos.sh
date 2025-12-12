#!/bin/bash
# Настройка PostgreSQL для macOS (Homebrew)

echo "=========================================="
echo "🐘 Настройка PostgreSQL для Tkani (macOS)"
echo "=========================================="
echo ""

# Проверка наличия PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не установлен!"
    echo ""
    echo "Установите через Homebrew:"
    echo "  brew install postgresql"
    echo "  brew services start postgresql"
    exit 1
fi

echo "✅ PostgreSQL установлен"
echo ""

# Запрос данных
read -p "Имя базы данных [tkani_db]: " DB_NAME
DB_NAME=${DB_NAME:-tkani_db}

read -p "Имя пользователя [$(whoami)]: " DB_USER
DB_USER=${DB_USER:-$(whoami)}

read -sp "Пароль пользователя (Enter для без пароля): " DB_PASSWORD
echo ""

read -p "Хост [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Порт [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo "Создание базы данных и пользователя..."
echo ""

# SQL скрипт
if [ -z "$DB_PASSWORD" ]; then
    # Без пароля
    SQL_SCRIPT=$(cat <<EOF
-- Создание базы данных
CREATE DATABASE $DB_NAME;

-- Создание пользователя БЕЗ пароля
CREATE USER $DB_USER;

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
    DB_URL="postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
else
    # С паролем
    SQL_SCRIPT=$(cat <<EOF
-- Создание базы данных
CREATE DATABASE $DB_NAME;

-- Создание пользователя с паролем
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
    DB_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
fi

# Выполнение SQL (на macOS от имени текущего пользователя)
# Подключаемся к базе postgres для выполнения команд создания
echo "$SQL_SCRIPT" | psql postgres

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ База данных и пользователь созданы успешно!"
    echo ""
    echo "📝 Добавьте в .env файл:"
    echo ""
    echo "DATABASE_URL=$DB_URL"
    echo ""
    echo "🔧 Следующие шаги:"
    echo "  1. Strapi автоматически создаст БД при первом запуске"
    echo "  2. Проверьте подключение:"
    echo "     python3 -c \"from app import create_app; app = create_app('production'); from models import db; db.engine.connect(); print('✅ OK')\""
else
    echo ""
    echo "❌ Ошибка при создании базы данных"
    echo ""
    echo "Возможные причины:"
    echo "  - База данных или пользователь уже существуют"
    echo "  - PostgreSQL не запущен (запустите: brew services start postgresql)"
    echo "  - Нет прав для создания БД"
    echo ""
    echo "Попробуйте выполнить SQL вручную:"
    echo "  psql postgres"
    echo "  Затем выполните SQL команды из скрипта"
fi

