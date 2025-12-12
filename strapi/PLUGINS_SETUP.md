# Настройка плагинов для Strapi v5.31.3

## Обзор установленных плагинов

### 1. ✅ Upload Plugin (встроенный Strapi v5)
**Статус:** Настроен  
**Расположение:** Встроенный плагин Strapi  
**Конфигурация:** `config/plugins.js`

- Локальное хранение файлов (по умолчанию)
- Поддержка breakpoints для изображений
- Готовность к переходу на S3/R2 (конфигурация закомментирована)

**Переменные окружения:**
- Для S3/R2 (когда понадобится):
  - `AWS_ACCESS_KEY_ID`
  - `AWS_ACCESS_SECRET`
  - `AWS_REGION`
  - `AWS_BUCKET`

---

### 2. ✅ Audit Log Plugin (кастомный)
**Статус:** Создан  
**Расположение:** `src/plugins/audit-log/`  
**Конфигурация:** `config/plugins.js`

**Функционал:**
- Логирование изменений в продуктах, категориях, заказах и пользователях
- Сохранение в коллекцию `audit_logs`
- Отслеживание действий: create, update, delete, publish, unpublish
- Сохранение информации о пользователе, IP, user-agent

**Content Types для логирования:**
- `api::product.product`
- `api::category.category`
- `api::order.order`
- `plugin::users-permissions.user`

**API Endpoints:**
- `GET /api/audit-log/audit-logs` - список логов
- `GET /api/audit-log/audit-logs/:id` - один лог

---

### 3. ✅ Sentry Integration (middleware)
**Статус:** Создан  
**Расположение:** `src/middlewares/sentry.js`  
**Конфигурация:** `config/middlewares.js`, `config/plugins.js`

**Функционал:**
- Автоматическое логирование ошибок в Sentry
- Интеграция с API и админкой
- Отслеживание контекста запросов

**Переменные окружения:**
- `SENTRY_ENABLED` (по умолчанию: false)
- `SENTRY_DSN`

**Установленные пакеты:**
- `@sentry/node`
- `@sentry/react`

---

### 4. ✅ SEO Plugin (кастомный)
**Статус:** Создан  
**Расположение:** `src/plugins/seo/`  
**Конфигурация:** `config/plugins.js`

**Функционал:**
- SEO компонент для Product и Category
- Генерация мета-тегов (title, description)
- Open Graph теги (og:title, og:description, og:image)
- JSON-LD схемы для продуктов и категорий

**Поля SEO компонента:**
- `metaTitle` (max 60 символов)
- `metaDescription` (max 160 символов)
- `ogTitle`
- `ogDescription`
- `ogImage`
- `canonicalUrl`

**API Endpoints:**
- `GET /api/seo/seo/:contentType/:id` - получение мета-тегов и JSON-LD

**Компонент:** `src/components/seo/seo-fields.json`

---

### 5. ✅ Orders Manager Plugin (кастомный)
**Статус:** Создан и улучшен  
**Расположение:** `src/plugins/orders/`  
**Конфигурация:** `config/plugins.js`

**Функционал:**
- Управление заказами
- Автоматический расчет totals (total_price, items_count)
- Генерация номеров заказов
- Поиск и фильтрация заказов
- Обновление статусов

**Статусы заказов:**
- `new` - новый заказ
- `pending_payment` - ожидает оплаты
- `paid` - оплачен
- `processing` - в обработке
- `shipped` - отправлен
- `completed` - завершен
- `canceled` - отменен

**API Endpoints:**
- `GET /api/orders/orders/search` - поиск заказов с фильтрами
- `PUT /api/orders/orders/:id/status` - обновление статуса
- `PUT /api/orders/orders/:id/totals` - пересчет totals

**Обновленная схема Order:**
- Статусы обновлены согласно требованиям
- Добавлены поля для платежей (payment_id, payment_provider)

---

### 6. ✅ Payments Plugin (кастомный)
**Статус:** Создан  
**Расположение:** `src/plugins/payments/`  
**Конфигурация:** `config/plugins.js`

**Функционал:**
- Интеграция с YooKassa
- Интеграция с CloudPayments
- Инициализация платежей
- Проверка статуса платежей
- Webhook endpoints для обработки уведомлений
- Автоматическое обновление статуса заказа при оплате
- Отправка email уведомлений

