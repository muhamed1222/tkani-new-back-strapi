#!/bin/bash

# Скрипт для генерации .env файлов для backend и Strapi
# Использование: ./generate_env_files.sh yourdomain.ru

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Ошибка: Укажите домен${NC}"
    echo "Использование: ./generate_env_files.sh yourdomain.ru"
    exit 1
fi

DOMAIN=$1
API_DOMAIN="api.$DOMAIN"
CMS_DOMAIN="cms.$DOMAIN"

# Генерация случайных ключей
generate_secret() {
    openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || echo "$(date +%s | sha256sum | base64 | head -c 32)"
}

SECRET_KEY=$(generate_secret)
JWT_SECRET_KEY=$(generate_secret)
STRAPI_APP_KEYS=$(generate_secret)
STRAPI_API_TOKEN_SALT=$(generate_secret)
STRAPI_ADMIN_JWT_SECRET=$(generate_secret)
STRAPI_TRANSFER_TOKEN_SALT=$(generate_secret)
STRAPI_JWT_SECRET=$(generate_secret)

echo -e "${GREEN}=== Генерация .env файлов для $DOMAIN ===${NC}"

# Backend .env
echo -e "${YELLOW}Создание backend/.env...${NC}"
cat > .env << EOF
# Flask настройки
FLASK_ENV=production
SECRET_KEY=$SECRET_KEY
JWT_SECRET_KEY=$JWT_SECRET_KEY

# База данных
DATABASE_URL=sqlite:///app.db
# Для PostgreSQL раскомментируйте:
# DATABASE_URL=postgresql://user:password@localhost/tkani_db

# Strapi настройки
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-strapi-api-token-here

# CORS настройки
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

# Дополнительные настройки
DEBUG=False
EOF

echo -e "${GREEN}✓ Backend .env создан${NC}"

# Strapi .env
if [ -d "strapi" ]; then
    echo -e "${YELLOW}Создание strapi/.env...${NC}"
    cat > strapi/.env << EOF
# Strapi настройки
HOST=0.0.0.0
PORT=1337

# Ключи безопасности (сгенерированы автоматически)
APP_KEYS=$STRAPI_APP_KEYS
API_TOKEN_SALT=$STRAPI_API_TOKEN_SALT
ADMIN_JWT_SECRET=$STRAPI_ADMIN_JWT_SECRET
TRANSFER_TOKEN_SALT=$STRAPI_TRANSFER_TOKEN_SALT
JWT_SECRET=$STRAPI_JWT_SECRET

# База данных (SQLite)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Для PostgreSQL раскомментируйте:
# DATABASE_CLIENT=postgres
# DATABASE_HOST=127.0.0.1
# DATABASE_PORT=5432
# DATABASE_NAME=strapi_db
# DATABASE_USERNAME=strapi_user
# DATABASE_PASSWORD=strapi_password

# URL для production
URL=http://localhost:1337
# После настройки Nginx измените на:
# URL=https://$CMS_DOMAIN
EOF
    echo -e "${GREEN}✓ Strapi .env создан${NC}"
else
    echo -e "${YELLOW}⚠ Директория strapi не найдена${NC}"
fi

# Frontend .env.production (для справки)
echo -e "${YELLOW}Создание frontend/.env.production.example...${NC}"
cat > ../tkani-new-main/.env.production.example << EOF
# Frontend переменные окружения для production
# Скопируйте этот файл в .env.production и используйте для сборки

# API URL
VITE_API_URL=https://$API_DOMAIN/api/v1
# Или если используете один домен:
# VITE_API_URL=https://$DOMAIN/api/v1

# Strapi URL
VITE_STRAPI_URL=https://$CMS_DOMAIN
# Или если используете один домен:
# VITE_STRAPI_URL=https://$DOMAIN/cms
EOF

echo -e "${GREEN}✓ Frontend .env.production.example создан${NC}"

echo ""
echo -e "${GREEN}=== Готово! ===${NC}"
echo ""
echo -e "${YELLOW}Следующие шаги:${NC}"
echo "1. Проверьте и отредактируйте .env файлы при необходимости"
echo "2. Для Strapi: создайте API Token в админ-панели и добавьте в backend/.env"
echo "3. Для фронтенда: скопируйте .env.production.example в .env.production и соберите проект"
echo ""
echo -e "${GREEN}Важно:${NC}"
echo "- Сохраните эти .env файлы в безопасном месте"
echo "- Не коммитьте .env файлы в git"
echo "- После первого запуска Strapi создайте API Token в админ-панели"


