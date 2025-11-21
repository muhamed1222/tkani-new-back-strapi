# Запуск Strapi

## Исправление проблемы "Missing script: develop"

Если вы получаете ошибку `npm error Missing script: "develop"`, выполните следующие шаги:

1. **Убедитесь, что вы находитесь в директории strapi:**
   ```bash
   cd strapi
   ```

2. **Проверьте, что package.json содержит скрипты:**
   ```bash
   cat package.json | grep -A 5 '"scripts"'
   ```

3. **Если скрипты отсутствуют, обновите package.json:**
   Скрипты должны быть:
   ```json
   "scripts": {
     "build": "npx strapi build",
     "develop": "npx strapi develop",
     "start": "npx strapi start",
     "strapi": "npx strapi"
   }
   ```

4. **Переустановите зависимости (если нужно):**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Запустите Strapi:**
   ```bash
   npm run develop
   ```

## Альтернативный способ запуска

Если `npm run develop` не работает, попробуйте напрямую:

```bash
npx strapi develop
```

Или:

```bash
node node_modules/@strapi/strapi/dist/cli.js develop
```

## Проверка установки

Проверьте, что Strapi установлен правильно:

```bash
cd strapi
npm list @strapi/strapi
```

Должно показать версию 5.31.0.

## Если ничего не помогает

1. Удалите директорию `strapi/node_modules`
2. Удалите `strapi/package-lock.json`
3. Выполните `npm install` заново
4. Попробуйте запустить `npm run develop`

