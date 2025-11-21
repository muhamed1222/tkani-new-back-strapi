# Быстрый запуск Strapi

## Вы находитесь в директории: `strapi/`

### Шаг 1: Проверьте .env файл

```bash
ls -la .env
```

Если файл не найден, создайте его:

```bash
cat > .env << 'EOF'
# App Keys
APP_KEYS=key1,key2,key3,key4

# Admin JWT Secret
ADMIN_JWT_SECRET=admin-secret-key

# API Token Salt
API_TOKEN_SALT=api-token-salt

# Transfer Token Salt
TRANSFER_TOKEN_SALT=transfer-token-salt

# Database (SQLite для разработки)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Server
HOST=0.0.0.0
PORT=1337

# CORS
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:5001,http://localhost:5173
EOF
```

### Шаг 2: Установите зависимости

```bash
npm install
```

### Шаг 3: Запустите Strapi

```bash
npm run develop
```

Или напрямую:

```bash
node node_modules/@strapi/strapi/dist/cli.js develop
```

### Шаг 4: Проверьте запуск

Должно появиться сообщение:
```
Building the admin panel...
Server started on port 1337
```

Откройте браузер: **http://localhost:1337/admin**

## Если возникли ошибки:

### Ошибка "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
npm run develop
```

### Ошибка "EADDRINUSE" (порт занят)

```bash
lsof -ti:1337 | xargs kill -9
npm run develop
```

### Проверка логов

Если Strapi сразу завершается, запустите с выводом:

```bash
NODE_ENV=development node node_modules/@strapi/strapi/dist/cli.js develop
```

### Проверка установки

```bash
# Проверьте версию Node.js (требуется >=20.0.0)
node -v

# Проверьте наличие Strapi
npm list @strapi/strapi

# Проверьте структуру
ls -la node_modules/@strapi/strapi/dist/cli.js
```

## Если все работает:

После запуска откройте: **http://localhost:1337/admin**

Создайте администратора и начните работу!

