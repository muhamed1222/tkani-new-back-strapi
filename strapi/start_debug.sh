#!/bin/bash
# Скрипт запуска Strapi с диагностикой

cd "$(dirname "$0")" || exit 1

echo "🔍 Диагностика Strapi..."
echo "📂 Директория: $(pwd)"

# Проверка Node.js
echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"

# Проверка .env
if [ ! -f ".env" ]; then
    echo "❌ .env не найден, создаю..."
    python3 << 'PYEOF'
import secrets
import base64
import os

keys = [base64.b64encode(secrets.token_bytes(32)).decode() for _ in range(4)]
admin_jwt = base64.b64encode(secrets.token_bytes(32)).decode()
api_token = base64.b64encode(secrets.token_bytes(32)).decode()
transfer_token = base64.b64encode(secrets.token_bytes(32)).decode()

env_content = f"""APP_KEYS={','.join(keys)}
ADMIN_JWT_SECRET={admin_jwt}
API_TOKEN_SALT={api_token}
TRANSFER_TOKEN_SALT={transfer_token}
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
HOST=0.0.0.0
PORT=1337
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:5001,http://localhost:5173
"""

with open('.env', 'w') as f:
    f.write(env_content)
print("✅ .env создан")
PYEOF
fi

# Очистка кэша
echo "🧹 Очистка кэша..."
rm -rf .cache build .tmp/data.db*

# Создание директории для БД
mkdir -p .tmp

# Проверка порта
if lsof -i :1337 >/dev/null 2>&1; then
    echo "⚠️  Порт 1337 занят, убиваю процесс..."
    lsof -ti :1337 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Пересборка better-sqlite3
echo "🔨 Пересборка better-sqlite3..."
npm rebuild better-sqlite3 2>&1 | tail -5

echo ""
echo "🚀 Запуск Strapi с подробными логами..."
echo "📝 Логи будут выводиться в консоль"
echo ""

# Запуск с подробными логами
STRAPI_LOG_LEVEL=debug NODE_ENV=development npm run develop

