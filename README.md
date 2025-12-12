# MyShop Backend

Backend API для интернет-магазина тканей. REST API построен на Flask с использованием SQLAlchemy, JWT аутентификации и поддержкой загрузки файлов.

## 📋 Содержание

- [Технологии](#технологии)
- [Установка и настройка](#установка-и-настройка)
- [Структура проекта](#структура-проекта)
- [Запуск проекта](#запуск-проекта)
- [API Endpoints](#api-endpoints)
- [Админ-панель](#админ-панель)
- [База данных](#база-данных)
- [Тестирование](#тестирование)

## 🛠 Технологии

- **Python 3.8+**
- **Flask** - веб-фреймворк
- **SQLAlchemy** - ORM для работы с базой данных
- **Flask-JWT-Extended** - JWT аутентификация
- **Flask-CORS** - поддержка CORS для фронтенда
- **Flask-Migrate** - миграции базы данных
- **Flask-Limiter** - ограничение частоты запросов
- **Flask-Caching** - кэширование (с поддержкой Redis)
- **Marshmallow** - валидация и сериализация данных
- **Flasgger** - Swagger/OpenAPI документация
- **SQLite** - база данных (можно заменить на PostgreSQL/MySQL)

## 📦 Установка и настройка

### 1. Клонирование репозитория

```bash
git clone https://github.com/muhamed1222/tkani-new-back.git
cd tkani-new-back
```

### 2. Создание виртуального окружения

```bash
# Для macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Для Windows
python -m venv venv
venv\Scripts\activate
```

### 3. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 4. Настройка переменных окружения (опционально)

Создайте файл `.env` в корне проекта:

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=sqlite:///app.db
```

## 📁 Структура проекта

```
tkani-new-back/
├── app.py                      # Главный файл приложения
├── config.py                   # Конфигурация приложения
├── models.py                   # Модели базы данных
├── schemas.py                  # Схемы валидации (Marshmallow)
├── errors.py                   # Обработка ошибок
├── migrate.py                  # Flask-Migrate CLI
├── requirements.txt            # Зависимости проекта
├── pytest.ini                  # Конфигурация тестов
├── .gitignore                  # Игнорируемые файлы
├── .flaskenv                   # Переменные окружения Flask
│
├── routes/                     # Маршруты API
│   ├── auth.py                # Аутентификация
│   ├── catalog.py             # Каталог товаров
│   ├── cart.py                # Корзина покупок
│   ├── orders.py              # Заказы
│   ├── admin.py               # Административные функции
│   ├── works.py               # Работы (портфолио)
│   └── utils.py               # Вспомогательные функции
│
├── migrations/                 # Миграции базы данных
│   └── versions/              # Версии миграций
│
├── tests/                      # Тесты
│   ├── conftest.py            # Конфигурация тестов
│   ├── test_auth.py           # Тесты аутентификации
│   ├── test_catalog.py        # Тесты каталога
│   ├── test_cart.py           # Тесты корзины
│   ├── test_orders.py         # Тесты заказов
│   ├── test_admin.py          # Тесты админ-панели
│   └── test_works.py          # Тесты работ
│
├── static/                     # Статические файлы
│   ├── avatars/               # Аватары пользователей
│   ├── products/              # Изображения товаров
│   └── works/                 # Изображения работ
│
└── Скрипты:
    ├── create_admin.py        # Создание администратора
    ├── backup_db.py           # Резервное копирование БД
    └── migrate_to_strapi.py   # Миграция данных в Strapi
```

## 🚀 Запуск проекта

### Режим разработки

```bash
python3 app.py
```

Сервер запустится на `http://localhost:5001` в режиме отладки.

### Инициализация базы данных

```bash
# Создать миграции (если еще не созданы)
flask db init

# Применить миграции
flask db upgrade

# Для добавления тестовых данных используйте Strapi админ-панель
# или скрипт миграции: python3 migrate_to_strapi.py
```

### Создание администратора

```bash
python3 create_admin.py
```

## 🔌 API Endpoints

Все API endpoints имеют префикс `/api/v1`

### 🔐 Аутентификация (`/api/v1/auth`)

- `POST /auth/register` - Регистрация (FormData с аватаром)
- `POST /auth/login` - Вход (JSON: email, password)
- `GET /auth/me` - Получить текущего пользователя
- `PUT /auth/update` - Обновить профиль (FormData)
- `POST /auth/change-password` - Изменить пароль
- `POST /auth/logout` - Выход из системы
- `POST /auth/forgot-password` - Отправить код восстановления
- `POST /auth/verify-code` - Проверить код
- `POST /auth/resend-code` - Повторная отправка кода
- `POST /auth/reset-password` - Сброс пароля

### 📦 Каталог (`/api/v1/catalog`)

- `GET /catalog/products` - Список товаров (с фильтрацией и сортировкой)
- `GET /catalog/products/:id` - Детальная информация о товаре
- `GET /catalog/categories` - Список категорий
- `GET /catalog/brands` - Список брендов

### 🛒 Корзина (`/api/v1/cart`)

- `GET /cart/` - Получить корзину
- `POST /cart/add` - Добавить товар
- `POST /cart/update` - Обновить количество
- `POST /cart/remove` - Удалить товар
- `POST /cart/clear` - Очистить корзину

### 📋 Заказы (`/api/v1/orders`)

- `POST /orders/create` - Создать заказ
- `GET /orders/my` - Мои заказы (с фильтрацией и пагинацией)
- `GET /orders/:id` - Детали заказа
- `PUT /orders/:id/status` - Обновить статус заказа

### 🎨 Работы (`/api/v1/works`)

- `GET /works` - Список работ (с пагинацией)
- `GET /works/:id` - Детали работы

### 👨‍💼 Админ-панель (`/api/v1/admin`)

**Требуется авторизация и роль `admin`**

**Управление контентом через Strapi API (проксируется Flask):**

- `GET /admin/products` - Список всех товаров из Strapi
- `POST /admin/products` - Создать товар в Strapi
- `PUT /admin/products/:id` - Обновить товар в Strapi
- `DELETE /admin/products/:id` - Удалить товар из Strapi

**Примечание:** Управление заказами и пользователями остается в Flask БД и не интегрировано со Strapi. Для управления контентом (товары, категории, бренды, работы) используйте Strapi админ-панель: http://localhost:1337/admin

## 🎛 Админ-панель

### Strapi CMS (Рекомендуется)

Админ-панель теперь использует **Strapi CMS** для управления контентом (товары, категории, бренды, работы).

**Strapi админ-панель:** http://localhost:1337/admin

См. подробную документацию в [STRAPI_INTEGRATION.md](./STRAPI_INTEGRATION.md)

#### Быстрый старт:

1. Установите Strapi:
```bash
cd strapi
npm install
```

2. Настройте `.env` в директории `strapi/` (см. `strapi/.env.example`)

3. Запустите Strapi:
```bash
cd strapi
npm run develop
```

4. Создайте API Token в Strapi: Settings > API Tokens > Create new API Token

5. Добавьте в `.env` Flask проекта:
```bash
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-api-token
```

#### Создание администратора Flask:

```bash
python3 create_admin.py
```

**Примечание:** Админ-роуты Flask (`/api/v1/admin/*`) теперь проксируют запросы в Strapi API. Управление контентом (товары, категории, бренды, работы) полностью осуществляется через Strapi админ-панель.

## 🗄 База данных

### Модели:

- **User** - Пользователи (с ролями user/admin)
- **Product** - Товары
- **Category** - Категории товаров
- **Brand** - Бренды товаров
- **Order** - Заказы
- **OrderItem** - Элементы заказа
- **OrderHistory** - История изменений заказов
- **Work** - Работы (портфолио)
- **PasswordResetCode** - Коды восстановления пароля

### Миграции:

```bash
# Создать новую миграцию
flask db migrate -m "Описание изменений"

# Применить миграции
flask db upgrade

# Откатить миграцию
flask db downgrade
```

## 🧪 Тестирование

```bash
# Запустить все тесты
pytest

# Запустить конкретный тест
pytest tests/test_auth.py

# С покрытием
pytest --cov=.
```

## 📚 Swagger документация

После запуска сервера доступна по адресу:
- `http://localhost:5001/apispec/`

## 🔒 Безопасность

- JWT токены для аутентификации
- Проверка прав администратора для админ-эндпоинтов
- Rate limiting для защиты от DDoS
- Валидация всех входных данных
- Защита от SQL-инъекций (SQLAlchemy ORM)

## 📝 Лицензия

Этот проект создан для личного использования.

## 👤 Автор

**Muhamed**
- GitHub: [@muhamed1222](https://github.com/muhamed1222)
