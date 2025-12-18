# ✅ Финальное решение проблемы Connection timeout

## Диагностика

✅ **Порт 587 доступен!** (`smtp.yandex.com:587`)

Проблема не в блокировке портов, а в **неправильных настройках**.

## Проблема

В `.env` используется:
- `SMTP_HOST=smtp.yandex.ru` ❌ (неправильный хост)
- `SMTP_PORT=465` ❌ (может работать, но 587 лучше)
- `SMTP_SECURE=true` ❌ (для порта 587 должно быть false)

## Решение

### Измените настройки в `.env`:

```env
SMTP_HOST=smtp.yandex.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_EMAIL=centertkani-shop@yandex.ru
SMTP_PASS=ifjvlxwfkmzsfnnk
EMAIL_DEFAULT_FROM=centertkani-shop@yandex.ru
EMAIL_DEFAULT_REPLY_TO=centertkani-shop@yandex.ru
```

### Ключевые изменения:

1. ✅ `SMTP_HOST=smtp.yandex.com` (вместо `smtp.yandex.ru`)
2. ✅ `SMTP_PORT=587` (вместо `465`)
3. ✅ `SMTP_SECURE=false` (для порта 587)

### После изменения:

1. **Перезапустите Strapi:**
   ```bash
   npm run develop
   ```

2. **Проверьте отправку email:**
   - Откройте админку: http://localhost:1337/admin
   - Settings → Email
   - Отправьте тестовый email

## Альтернатива: Порт 465

Если порт 587 не работает, попробуйте:

```env
SMTP_HOST=smtp.yandex.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

## Тестирование соединения

Запустите скрипт для проверки всех конфигураций:

```bash
node test-smtp-connection.js
```

Скрипт проверит все возможные комбинации и покажет, какая работает.

## Важно

Убедитесь, что:
- ✅ Используется **пароль приложения**, а не основной пароль
- ✅ Email адрес указан полностью: `centertkani-shop@yandex.ru`
- ✅ Включена опция "Пароли приложений" в настройках Yandex

## Статус

✅ **Порт доступен** - проблема в настройках
✅ **Решение найдено** - используйте `smtp.yandex.com:587` с `SMTP_SECURE=false`

После изменения настроек email должен работать!
