# Структура заказов для магазина "Центр Ткани"

## ✅ Выполнено

### 1. COMPONENT: order.order-item

**Файл:** `src/components/order/order-item.json`

**Поля:**
- `product` (relation: api::product.product) - обязательное
- `meters` (decimal, required, min=0.1)
- `price_per_meter` (decimal, required, min=0)
- `total` (decimal, private) - вычисляется автоматически

**Особенности:**
- `total` рассчитывается автоматически в lifecycle hooks: `meters * price_per_meter`
- `total` помечен как `private` - не редактируется вручную в админке

---

### 2. COLLECTION TYPE: order

**Файл:** `src/api/order/content-types/order/schema.json`

**Поля:**
- `order_number` (string, unique) - генерируется автоматически
- `status` (enum: new, pending_payment, paid, processing, shipped, completed, canceled)
- `customer_name` (string, required)
- `customer_phone` (string, required)
- `customer_email` (email, required)
- `customer_comment` (text)
- `payment_method` (enum: card, cash, yookassa, cloudpayments, required)
- `payment_status` (enum: unpaid, pending, paid, failed, default: unpaid)
- `delivery_type` (enum: pickup, delivery, required)
- `delivery_price` (decimal, default: 0, min: 0)
- `items` (repeatable component: order.order-item, required, min: 1)
- `total_price` (decimal, private) - вычисляется автоматически
- `created_at` (datetime) - устанавливается автоматически
- `user` (relation: manyToOne, plugin::users-permissions.user)

**Особенности:**
- `total_price` рассчитывается автоматически: сумма `total` всех items + `delivery_price`
- `total_price` помечен как `private` - не редактируется вручную
- `order_number` генерируется автоматически в формате `ORD-YYYY-NNNNN`

---

### 3. ВАЛИДАЦИЯ

**Реализовано в:**
- Lifecycle hooks (`lifecycles.js`)
- Контроллере (`order.js`)

**Правила:**
- `meters > 0.1` (минимум 0.1 метра)
- `price_per_meter > 0` (цена должна быть положительной)
- `items` должно содержать минимум 1 элемент
- `order_number` генерируется автоматически при создании
- Все обязательные поля проверяются перед созданием/обновлением

---

### 4. LIFECYCLE HOOKS

**Файл:** `src/api/order/content-types/order/lifecycles.js`

**Функции:**
- `beforeCreate` - генерирует `order_number`, устанавливает `created_at`, рассчитывает `total` для items и `total_price`
- `afterCreate` - логирует создание заказа
- `beforeUpdate` - запрещает изменение `order_number`, пересчитывает `total` и `total_price` при изменении items или delivery_price
- `afterUpdate` - логирует обновление заказа

---

### 5. УТИЛИТЫ

**Файл:** `src/utils/generateOrderNumber.js`

**Функции:**
- `generateOrderNumber(strapi)` - генерирует номер заказа с автоинкрементом по году
  - Формат: `ORD-YYYY-NNNNN` (например, `ORD-2025-00001`)
  - Находит последний заказ за текущий год и увеличивает последовательность
  - Fallback на timestamp при ошибке
- `generateOrderNumberSimple()` - простая генерация без проверки БД (fallback)

---

### 6. API ENDPOINTS

**Файл:** `src/api/order/routes/order.js`

**Маршруты:**
- `POST /api/orders` - создание заказа
- `GET /api/orders` - получение списка заказов (с пагинацией и фильтрами)
- `GET /api/orders/:id` - получение одного заказа
- `PATCH /api/orders/:id` - обновление заказа

**Контроллер:** `src/api/order/controllers/order.js`

**Особенности:**
- Автоматическая генерация `order_number` при создании
- Автоматический пересчет `total` и `total_price` при создании/обновлении
- Валидация всех обязательных полей
- Фильтрация заказов по пользователю (если не админ)
- Сортировка по `createdAt` и статусу
- Пагинация результатов

---

## 📁 Структура файлов

```
strapi/
├── src/
│   ├── api/
│   │   └── order/
│   │       ├── content-types/
│   │       │   └── order/
│   │       │       ├── schema.json          # Схема заказа
│   │       │       └── lifecycles.js        # Lifecycle hooks
│   │       ├── controllers/
│   │       │   └── order.js                 # Контроллер API
│   │       └── routes/
│   │           └── order.js                 # Маршруты API
│   ├── components/
│   │   └── order/
│   │       └── order-item.json              # Компонент элемента заказа
│   └── utils/
│       └── generateOrderNumber.js           # Генерация номера заказа
```

---

## 🔧 Использование API

### Создание заказа

```javascript
POST /api/orders
Content-Type: application/json

{
  "data": {
    "customer_name": "Иван Иванов",
    "customer_phone": "+7 (999) 123-45-67",
    "customer_email": "ivan@example.com",
    "customer_comment": "Позвонить перед доставкой",
    "payment_method": "card",
    "payment_status": "unpaid",
    "delivery_type": "delivery",
    "delivery_price": 500,
    "items": [
      {
        "product": 1,  // ID товара
        "meters": 2.5,
        "price_per_meter": 450
        // total будет рассчитан автоматически: 2.5 * 450 = 1125
      },
      {
        "product": 2,
        "meters": 1.0,
        "price_per_meter": 800
        // total будет рассчитан автоматически: 1.0 * 800 = 800
      }
    ]
    // total_price будет рассчитан автоматически: 1125 + 800 + 500 = 2425
    // order_number будет сгенерирован автоматически: ORD-2025-00001
  }
}
```

### Обновление заказа

```javascript
PATCH /api/orders/:id
Content-Type: application/json

{
  "data": {
    "status": "processing",
    "items": [
      {
        "product": 1,
        "meters": 3.0,  // Изменили метраж
        "price_per_meter": 450
        // total будет пересчитан автоматически: 3.0 * 450 = 1350
      }
    ]
    // total_price будет пересчитан автоматически
  }
}
```

### Получение заказов

```javascript
GET /api/orders?filters[status]=new&sort=createdAt:desc&pagination[page]=1&pagination[pageSize]=25
```

---

## ✅ Проверка работы

1. **Запуск Strapi:**
   ```bash
   cd strapi
   npm run develop
   ```

2. **Проверка структуры:**
   - Откройте админ-панель Strapi
   - Перейдите в раздел "Content Manager" → "Orders"
   - Убедитесь, что все поля отображаются корректно

3. **Тестирование API:**
   - Создайте тестовый заказ через API
   - Проверьте, что `order_number` сгенерирован
   - Проверьте, что `total` и `total_price` рассчитаны правильно

---

## 📝 Примечания
- Поля `total` и `total_price` помечены как `private` - они не отображаются в админке для редактирования, но доступны через API
- `order_number` нельзя изменить после создания (защищено в lifecycle hooks)
- При обновлении заказа `total` и `total_price` пересчитываются автоматически
- Все расчеты выполняются с точностью до 2 знаков после запятой

