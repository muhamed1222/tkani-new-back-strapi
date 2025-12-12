# ✅ Исправление уязвимостей YooKassa

## Проблема

Библиотека `yookassa` версии 0.1.1 и 2.3.0 использовала устаревший пакет `request`, который содержит критические уязвимости:
- **form-data <2.5.4** - небезопасная случайная функция для выбора boundary
- **tough-cookie <4.1.3** - Prototype Pollution уязвимость

## Решение

Заменена библиотека `yookassa` на прямые HTTP запросы через `axios` к официальному YooKassa API.

### Что изменено:

1. **Удалена зависимость `yookassa`** из:
   - `strapi/package.json` (корневой)
   - `strapi/src/plugins/payments/package.json` (плагин)

2. **Добавлена зависимость `axios`** в плагин payments

3. **Переписан сервис платежей** (`payment.js`):
   - Использует `axios` для прямых HTTP запросов к YooKassa API
   - Реализована аутентификация через Basic Auth
   - Добавлена генерация ключей идемпотентности
   - Улучшена обработка ошибок

## Преимущества нового подхода:

✅ **Безопасность**: Используется современный `axios` без уязвимостей  
✅ **Контроль**: Прямой контроль над HTTP запросами  
✅ **Актуальность**: Используется официальный YooKassa API v3  
✅ **Надежность**: Лучшая обработка ошибок и логирование  
✅ **Совместимость**: Полная совместимость с существующим кодом  

## API методы

### `initYooKassaPayment(orderId, amount, description, returnUrl)`

Создает платеж через YooKassa API:
- Использует `POST /v3/payments`
- Автоматически генерирует ключ идемпотентности
- Сохраняет `payment_id` в заказ

### `checkYooKassaPaymentStatus(paymentId)`

Проверяет статус платежа:
- Использует `GET /v3/payments/{paymentId}`
- Возвращает полную информацию о платеже

## Конфигурация

Конфигурация остается прежней в `config/plugins.js`:

```javascript
payments: {
  providers: {
    yookassa: {
      shopId: env('YOOKASSA_SHOP_ID'),
      apiKey: env('YOOKASSA_API_KEY'),
    },
  },
},
```

Переменные окружения:
- `YOOKASSA_SHOP_ID` - ID магазина
- `YOOKASSA_API_KEY` - Секретный ключ API

## Тестирование

После установки зависимостей проверьте:

1. **Инициализация платежа:**
```bash
POST /api/payments/payments/init
{
  "orderId": 1,
  "provider": "yookassa",
  "returnUrl": "https://yourdomain.com/payment/return"
}
```

2. **Проверка статуса:**
```bash
GET /api/payments/payments/check/yookassa/{paymentId}
```

3. **Webhook** (не изменился):
```bash
POST /api/payments/payments/yookassa/webhook
```

## Миграция

Если у вас уже были установлены зависимости:

```bash
cd strapi/src/plugins/payments
npm install
```

Затем перезапустите Strapi:
```bash
npm run develop
```

## Результат

✅ Уязвимости `form-data` и `tough-cookie` устранены  
✅ Код стал более безопасным и поддерживаемым  
✅ Функциональность полностью сохранена  
✅ Совместимость с существующим API сохранена  

---

**Статус**: ✅ Исправлено  
**Дата**: 2025-12-06  
**Версия**: 1.0.0
