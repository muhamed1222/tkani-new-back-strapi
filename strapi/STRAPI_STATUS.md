# Статус Strapi

## Запуск Strapi

Если Strapi не запущен автоматически, выполните:

```bash
cd strapi
npm run develop
```

Или используйте прямой путь к CLI:

```bash
cd strapi
node node_modules/@strapi/strapi/dist/cli.js develop
```

## Проверка статуса

```bash
# Проверить, запущен ли Strapi
lsof -ti:1337 && echo "Strapi работает" || echo "Strapi не запущен"

# Проверить процесс
ps aux | grep strapi | grep -v grep
```

## Остановка Strapi

```bash
# Найти и остановить процесс
lsof -ti:1337 | xargs kill -9

# ИЛИ
pkill -f strapi
```

## Просмотр логов

```bash
# Если запущен через скрипт
tail -f /tmp/strapi-last.log

# ИЛИ запустите в обычном режиме (не в фоне) для просмотра логов в реальном времени
cd strapi
npm run develop
```

## Если проблемы

1. Проверьте, что все зависимости установлены:
   ```bash
   cd strapi
   npm install
   ```

2. Проверьте файл `.env` в директории `strapi/`

3. Проверьте, что порт 1337 свободен:
   ```bash
   lsof -ti:1337
   ```
