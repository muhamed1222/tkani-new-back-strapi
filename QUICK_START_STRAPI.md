# Быстрый старт: Интеграция Strapi

## Шаг 1: Установка Strapi

```bash
cd strapi
npm install
```

## Шаг 2: Настройка переменных окружения

Создайте файл `strapi/.env`:

```bash
cd strapi
cp .env.example .env
```

Сгенерируйте ключи (для каждого выполните `openssl rand -base64 32`):

```bash
# APP_KEYS - нужен массив из 4 ключей через запятую
APP_KEYS=key1,key2,key3,key4
ADMIN_JWT_SECRET=your-admin-jwt-secret
API_TOKEN_SALT=your-api-token-salt
TRANSFER_TOKEN_SALT=your-transfer-token-salt
```

## Шаг 3: Запуск Strapi

```bash
cd strapi
npm run develop
```

При первом запуске создайте администраторский аккаунт.

Strapi будет доступен на: http://localhost:1337

## Шаг 4: Создание API Token в Strapi

1. Откройте http://localhost:1337/admin
2. Перейдите: Settings > API Tokens > Create new API Token
3. Настройки:
   - Name: "Flask Integration"
   - Token type: "Full access"
4. Скопируйте токен

## Шаг 5: Настройка Flask

Добавьте в `.env` вашего Flask проекта (в корне проекта):

```bash
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=ваш-токен-из-шага-4
```

## Шаг 6: Миграция данных (опционально)

Если у вас есть существующие данные в Flask БД:

```bash
export STRAPI_API_TOKEN="ваш-токен"
python3 migrate_to_strapi.py
```

**Важно:** Изображения нужно будет загрузить вручную через Strapi админ-панель.

## Готово! 🎉

Теперь вы можете:
- Управлять товарами через Strapi: http://localhost:1337/admin
- Использовать Flask API как обычно - он проксирует запросы в Strapi
- Все админ-роуты (`/api/v1/admin/*`) работают со Strapi

## Дополнительная информация

См. [STRAPI_INTEGRATION.md](./STRAPI_INTEGRATION.md) для подробной документации.

