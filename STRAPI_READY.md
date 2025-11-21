# Strapi готов к работе

## ✅ Что сделано:

1. Установлен Strapi v5.31.0
2. Созданы Content Types:
   - Product (товары)
   - Category (категории)
   - Brand (бренды)
   - Work (работы/портфолио)
3. Настроен `.env` с ключами безопасности
4. Настроен CORS для интеграции с Flask
5. Обновлены скрипты запуска в `package.json`

## 🚀 Strapi запущен!

**Админ-панель:** http://localhost:1337/admin  
**API:** http://localhost:1337/api

### Первый запуск:

1. Откройте в браузере: http://localhost:1337/admin
2. Создайте администраторский аккаунт:
   - Имя
   - Email
   - Пароль (минимум 8 символов)
3. После входа создайте API Token для интеграции с Flask

### Создание API Token:

1. В Strapi админ-панели перейдите: **Settings** ⚙️ > **API Tokens**
2. Нажмите: **Create new API Token**
3. Заполните:
   - **Name**: `Flask Integration`
   - **Token type**: `Full access`
   - **Token duration**: `Unlimited`
4. Нажмите **Save** и **скопируйте токен**

### Обновите Flask .env:

Откройте файл `.env` в корне проекта и замените:
```
STRAPI_API_TOKEN=your-strapi-api-token-here
```
на ваш токен из Strapi.

## 🔗 Интеграция с Flask

Flask админ-роуты (`/api/v1/admin/*`) теперь работают как прокси к Strapi.

Запустите Flask в другом терминале:
```bash
python3 app.py
```

Flask будет доступен на: http://localhost:5001

## 📚 Content Types

### Product (Товар)
- title (Название)
- description (Описание)
- price (Цена)
- stock (Количество)
- image (Изображение)
- specifications (Характеристики)
- rating (Рейтинг)
- reviews_count (Количество отзывов)
- category (Связь с Category)
- brand (Связь с Brand)

### Category (Категория)
- name (Название)
- products (Связь с Products)

### Brand (Бренд)
- name (Название)
- slug (URL-slug)
- products (Связь с Products)

### Work (Работа/Портфолио)
- title (Название)
- image (Изображение)
- link (Ссылка)

## 🛠 Управление Strapi

### Остановка:
```bash
# Найти процесс
lsof -ti:1337

# Остановить
kill $(lsof -ti:1337)
```

### Запуск:
```bash
cd strapi
npm run develop
```

### Просмотр логов:
Логи отображаются в терминале, где запущен Strapi.

## 📖 Полезные ссылки:

- **Strapi документация:** https://docs.strapi.io
- **Content Types Builder:** http://localhost:1337/admin/plugins/content-type-builder
- **Content Manager:** http://localhost:1337/admin/content-manager

## ⚠️ Важно:

1. При первом запуске обязательно создайте администратора
2. Создайте API Token для интеграции с Flask
3. Добавьте токен в `.env` Flask проекта
4. Strapi должен быть запущен для работы Flask админ-роутов
5. Для production используйте PostgreSQL вместо SQLite

## 🎉 Готово!

Проект полностью настроен и готов к работе!

