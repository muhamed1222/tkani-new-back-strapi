# Исправление проблемы "Cannot find module strapi"

## Проблема:
```
Error: Cannot find module '/Users/.../strapi/node_modules/.bin/strapi'
```

## Решение:

### Вариант 1: Использовать скрипт запуска
```bash
cd strapi
./run.sh
```

### Вариант 2: Переустановить зависимости
```bash
cd strapi
rm -rf node_modules package-lock.json
npm install
npm run develop
```

### Вариант 3: Использовать npx (если установлен глобально)
```bash
cd strapi
npx @strapi/strapi develop
```

### Вариант 4: Использовать прямую команду Node.js
```bash
cd strapi

# Попробуйте один из вариантов:
node node_modules/@strapi/strapi/bin/strapi.js develop

# ИЛИ
node node_modules/@strapi/strapi/dist/cli.js develop
```

## Проверка установки:

```bash
cd strapi

# Проверьте, что @strapi/strapi установлен
npm list @strapi/strapi

# Проверьте наличие binary
ls -la node_modules/.bin/strapi
ls -la node_modules/@strapi/strapi/bin/
```

## Если ничего не помогает:

Создайте проект Strapi заново в новой директории, затем скопируйте:
- `config/` - конфигурация
- `src/api/` - Content Types
- `.env` - переменные окружения

```bash
npx create-strapi-app@latest strapi-new --quickstart
```

