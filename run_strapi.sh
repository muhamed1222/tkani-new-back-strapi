#!/bin/bash
# Скрипт для установки зависимостей и запуска Strapi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRAPI_DIR="$SCRIPT_DIR/strapi"

echo "🚀 Запуск Strapi..."
echo "📂 Директория: $STRAPI_DIR"

cd "$STRAPI_DIR" || exit 1

echo "📦 Устанавливаю недостающие зависимости..."
npm install esbuild 2>&1 | tail -5

echo ""
echo "🚀 Запускаю Strapi..."
npm run develop

