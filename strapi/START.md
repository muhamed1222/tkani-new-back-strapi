# Быстрый запуск

## Запуск Strapi:

```bash
cd strapi
npm run develop
```

**ВАЖНО**: Команда `npm run develop` должна выполняться из директории `strapi/`, а не из корня проекта!

## Запуск Flask:

```bash
# Из корня проекта (не из strapi/)
python3 app.py
```

Если порт 5001 занят:
```bash
# Найти процесс на порту 5001
lsof -ti:5001 | xargs kill -9

# Или запустить на другом порту
PORT=5002 python3 app.py
```
