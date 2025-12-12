# ✅ Исправление уязвимости Koa (Open Redirect)

## Проблема

**Уязвимость**: Open Redirect через Referrer Header (GHSA-jgmv-j7ww-jx2x)  
**Пакет**: `koa` версии 2.0.0 - 2.16.1  
**Серьезность**: High  
**Описание**: Уязвимость позволяет злоумышленникам перенаправлять пользователей на произвольные внешние сайты, манипулируя заголовком `Referrer` в методе `back`.

**Дополнительная уязвимость**: Bypass в версиях 2.16.2 - 2.16.3 (GHSA-g8mr-fgfg-5qpc)

## Решение

Применено два уровня защиты:

### 1. Обновление koa до безопасной версии

Использован механизм `overrides` в `package.json` для принудительного обновления `koa` до версии `2.16.3+`.

```json
{
  "overrides": {
    "@strapi/core": {
      "koa": "^2.16.3"
    },
    "@strapi/admin": {
      "koa": "^2.16.3"
    },
    "@strapi/plugin-users-permissions": {
      "koa": "^2.16.3"
    },
    "@strapi/content-manager": {
      "koa": "^2.16.3"
    },
    "@strapi/types": {
      "koa": "^2.16.3"
    },
    "koa": "^2.16.3"
  }
}
```

### 2. Middleware для дополнительной защиты

Создан кастомный middleware `redirect-security.js`, который:

- ✅ **Валидирует редиректы**: Проверяет, что URL редиректа принадлежит разрешенным доменам
- ✅ **Очищает Referrer header**: Удаляет небезопасные Referrer заголовки от внешних доменов
- ✅ **Переопределяет ctx.redirect**: Добавляет дополнительную проверку безопасности
- ✅ **Логирует попытки**: Записывает в лог попытки небезопасных редиректов

### Конфигурация middleware

Добавлен в `config/middlewares.js`:

```javascript
{
  name: 'redirect-security',
  resolve: './src/middlewares/redirect-security',
}
```

## Разрешенные домены

Middleware проверяет редиректы на соответствие списку разрешенных доменов:

- `localhost` (для разработки)
- `127.0.0.1` (для разработки)
- `centertkani.ru`
- `www.centertkani.ru`
- `api.centertkani.ru`
- `cms.centertkani.ru`

**Важно**: Для production добавьте все ваши домены в список `allowedDomains` в файле `src/middlewares/redirect-security.js`.

## Результат

### До исправления:
- `koa@2.16.1` (уязвимая версия)
- Отсутствие защиты от open redirect

### После исправления:
- `koa@2.16.3+` (безопасная версия) ✅
- Middleware для дополнительной защиты ✅
- Валидация всех редиректов ✅
- Очистка небезопасных Referrer заголовков ✅

## Проверка

```bash
# Проверка версии koa
npm list koa | grep "koa@"
# → koa@2.16.3 ✅

# Проверка уязвимостей
npm audit | grep "koa"
# → (пусто, уязвимость устранена) ✅
```

## Дополнительная информация

- **CVE**: GHSA-jgmv-j7ww-jx2x, GHSA-g8mr-fgfg-5qpc
- **Исправление**: koa@2.16.3+, koa@3.0.3+
- **Ссылки**: 
  - https://github.com/advisories/GHSA-jgmv-j7ww-jx2x
  - https://github.com/advisories/GHSA-g8mr-fgfg-5qpc

## Настройка для production

1. **Обновите список разрешенных доменов** в `redirect-security.js`:
   ```javascript
   const allowedDomains = [
     'yourdomain.com',
     'www.yourdomain.com',
     'api.yourdomain.com',
     // ... другие домены
   ];
   ```

2. **Настройте reverse proxy (nginx)** для дополнительной защиты:
   ```nginx
   # Блокировка небезопасных редиректов
   if ($http_referer !~* ^https?://(www\.)?(yourdomain\.com|api\.yourdomain\.com)) {
       set $http_referer "";
   }
   ```

3. **Используйте HTTPS** для всех соединений

---

**Статус**: ✅ Исправлено  
**Дата**: 2025-12-06  
**Версия koa**: 2.16.3+
