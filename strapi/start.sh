#!/bin/bash
# Простой скрипт запуска Strapi

echo "🚀 Запуск Strapi..."
cd "$(dirname "$0")" || exit 1

# Проверяем .env
if [ ! -f ".env" ]; then
    echo "⚠️  Создаю .env файл..."
    python3 << 'PYEOF'
import secrets
import base64

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

echo "⏳ Запускаю Strapi..."
npm run develop

