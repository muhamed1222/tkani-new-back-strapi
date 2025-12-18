# Интеграция Strapi CMS

Этот документ описывает интеграцию Strapi CMS для управления контентом магазина.

## Обзор

Админ-панель Flask заменена на Strapi CMS. Теперь управление товарами, категориями, брендами и работами осуществляется через Strapi админ-панель, а Flask API работает как прокси к Strapi API.

## Структура

```
├── strapi/                 # Strapi CMS проект
│   ├── config/            # Конфигурация Strapi
│   ├── src/
│   │   └── api/          # Content Types (Product, Category, Brand, Work)
│   └── package.json
├── services/
│   └── strapi_client.py  # Клиент для работы с Strapi API
├── routes/
│   └── admin_strapi.py   # Flask роуты, интегрированные со Strapi
└── migrate_to_strapi.py  # Скрипт миграции данных из Flask БД в Strapi
```

## Установка

### 1. Установка Strapi

```bash
cd strapi
npm install
```

### 2. Настройка переменных окружения

Создайте файл `strapi/.env` на основе `strapi/.env.example`:

```bash
cd strapi
cp .env.example .env
```

Сгенерируйте ключи:

```bash
# Для каждого ключа выполните:
openssl rand -base64 32
```

Заполните в `.env`:
- `APP_KEYS` - массив из 4 ключей
- `ADMIN_JWT_SECRET` - секрет для JWT админа
- `API_TOKEN_SALT` - соль для API токенов
- `TRANSFER_TOKEN_SALT` - соль для transfer токенов

### 3. Запуск Strapi

```bash
cd strapi
npm run develop
```

Strapi будет доступен на http://localhost:1337

При первом запуске создайте администраторский аккаунт.

### 4. Создание API Token в Strapi

1. Откройте http://localhost:1337/admin
2. Перейдите в Settings > API Tokens > Create new API Token
3. Название: "Flask Integration"
4. Token type: "Full access" (или настройте права)
5. Скопируйте токен

### 5. Настройка Flask для работы со Strapi

Добавьте в `.env` (Flask проекта):

```bash
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-api-token-here
```

## Миграция данных

Для миграции существующих данных из Flask БД в Strapi:

```bash
export STRAPI_API_TOKEN="your-api-token"
python3 migrate_to_strapi.py
```

Примечание: Изображения нужно будет загрузить вручную через Strapi админ-панель.

## Использование

### Управление контентом через Strapi

Админ-панель Strapi доступна на http://localhost:1337/admin

Через неё можно:
- Создавать, редактировать и удалять товары
- Управлять категориями и брендами
- Загружать изображения
- Управлять работами (портфолио)

### Flask API

Flask API продолжает работать как обычно. Админ-роуты (`/api/v1/admin/*`) теперь проксируют запросы в Strapi:

- `GET /api/v1/admin/products` - список товаров из Strapi
- `POST /api/v1/admin/products` - создание товара в Strapi
- `PUT /api/v1/admin/products/:id` - обновление товара в Strapi
- `DELETE /api/v1/admin/products/:id` - удаление товара из Strapi

## Конфигурация базы данных

По умолчанию Strapi использует SQLite (`.tmp/data.db`). Для production рекомендуется использовать PostgreSQL.

Настройте в `strapi/config/database.js`:

```javascript
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD', 'strapi'),
    },
  },
});
```

И установите драйвер:

```bash
cd strapi
npm install pg
```

## CORS

CORS настроен в `strapi/config/middlewares.js` для разрешения запросов с Flask (http://localhost:5001) и фронтенда (http://localhost:5173).

## Преимущества

- ✅ Удобная админ-панель с графическим интерфейсом
- ✅ Загрузка и управление медиа-файлами
- ✅ Версионирование контента (draft/publish)
- ✅ Гибкая система прав доступа
- ✅ API-first подход
- ✅ Поддержка локализации
- ✅ Автоматическая документация API

## Структура Content Types

### Product (Товар)
- title (string, required)
- description (text)
- price (decimal, required)
- stock (integer)
- image (media)
- images (media, multiple)
- specifications (json)
- rating (decimal)
- reviews_count (integer)
- category (relation to Category)
- brand (relation to Brand)

### Category (Категория)
- name (string, required, unique)
- products (relation, oneToMany)

### Brand (Бренд)
- name (string, required, unique)
- slug (string, required, unique)
- products (relation, oneToMany)

### Work (Работа)
- title (string, required)
- image (media, required)
- link (string)

## Troubleshooting

### Strapi не запускается

1. Проверьте переменные окружения в `.env`
2. Убедитесь, что порт 1337 свободен
3. Проверьте права доступа к директории

### Ошибки API запросов

1. Проверьте `STRAPI_API_TOKEN` в Flask `.env`
2. Убедитесь, что Strapi запущен
3. Проверьте CORS настройки в Strapi

### Изображения не загружаются

1. Проверьте права на запись в `strapi/public/uploads`
2. Убедитесь, что используете правильный формат FormData при загрузке
3. Проверьте размер файлов (по умолчанию лимит 200MB)

