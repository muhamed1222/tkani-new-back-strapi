#!/bin/bash
# Скрипт для помощи в настройке PostgreSQL

echo "=========================================="
echo "🐘 Настройка PostgreSQL для Tkani"
echo "=========================================="
echo ""

# Проверка наличия PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не установлен!"
    echo ""
    echo "Установите PostgreSQL:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "  CentOS/RHEL: sudo yum install postgresql-server postgresql-contrib"
    echo "  macOS: brew install postgresql"
    exit 1
fi

echo "✅ PostgreSQL установлен"
echo ""

# Запрос данных
read -p "Имя базы данных [tkani_db]: " DB_NAME
DB_NAME=${DB_NAME:-tkani_db}

read -p "Имя пользователя [tkani_user]: " DB_USER
DB_USER=${DB_USER:-tkani_user}

read -sp "Пароль пользователя: " DB_PASSWORD
echo ""

read -p "Хост [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Порт [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo "Создание базы данных и пользователя..."
echo ""

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

# Определяем, как запускать psql (macOS vs Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - PostgreSQL работает от имени текущего пользователя
    # Подключаемся к базе postgres для выполнения команд
    PSQL_CMD="psql postgres"
    echo "Используется macOS (Homebrew PostgreSQL)"
else
    # Linux - PostgreSQL работает от имени postgres
    PSQL_CMD="sudo -u postgres psql postgres"
    echo "Используется Linux (стандартный PostgreSQL)"
fi

# Выполнение SQL
echo "$SQL_SCRIPT" | $PSQL_CMD

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
    echo "  2. Проверьте подключение: python3 -c \"from app import create_app; app = create_app('production'); from models import db; db.engine.connect()\""
else
    echo ""
    echo "❌ Ошибка при создании базы данных"
    echo "Проверьте права доступа и попробуйте выполнить SQL вручную"
fi

