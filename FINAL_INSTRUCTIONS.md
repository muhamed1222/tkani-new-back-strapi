# Финальные инструкции по запуску Strapi

## ✅ Что сделано:

1. ✅ Strapi v5.31.0 установлен в директории `strapi/`
2. ✅ Созданы Content Types (Product, Category, Brand, Work)
3. ✅ Настроен `.env` с ключами безопасности
4. ✅ Настроен CORS для Flask (порт 5001) и фронтенда (порт 5173)
5. ✅ Обновлены Flask админ-роуты для проксирования запросов в Strapi
6. ✅ Создан скрипт миграции данных `migrate_to_strapi.py`
7. ✅ Удалены старые админ-роуты Flask
8. ✅ Обновлена документация

## 🚀 ЗАПУСК STRAPI:

### Вариант 1: Из терминала (рекомендуется)

```bash
cd strapi
npm run develop
```

**Это откроет Strapi в текущем терминале с выводом логов.**

### Вариант 2: В фоновом режиме

```bash
cd strapi
npm run develop > strapi.log 2>&1 &
```

Просмотр логов:
```bash
tail -f strapi.log
```

## 📋 ПЕРВЫЙ ЗАПУСК:

1. Запустите команду выше
2. Дождитесь сообщения: `Server started on port 1337`
3. Откройте браузер: **http://localhost:1337/admin**
4. Создайте администраторский аккаунт:
   - **Имя**: Ваше имя
   - **Email**: Ваш email
   - **Пароль**: Минимум 8 символов

## 🔑 СОЗДАНИЕ API TOKEN:

После входа в Strapi:

1. Перейдите: **Settings** ⚙️ > **API Tokens**
2. Нажмите: **Create new API Token**
3. Заполните:
   - **Name**: `Flask Integration`
   - **Token type**: `Full access`
   - **Token duration**: `Unlimited`
4. Нажмите **Save**
5. **СКОПИРУЙТЕ ТОКЕН** (он будет показан только один раз!)

## 🔗 ИНТЕГРАЦИЯ С FLASK:

Откройте файл `.env` в корне проекта и замените:

```env
STRAPI_API_TOKEN=your-strapi-api-token-here
```

на ваш токен из Strapi:

```env
STRAPI_API_TOKEN=здесь_ваш_настоящий_токен
```

## 🐍 ЗАПУСК FLASK:

В **новом терминале** (оставьте Strapi работать):

```bash
# Активируйте виртуальное окружение (если используете)
source .venv/bin/activate  # или .venv\\Scripts\\activate на Windows

# Запустите Flask
python3 app.py
```

Flask будет доступен на: **http://localhost:5001**

## 📡 API ENDPOINTS:

### Strapi:
- Админ-панель: http://localhost:1337/admin
- API: http://localhost:1337/api

### Flask:
- API: http://localhost:5001/api/v1
- Swagger документация: http://localhost:5001/apispec/
- Админ (прокси к Strapi): http://localhost:5001/api/v1/admin/*

## 📊 МИГРАЦИЯ ДАННЫХ:

Если у вас есть существующие данные в Flask БД:

```bash
python3 migrate_to_strapi.py
```

Этот скрипт перенесёт:
- Категории
- Бренды
- Товары
- Работы

## 🛠 УПРАВЛЕНИЕ:

### Проверка статуса Strapi:
```bash
lsof -ti:1337 && echo "Strapi работает" || echo "Strapi не запущен"
```

### Остановка Strapi:
```bash
# Если запущен в фоне
kill $(lsof -ti:1337)

# Если в терминале - нажмите Ctrl+C
```

### Остановка Flask:
```bash
# Найти и остановить
lsof -ti:5001 | xargs kill -9

# Или Ctrl+C в терминале
```

## ❗ ПРОБЛЕМЫ И РЕШЕНИЯ:

### "npm run develop" не работает:
```bash
cd strapi
npm install
npm run develop
```

### Порт 1337 занят:
```bash
# Найти процесс
lsof -ti:1337

# Остановить
kill $(lsof -ti:1337)
```

### Ошибка "Cannot find module":
```bash
cd strapi
rm -rf node_modules package-lock.json
npm install
npm run develop
```

### Strapi не открывается в браузере:
Подождите 30-60 секунд после запуска, затем откройте:
http://localhost:1337/admin

## 📚 ДОКУМЕНТАЦИЯ:

- **Strapi документация**: https://docs.strapi.io
- **Content Types Builder**: http://localhost:1337/admin/plugins/content-type-builder
- **Content Manager**: http://localhost:1337/admin/content-manager

## ✨ ГОТОВО!

Теперь у вас:
- ✅ Современная CMS для управления контентом
- ✅ Flask API интегрирован со Strapi
- ✅ Гибкая система управления данными
- ✅ API документация через Swagger

**Следующий шаг:** Запустите Strapi и создайте администратора!

```bash
cd strapi
npm run develop
```

