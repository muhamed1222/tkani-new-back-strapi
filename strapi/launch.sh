#!/bin/bash
# Скрипт запуска Strapi

cd "$(dirname "$0")" || exit 1

echo "🚀 Запуск Strapi..."
echo "📂 Директория: $(pwd)"

# Проверяем наличие package.json
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден!"
    exit 1
fi

# Проверяем и создаём .env при необходимости
if [ ! -f ".env" ]; then
    echo "⚠️  .env не найден — генерирую базовый .env"
    python3 << 'PYEOF'
import secrets, base64
keys = [base64.b64encode(secrets.token_bytes(32)).decode() for _ in range(4)]
print(f"""APP_KEYS={','.join(keys)}
ADMIN_JWT_SECRET={base64.b64encode(secrets.token_bytes(32)).decode()}
API_TOKEN_SALT={base64.b64encode(secrets.token_bytes(32)).decode()}
TRANSFER_TOKEN_SALT={base64.b64encode(secrets.token_bytes(32)).decode()}
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
HOST=0.0.0.0
PORT=1337
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:5001,http://localhost:5173
""")
PYEOF
fi

echo "🧹 Очистка кэша и временных файлов..."
rm -rf .cache build .tmp
mkdir -p .tmp

echo "📦 Проверка/установка зависимостей..."
npm install --silent

echo "🔧 Пересборка better-sqlite3 (на macOS/Node 20+ иногда требуется)..."
npm rebuild better-sqlite3 --silent || true

# Если порт занят — предложим альтернативный
PORT_VAL=$(grep -E '^PORT=' .env | cut -d'=' -f2 | tr -d '[:space:]')
if [ -z "$PORT_VAL" ]; then
  PORT_VAL=1337
fi
if lsof -i :"$PORT_VAL" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "⚠️  Порт $PORT_VAL занят. Переключаюсь на 1338."
  if grep -qE '^PORT=' .env; then
    sed -i '' 's/^PORT=.*/PORT=1338/' .env 2>/dev/null || true
  else
    echo "PORT=1338" >> .env
  fi
  PORT_VAL=1338
fi

echo "⏳ Запускаю Strapi в режиме разработки на порту ${PORT_VAL}..."
export DEBUG=strapi:*,koa:*
export STRAPI_LOG_LEVEL=debug
npm run develop

