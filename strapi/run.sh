#!/bin/bash
# Скрипт для запуска Strapi из директории strapi

cd "$(dirname "$0")" || exit 1

# Проверяем наличие node_modules
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules не найден. Установите зависимости:"
    echo "   npm install"
    exit 1
fi

# Ищем strapi binary
if [ -f "node_modules/.bin/strapi" ]; then
    ./node_modules/.bin/strapi develop
elif [ -f "node_modules/@strapi/strapi/bin/strapi.js" ]; then
    node node_modules/@strapi/strapi/bin/strapi.js develop
elif [ -f "node_modules/@strapi/strapi/dist/cli.js" ]; then
    node node_modules/@strapi/strapi/dist/cli.js develop
else
    echo "❌ Не могу найти Strapi binary"
    echo "Попробуйте переустановить зависимости:"
    echo "   cd strapi"
    echo "   rm -rf node_modules package-lock.json"
    echo "   npm install"
    exit 1
fi

