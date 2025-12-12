# 🛠 Технологический стек проекта

## 📱 Frontend (tkani-new-main)

### Основные технологии:
- **React 19.1.1** - UI библиотека
- **React Router DOM 7.9.5** - маршрутизация
- **Vite 7.1.7** - сборщик и dev-сервер

### State Management:
- **MobX 6.15.0** - управление состоянием
- **mobx-react-lite 4.1.1** - интеграция MobX с React

### UI библиотеки:
- **Bootstrap 5.3.8** - CSS фреймворк
- **Tailwind CSS 3.4.17** - utility-first CSS
- **Radix UI Themes 3.2.1** - компоненты UI
- **PostCSS 8.5.6** - обработка CSS
- **Autoprefixer 10.4.21** - автопрефиксы для CSS

### Дополнительные библиотеки:
- **react-phone-input-2 2.15.1** - ввод телефона

### Инструменты разработки:
- **ESLint 9.36.0** - линтер
- **TypeScript типы** - для React компонентов

---

## 🔧 Backend API (tkani-new-back-strapi)

### Основной фреймворк:
- **Python 3** - язык программирования
- **Flask 3.0.0** - веб-фреймворк

### База данных:
- **SQLAlchemy 3.1.1** (Flask-SQLAlchemy) - ORM
- **Flask-Migrate 4.0.5** - миграции БД
- **SQLite** (dev) / **PostgreSQL** (production)

### Аутентификация и безопасность:
- **Flask-JWT-Extended 4.6.0** - JWT токены
- **Werkzeug 3.0.1** - безопасность (хеширование паролей)

### API и валидация:
- **Marshmallow 3.20.1** - сериализация/валидация
- **flask-marshmallow 0.15.0** - интеграция с Flask
- **marshmallow-sqlalchemy 0.29.0** - интеграция с SQLAlchemy
- **Flasgger 0.9.7.1** - Swagger/OpenAPI документация

### Дополнительные возможности:
- **Flask-CORS 4.0.0** - CORS поддержка
- **Flask-Limiter 3.5.0** - rate limiting
- **Flask-Caching 2.1.0** - кэширование
- **Redis 5.0.1** - кэш/хранилище (опционально)

### Работа с файлами:
- **Pillow 10.1.0** - обработка изображений

### Тестирование:
- **pytest 7.4.3** - тестирование
- **pytest-flask 1.3.0** - тесты для Flask
- **pytest-cov 4.1.0** - покрытие кода

### Утилиты:
- **python-dotenv 1.0.0** - переменные окружения
- **requests 2.31.0** - HTTP запросы

---

## 📝 CMS (Strapi)

### Основные технологии:
- **Strapi 5.31.0** - headless CMS
- **Node.js >= 20.0.0** - runtime
- **React 18.3.1** - админ-панель

### База данных:
- **better-sqlite3 12.4.1** - SQLite драйвер

### Дополнительные плагины:
- **@strapi/plugin-users-permissions 5.31.0** - управление пользователями
- **strapi-google-translator 1.0.0** - переводы

### UI админ-панели:
- **React Router DOM 6.30.2** - маршрутизация
- **styled-components 6.1.19** - стилизация

### Утилиты:
- **nodemailer 7.0.10** - отправка email

---

## 🗄 База данных

### Development:
- **SQLite** - для разработки

### Production:
- **PostgreSQL** - рекомендуется для production

---

## 🚀 Деплой и инфраструктура

### Веб-сервер:
- **Nginx** - reverse proxy и статика

### WSGI сервер:
- **Gunicorn** - для запуска Flask в production

### Systemd:
- Сервисы для автоматического запуска

### SSL:
- **Let's Encrypt** (Certbot) - бесплатные SSL сертификаты

---

## 📦 Структура проекта

```
tkani-new-main/          # Frontend (React)
├── src/
│   ├── components/     # React компоненты
│   ├── pages/          # Страницы
│   ├── store/          # MobX stores
│   ├── http/           # API клиент
│   └── utils/          # Утилиты
└── package.json

tkani-new-back-strapi/   # Backend
├── app.py              # Flask приложение
├── models.py           # SQLAlchemy модели
├── routes/             # API роуты
├── services/           # Бизнес-логика
├── strapi/             # Strapi CMS
│   ├── src/
│   └── package.json
└── requirements.txt
```

---

## 🔌 Интеграции

- **ЮMoney** - платежная система
- **СДЭК** - доставка
- **Strapi CMS** - управление контентом

---

## 📋 Версии

- **React:** 19.1.1
- **Flask:** 3.0.0
- **Strapi:** 5.31.0
- **Node.js:** >= 20.0.0
- **Python:** 3.x