**API Endpoints:**
- `POST /api/payments/payments/init` - инициализация платежа
- `GET /api/payments/payments/:provider/:paymentId/status` - проверка статуса
- `POST /api/payments/payments/yookassa/webhook` - webhook YooKassa
- `POST /api/payments/payments/cloudpayments/webhook` - webhook CloudPayments

**Переменные окружения:**
- `YOOKASSA_SHOP_ID`
- `YOOKASSA_API_KEY`
- `CLOUDPAYMENTS_PUBLIC_ID`
- `CLOUDPAYMENTS_API_KEY`

**Установленные пакеты:**
- `yookassa`
- `cloudpayments`

---

### 7. ✅ Email Plugin (Nodemailer)
**Статус:** Настроен  
**Расположение:** Встроенный плагин Strapi + провайдер  
**Конфигурация:** `config/plugins.js`

**Функционал:**
- Отправка email через SMTP
- Email уведомления о заказах:
  - `order_created` - заказ создан
  - `order_paid` - заказ оплачен
  - `order_shipped` - заказ отправлен

**Email Service:** `src/services/email.js`

**Переменные окружения:**
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_EMAIL`
- `SMTP_PASS`
- `EMAIL_DEFAULT_FROM`
- `EMAIL_DEFAULT_REPLY_TO`

**Установленные пакеты:**
- `@strapi/provider-email-nodemailer`

---

## Структура файлов

```
strapi/
├── config/
│   ├── plugins.js          # Конфигурация всех плагинов
│   └── middlewares.js      # Middleware (включая Sentry)
├── src/
│   ├── middlewares/
│   │   └── sentry.js       # Sentry middleware
│   ├── services/
│   │   └── email.js        # Email service для уведомлений
│   ├── plugins/
│   │   ├── audit-log/      # Audit Log plugin
│   │   ├── seo/            # SEO plugin
│   │   ├── orders/         # Orders Manager plugin
│   │   └── payments/       # Payments plugin
│   └── components/
│       └── seo/
│           └── seo-fields.json  # SEO компонент
└── .env.sample             # Пример переменных окружения
```

---

## Конфигурация плагинов (config/plugins.js)

```javascript
module.exports = ({ env }) => ({
  'users-permissions': { ... },
  upload: { ... },
  email: { ... },
  'audit-log': { ... },
  sentry: { ... },
  seo: { ... },
  orders: { ... },
  payments: { ... },
});
```

---

## Переменные окружения (.env.sample)

Все необходимые переменные окружения описаны в файле `.env.sample`.

**Основные группы:**
1. Strapi Configuration (APP_KEYS, JWT_SECRET, etc.)
2. Database Configuration
3. Upload Plugin (локальное хранение + готовность к S3/R2)
4. Email Plugin (SMTP настройки)
5. Sentry (DSN и включение/выключение)
6. Payments (YooKassa и CloudPayments ключи)

---

## Следующие шаги

1. **Скопируйте `.env.sample` в `.env`** и заполните реальными значениями
2. **Установите зависимости:** `npm install` (уже выполнено)
3. **Запустите Strapi:** `npm run develop`
4. **Настройте Content Types:**
   - Убедитесь, что SEO компонент добавлен к Product и Category
   - Проверьте схему Order (статусы обновлены)
5. **Настройте права доступа** для новых API endpoints в админке
6. **Протестируйте плагины:**
   - Audit Log: создайте/обновите продукт и проверьте логи
   - SEO: проверьте генерацию мета-тегов
   - Orders: создайте заказ и проверьте расчет totals
   - Payments: протестируйте инициализацию платежа
   - Email: отправьте тестовое письмо

---

## Примечания

- Все плагины совместимы с Strapi v5.31.3
- Кастомные плагины созданы по стандартам Strapi v5
- Для работы некоторых плагинов требуется настройка переменных окружения
- Sentry middleware отключен по умолчанию (установите `SENTRY_ENABLED=true` для включения)
- Upload plugin настроен на локальное хранение, но готов к переходу на S3/R2

---

## Список установленных npm пакетов

- `@strapi/provider-email-nodemailer` - Email провайдер
- `@sentry/node` - Sentry для Node.js
- `@sentry/react` - Sentry для React (админка)
- `yookassa` - YooKassa SDK
- `cloudpayments` - CloudPayments SDK

---

## Поддержка

При возникновении проблем:
1. Проверьте логи Strapi
2. Убедитесь, что все переменные окружения установлены
3. Проверьте права доступа к API endpoints
4. Убедитесь, что все зависимости установлены (`npm install`)
