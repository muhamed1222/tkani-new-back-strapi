# Чеклист настройки плагинов Strapi

## ✅ Что уже настроено:

### 1. Встроенные плагины
- ✅ **users-permissions** - настроен (JWT срок действия 7 дней)
- ✅ **upload** - настроен для локального хранения, готов к S3/R2
- ✅ **email** - настроен с nodemailer (требует переменные окружения)

### 2. Кастомные плагины
- ✅ **audit-log** - создан, загружается автоматически
- ✅ **seo** - создан, SEO компонент добавлен в Product и Category
- ✅ **orders** - создан, улучшен функционал
- ✅ **payments** - создан, интеграция с YooKassa и CloudPayments

### 3. Интеграции
- ✅ **Sentry** - middleware создан (отключен по умолчанию)

---

## ⚠️ Что нужно настроить:

### 1. Переменные окружения (.env)

**Обязательно:**
```bash
# Email (для работы email плагина)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_EMAIL=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_DEFAULT_FROM=noreply@centr-tkani.ru
EMAIL_DEFAULT_REPLY_TO=support@centr-tkani.ru
```

**Опционально (для продакшена):**
```bash
# Sentry (для мониторинга ошибок)
SENTRY_ENABLED=true
SENTRY_DSN=your-sentry-dsn

# Payments (для работы платежей)
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_API_KEY=your-api-key
CLOUDPAYMENTS_PUBLIC_ID=your-public-id
CLOUDPAYMENTS_API_KEY=your-api-key

# Upload S3/R2 (если планируете использовать)
AWS_ACCESS_KEY_ID=your-key
AWS_ACCESS_SECRET=your-secret
AWS_REGION=your-region
AWS_BUCKET=your-bucket
```

---

### 2. Права доступа в админке

После запуска Strapi нужно настроить права доступа для новых API endpoints:

1. **Откройте админ-панель** → **Settings** → **Users & Permissions** → **Roles**
2. Для роли **Public** (если нужно):
   - Разрешите доступ к SEO endpoint: `GET /api/seo/seo/:contentType/:id`
3. Для роли **Authenticated**:
   - Разрешите доступ к Orders endpoints
   - Разрешите доступ к Payments endpoints
4. Для роли **Admin**:
   - Все права уже есть по умолчанию

**Endpoints для настройки прав:**

**Audit Log:**
- `GET /api/audit-log/audit-logs` - список логов
- `GET /api/audit-log/audit-logs/:id` - один лог

**SEO:**
- `GET /api/seo/seo/:contentType/:id` - получение мета-тегов

**Orders:**
- `GET /api/orders/orders/search` - поиск заказов
- `PUT /api/orders/orders/:id/status` - обновление статуса
- `PUT /api/orders/orders/:id/totals` - пересчет totals

**Payments:**
- `POST /api/payments/payments/init` - инициализация платежа
- `GET /api/payments/payments/:provider/:paymentId/status` - проверка статуса
- `POST /api/payments/payments/yookassa/webhook` - webhook YooKassa
- `POST /api/payments/payments/cloudpayments/webhook` - webhook CloudPayments

---

### 3. Content Type для Audit Log

Плагин `audit-log` создает свой content type автоматически. После первого запуска:

1. Откройте **Content-Type Builder**
2. Проверьте, что появился тип **Audit Log**
3. Если нужно, настройте права доступа для просмотра логов

---

### 4. SEO компонент

✅ SEO компонент уже добавлен в схемы Product и Category.

**Проверьте:**
1. Откройте любой Product или Category в админке
2. Убедитесь, что есть поле **SEO** с полями:
   - Meta Title
   - Meta Description
   - OG Title
   - OG Description
   - OG Image
   - Canonical URL

---

### 5. Orders - автоматическая генерация номера

При создании заказа нужно автоматически генерировать номер:

**Рекомендуется добавить в контроллер создания заказа:**
```javascript
// В src/api/order/controllers/order.js
const orderService = strapi.plugin('orders').service('order');
const orderNumber = orderService.generateOrderNumber();
```

---

### 6. Payments - настройка webhooks

Для работы webhooks нужно:

1. **YooKassa:**
   - В настройках магазина YooKassa укажите URL: `https://your-domain.com/api/payments/payments/yookassa/webhook`
   - Убедитесь, что URL доступен извне

2. **CloudPayments:**
   - В настройках CloudPayments укажите URL: `https://your-domain.com/api/payments/payments/cloudpayments/webhook`
   - Убедитесь, что URL доступен извне

---

### 7. Sentry (опционально)

Если хотите включить мониторинг ошибок:

1. Создайте проект в Sentry
2. Получите DSN
3. Добавьте в `.env`:
   ```bash
   SENTRY_ENABLED=true
   SENTRY_DSN=your-sentry-dsn
   ```
4. Перезапустите Strapi

---

## 📋 Итоговый чеклист:

- [ ] Добавлены переменные окружения для Email в `.env`
- [ ] Настроены права доступа для новых API endpoints
- [ ] Проверено наличие SEO компонента в Product и Category
- [ ] Настроены webhooks для платежных систем (если используются)
- [ ] Протестирована отправка тестового email
- [ ] Протестирована работа Audit Log (создайте/обновите продукт)
- [ ] Протестирована работа Orders (создайте заказ)
- [ ] Протестирована работа Payments (если настроены ключи)

---

## 🚀 После настройки:

1. **Перезапустите Strapi:** `npm run develop`
2. **Проверьте логи** на наличие ошибок
3. **Протестируйте каждый плагин** через админ-панель или API
4. **Настройте права доступа** для production окружения

---

## 📝 Примечания:

- Все кастомные плагины загружаются автоматически из `src/plugins/`
- Конфигурация встроенных плагинов находится в `config/plugins.js`
- Переменные окружения описаны в `.env.sample`
- Подробная документация в `PLUGINS_SETUP.md`

---

## ❓ Если что-то не работает:

1. Проверьте логи Strapi в консоли
2. Убедитесь, что все переменные окружения установлены
3. Проверьте права доступа в админ-панели
4. Убедитесь, что все зависимости установлены: `npm install`
