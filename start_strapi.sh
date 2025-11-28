#!/bin/bash
# Скрипт запуска Strapi

# Находим директорию скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRAPI_DIR="$SCRIPT_DIR/strapi"

echo "🚀 Запуск Strapi..."
echo "📂 Директория: $STRAPI_DIR"

# Проверяем наличие директории
if [ ! -d "$STRAPI_DIR" ]; then
    echo "❌ Ошибка: директория strapi не найдена!"
    exit 1
fi

# Переходим в директорию strapi
cd "$STRAPI_DIR" || exit 1

# Проверяем .env
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден, создаю..."
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

# Проверяем package.json
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден!"
    exit 1
fi

# Запускаем Strapi
echo "⏳ Запускаю Strapi..."
npm run develop

