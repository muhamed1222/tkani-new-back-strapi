# Быстрая настройка проекта

## ✅ Что уже сделано:

1. ✅ Strapi установлен и настроен
2. ✅ Создан `strapi/.env` с ключами
3. ✅ Создан `.env` для Flask проекта
4. ✅ Content Types созданы (Product, Category, Brand, Work)

## 🚀 Запуск проекта:

### 1. Запустите Strapi:

```bash
cd strapi
npm run develop
```

При первом запуске:
- Откроется браузер на http://localhost:1337/admin
- Создайте администраторский аккаунт
- Заполните форму регистрации

### 2. Создайте API Token в Strapi:

1. Войдите в админ-панель: http://localhost:1337/admin
2. Перейдите: Settings (⚙️) > API Tokens
3. Нажмите: "Create new API Token"
4. Настройки:
   - **Name**: `Flask Integration`
   - **Token type**: `Full access`
   - **Token duration**: `Unlimited`
5. Нажмите: "Save" и скопируйте токен

### 3. Обновите Flask .env:

Откройте `.env` в корне проекта и замените:
```bash
STRAPI_API_TOKEN=your-strapi-api-token-here
```
на:
```bash
STRAPI_API_TOKEN=ваш-токен-из-шага-2
```

### 4. Запустите Flask:

```bash
# В другом терминале (оставьте Strapi работать)
python3 app.py
```

Flask будет доступен на: http://localhost:5001

## 📚 Полезные команды:

### Strapi:
- `cd strapi && npm run develop` - запуск в режиме разработки
- `cd strapi && npm run build` - сборка для production
- `cd strapi && npm start` - запуск production версии

### Flask:
- `python3 app.py` - запуск Flask сервера
- `python3 migrate_to_strapi.py` - миграция данных из Flask БД в Strapi

## 🔗 Полезные ссылки:

- **Strapi админ-панель**: http://localhost:1337/admin
- **Flask API**: http://localhost:5001/api/v1
- **Swagger документация**: http://localhost:5001/apispec/

## ⚠️ Важно:

1. Strapi должен быть запущен перед использованием Flask админ-роутов
2. Для управления контентом используйте Strapi админ-панель
3. Flask API работает как прокси к Strapi для админ-роутов
