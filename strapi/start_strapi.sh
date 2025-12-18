#!/bin/bash
# Скрипт для запуска Strapi
echo "🚀 Запуск Strapi..."
cd "$(dirname "$0")/strapi" || exit 1
npm run develop
