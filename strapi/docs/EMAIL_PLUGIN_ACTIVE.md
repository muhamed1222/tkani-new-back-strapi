# ✅ Email плагин подключен и активен

## Статус подключения

### ✅ Установлено:
- `@strapi/provider-email-nodemailer@5.31.3` - провайдер для Nodemailer
- `nodemailer@7.0.10` - библиотека для отправки email

### ✅ Настроено в `config/plugins.js`:
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

### ✅ Настройки из `.env`:
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_EMAIL=centertkani-shop@yandex.ru
SMTP_PASS=ifjvlxwfkmzsfnnk
EMAIL_DEFAULT_FROM=centertkani-shop@yandex.ru
EMAIL_DEFAULT_REPLY_TO=centertkani-shop@yandex.ru
```

## Как проверить работу

### 1. Перезапустите Strapi (если еще не запущен):
```bash
npm run develop
```

### 2. Откройте админ-панель:
1. Перейдите на http://localhost:1337/admin
2. Войдите в систему
3. Перейдите в **Settings** → **Email** (в левом меню)

### 3. Отправьте тестовый email:
1. В разделе **Email** найдите форму "Send test email"
2. Введите email адрес для теста (например, свой личный email)
3. Нажмите кнопку **Send test email**
4. Проверьте почтовый ящик - должно прийти тестовое письмо

## Использование в коде

### Пример отправки email:
```javascript
const emailService = strapi.plugin('email').service('email');

await emailService.send({
  to: 'recipient@example.com',
  subject: 'Тема письма',
  text: 'Текст письма',
  html: '<p>HTML версия письма</p>',
});
```

### Готовые функции для заказов:
В файле `src/services/email.js` уже есть готовые функции:

```javascript
// Отправка уведомления о создании заказа
await strapi.service('api::order.email').sendOrderCreated(order);

// Отправка уведомления об оплате заказа
await strapi.service('api::order.email').sendOrderPaid(order);

// Отправка уведомления об отправке заказа
await strapi.service('api::order.email').sendOrderShipped(order);
```

## Настройки для Yandex Mail

Ваши настройки корректны для Yandex Mail:
- ✅ **SMTP_HOST**: `smtp.yandex.ru`
- ✅ **SMTP_PORT**: `465` (SSL)
- ✅ **SMTP_SECURE**: `true` (обязательно для порта 465)
- ✅ **SMTP_EMAIL**: `centertkani-shop@yandex.ru`
- ✅ **SMTP_PASS**: пароль приложения

## Важно

1. **Пароль приложения**: Убедитесь, что `SMTP_PASS` содержит пароль приложения, а не основной пароль аккаунта Yandex
2. **Перезапуск**: После изменения настроек в `.env` нужно перезапустить Strapi
3. **Проверка**: Всегда тестируйте отправку email через админ-панель перед использованием в продакшене

## Статус

✅ **Email плагин полностью подключен и готов к использованию!**

Плагин автоматически загружается при запуске Strapi и использует настройки из `.env`.
