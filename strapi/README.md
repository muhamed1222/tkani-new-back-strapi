# Strapi CMS для управления магазином

Этот Strapi проект используется для управления контентом магазина (товары, категории, бренды, работы).

## Установка

```bash
npm install
```

## Настройка

1. Скопируйте `.env.example` в `.env`
2. Сгенерируйте ключи:
```bash
openssl rand -base64 32  # для APP_KEYS, ADMIN_JWT_SECRET, API_TOKEN_SALT, TRANSFER_TOKEN_SALT
```

3. Настройте подключение к базе данных в `config/database.js`

## Запуск

### Режим разработки
```bash
npm run develop
```

### Production
```bash
npm run build
npm start
```

Админ-панель будет доступна на http://localhost:1337/admin

