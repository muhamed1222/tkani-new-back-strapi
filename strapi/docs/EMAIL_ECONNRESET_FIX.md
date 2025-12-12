# Исправление ошибки ECONNRESET при отправке email

## Проблема
Ошибка `ECONNRESET` при попытке отправить тестовый email через Yandex Mail SMTP.

## Причины
1. Неправильная конфигурация TLS/SSL для порта 465
2. Таймауты соединения
3. Проблемы с сертификатами
4. Неправильный SMTP хост

## Исправления

### 1. Обновлена конфигурация в `config/plugins.js`

Добавлены дополнительные настройки для стабильного соединения:

```javascript
email: {
  config: {
    provider: 'nodemailer',
    providerOptions: {
      host: env('SMTP_HOST', 'smtp.gmail.com'),
      port: env.int('SMTP_PORT', 587),
      secure: env.bool('SMTP_SECURE', false),
      auth: env('SMTP_EMAIL') && env('SMTP_PASS') ? {
        user: env('SMTP_EMAIL'),
        pass: env('SMTP_PASS'),
      } : undefined,
      // Дополнительные настройки для Yandex Mail
      tls: {
        rejectUnauthorized: env.bool('SMTP_TLS_REJECT_UNAUTHORIZED', true),
      },
      // Настройки для стабильного соединения
      connectionTimeout: 10000, // 10 секунд
      greetingTimeout: 10000,
      socketTimeout: 10000,
    },
    settings: {
      defaultFrom: env('EMAIL_DEFAULT_FROM', 'noreply@centr-tkani.ru'),
      defaultReplyTo: env('EMAIL_DEFAULT_REPLY_TO', 'support@centr-tkani.ru'),
    },
  },
},
```

### 2. Альтернативные настройки для Yandex Mail

Если проблема сохраняется, попробуйте использовать порт 587 с STARTTLS вместо 465:

**Вариант 1: Порт 465 (SSL)**
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
```

**Вариант 2: Порт 587 (STARTTLS) - РЕКОМЕНДУЕТСЯ**
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_SECURE=false
```

### 3. Проверка настроек Yandex Mail

Убедитесь, что:
1. ✅ Используется **пароль приложения**, а не основной пароль
2. ✅ Включена опция "Пароли приложений" в настройках безопасности Yandex
3. ✅ Email адрес указан полностью: `centertkani-shop@yandex.ru`

### 4. Как получить пароль приложения для Yandex:

1. Перейдите в [Настройки безопасности Yandex](https://id.yandex.ru/security)
2. Включите "Пароли приложений"
3. Создайте новый пароль для "Почта"
4. Используйте этот пароль в `SMTP_PASS` в `.env`

## Решение проблемы

### Шаг 1: Попробуйте порт 587

Измените в `.env`:
```env
SMTP_PORT=587
SMTP_SECURE=false
```

### Шаг 2: Перезапустите Strapi

```bash
npm run develop
```

### Шаг 3: Проверьте отправку email

1. Откройте админку: http://localhost:1337/admin
2. Settings → Email
3. Отправьте тестовый email

### Шаг 4: Если не помогло

Попробуйте альтернативный хост:
```env
SMTP_HOST=smtp.yandex.com
```

Или добавьте в `.env`:
```env
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

## Дополнительная диагностика

Если проблема сохраняется, проверьте:

1. **Файрвол**: Убедитесь, что порты 465 или 587 не заблокированы
2. **Сеть**: Проверьте интернет-соединение
3. **Логи**: Включите debug режим в Nodemailer (если нужно)

## Статус

✅ **Конфигурация обновлена с дополнительными настройками для стабильного соединения**

Попробуйте использовать порт 587 с `SMTP_SECURE=false` - это часто решает проблему с Yandex Mail.
