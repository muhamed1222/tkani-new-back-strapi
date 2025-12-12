# Подключение Email плагина в Strapi v5

## Текущая конфигурация

### ✅ Установленные пакеты:
- `@strapi/provider-email-nodemailer@5.31.3` - провайдер для Nodemailer
- `nodemailer@7.0.10` - библиотека для отправки email

### ✅ Конфигурация в `config/plugins.js`:
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
    },
    settings: {
      defaultFrom: env('EMAIL_DEFAULT_FROM', 'noreply@centr-tkani.ru'),
      defaultReplyTo: env('EMAIL_DEFAULT_REPLY_TO', 'support@centr-tkani.ru'),
    },
  },
},
```

### ✅ Настройки в `.env`:
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_EMAIL=centertkani-shop@yandex.ru
SMTP_PASS=ifjvlxwfkmzsfnnk
EMAIL_DEFAULT_FROM=centertkani-shop@yandex.ru
EMAIL_DEFAULT_REPLY_TO=centertkani-shop@yandex.ru
```

## Проверка подключения

### 1. Перезапустите Strapi:
```bash
npm run develop
```

### 2. Проверьте в админ-панели:
1. Откройте http://localhost:1337/admin
2. Перейдите в **Settings** → **Email**
3. Должна быть доступна форма для отправки тестового email

### 3. Отправьте тестовый email:
1. В разделе **Settings** → **Email**
2. Введите email адрес для теста
3. Нажмите **Send test email**
4. Проверьте, что email получен

## Использование в коде

### Отправка email через сервис:
```javascript
const emailService = strapi.plugin('email').service('email');

await emailService.send({
  to: 'recipient@example.com',
  subject: 'Test Email',
  text: 'This is a test email',
  html: '<p>This is a test email</p>',
});
```

### Использование email service для заказов:
```javascript
// В src/services/email.js уже есть готовые функции:
await strapi.service('api::order.email').sendOrderCreated(order);
await strapi.service('api::order.email').sendOrderPaid(order);
await strapi.service('api::order.email').sendOrderShipped(order);
```

## Настройки для Yandex Mail

Текущие настройки корректны для Yandex Mail:
- **SMTP_HOST**: `smtp.yandex.ru` ✅
- **SMTP_PORT**: `465` ✅ (SSL)
- **SMTP_SECURE**: `true` ✅ (для порта 465)
- **SMTP_EMAIL**: ваш email на Yandex
- **SMTP_PASS**: пароль приложения (не основной пароль!)

### Как получить пароль приложения для Yandex:
1. Перейдите в [Настройки безопасности Yandex](https://id.yandex.ru/security)
2. Включите "Пароли приложений"
3. Создайте новый пароль для "Почта"
4. Используйте этот пароль в `SMTP_PASS`

## Возможные проблемы

### Ошибка: "Missing credentials"
- **Решение**: Убедитесь, что `SMTP_EMAIL` и `SMTP_PASS` установлены в `.env`

### Ошибка: "Connection timeout"
- **Решение**: Проверьте, что порт 465 не заблокирован файрволом

### Ошибка: "Authentication failed"
- **Решение**: Используйте пароль приложения, а не основной пароль аккаунта

## Статус

✅ **Email плагин подключен и настроен!**

Плагин готов к использованию. Все настройки корректны для работы с Yandex Mail.
