# Итоговый список плагинов для Strapi v5.31.3

## ✅ Установленные плагины

### 1. Upload Plugin (встроенный)
- **Тип:** Встроенный плагин Strapi v5
- **Статус:** Настроен
- **Функционал:** Локальное хранение файлов, готовность к S3/R2

### 2. Audit Log Plugin (кастомный)
- **Тип:** Кастомный плагин
- **Статус:** Создан
- **Расположение:** `src/plugins/audit-log/`
- **Функционал:** Логирование изменений в продуктах, категориях, заказах, пользователях

### 3. Sentry Integration (middleware)
- **Тип:** Middleware
- **Статус:** Создан
- **Расположение:** `src/middlewares/sentry.js`
- **Функционал:** Автоматическое логирование ошибок в Sentry

### 4. SEO Plugin (кастомный)
- **Тип:** Кастомный плагин
- **Статус:** Создан
- **Расположение:** `src/plugins/seo/`
- **Функционал:** SEO оптимизация для продуктов и категорий

### 5. Orders Manager Plugin (кастомный)
- **Тип:** Кастомный плагин
- **Статус:** Создан и улучшен
- **Расположение:** `src/plugins/orders/`
- **Функционал:** Управление заказами, расчет totals, поиск и фильтры

### 6. Payments Plugin (кастомный)
- **Тип:** Кастомный плагин
- **Статус:** Создан
- **Расположение:** `src/plugins/payments/`
- **Функционал:** Интеграция с YooKassa и CloudPayments

### 7. Email Plugin (Nodemailer)
- **Тип:** Встроенный плагин + провайдер
- **Статус:** Настроен
- **Функционал:** Отправка email через SMTP

---

## 📦 Установленные npm пакеты

```json
{
  "@strapi/provider-email-nodemailer": "^latest",
  "@sentry/node": "^latest",
  "@sentry/react": "^latest",
  "yookassa": "^2.3.0",
  "cloudpayments": "^1.0.0"
}
```

---

## 📝 Созданные плагины

1. **audit-log** - `src/plugins/audit-log/`
2. **seo** - `src/plugins/seo/`
3. **orders** - `src/plugins/orders/`
4. **payments** - `src/plugins/payments/`

---

## ⚙️ Итоговый config/plugins.js

```javascript
module.exports = ({ env }) => ({
  'users-permissions': {
    enabled: true,
    config: {
      jwt: {
        expiresIn: '7d',
      },
    },
  },
  upload: {
    config: {
      providerOptions: {
        localServer: {
          maxage: 300000,
        },
      },
      sizeLimit: 250 * 1024 * 1024,
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64,
      },
    },
  },
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: env.int('SMTP_PORT', 587),
        secure: env.bool('SMTP_SECURE', false),
        auth: {
          user: env('SMTP_EMAIL'),
          pass: env('SMTP_PASS'),
        },
      },
      settings: {
        defaultFrom: env('EMAIL_DEFAULT_FROM', 'noreply@centr-tkani.ru'),
        defaultReplyTo: env('EMAIL_DEFAULT_REPLY_TO', 'support@centr-tkani.ru'),
      },
    },
  },
  'audit-log': {
    enabled: true,
    config: {
      contentTypes: [
        'api::product.product',
        'api::category.category',
        'api::order.order',
        'plugin::users-permissions.user',
      ],
    },
  },
  sentry: {
    enabled: env.bool('SENTRY_ENABLED', false),
    config: {
      dsn: env('SENTRY_DSN'),
      environment: env('NODE_ENV', 'development'),
    },
  },
  seo: {
    enabled: true,
    config: {
      contentTypes: ['api::product.product', 'api::category.category'],
    },
  },
  orders: {
    enabled: true,
    config: {
      statuses: [
        'new',
        'pending_payment',
        'paid',
        'processing',
        'shipped',
        'completed',
        'canceled',
      ],
    },
  },
  payments: {
    enabled: true,
    config: {
      providers: {
        yookassa: {
          shopId: env('YOOKASSA_SHOP_ID'),
          apiKey: env('YOOKASSA_API_KEY'),
        },
        cloudpayments: {
          publicId: env('CLOUDPAYMENTS_PUBLIC_ID'),
          apiKey: env('CLOUDPAYMENTS_API_KEY'),
        },
      },
    },
  },
});
```

---

## 🔧 Итоговый .env.sample

См. файл `.env.sample` в корне проекта.

**Основные переменные:**
- Strapi Configuration (APP_KEYS, JWT_SECRET, etc.)
- Database Configuration
- Upload Plugin (локальное хранение + S3/R2)
- Email Plugin (SMTP настройки)
- Sentry (DSN)
- Payments (YooKassa и CloudPayments ключи)

---

## 📋 Изменения в схемах

### Product (schema.json)
- ✅ Добавлен SEO компонент

### Category (schema.json)
- ✅ Добавлен SEO компонент

### Order (schema.json)
- ✅ Обновлены статусы: `new`, `pending_payment`, `paid`, `processing`, `shipped`, `completed`, `canceled`

---

## 🚀 Готово к использованию

Все плагины установлены, настроены и готовы к использованию. 

**Следующие шаги:**
1. Скопируйте `.env.sample` в `.env` и заполните значениями
2. Запустите `npm run develop`
3. Настройте права доступа в админке
4. Протестируйте плагины

---

## 📚 Документация

Подробная документация по каждому плагину находится в файле `PLUGINS_SETUP.md`.
