# Итоговая структура заказов - Центр Ткани

## ✅ Созданные файлы

### 1. Компонент order.order-item
**Файл:** `src/components/order/order-item.json`

```json
{
  "collectionName": "components_order_order_items",
  "info": {
    "displayName": "Элемент заказа",
    "description": "Товар в заказе с метражом"
  },
  "attributes": {
    "product": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "api::product.product"
    },
    "meters": {
      "type": "decimal",
      "required": true,
      "min": 0.1
    },
    "price_per_meter": {
      "type": "decimal",
      "required": true,
      "min": 0
    },
    "total": {
      "type": "decimal",
      "required": false,
      "private": true
    }
  }
}
```

### 2. Коллекция Order
**Файл:** `src/api/order/content-types/order/schema.json`

**Основные поля:**
- `order_number` (string, unique) - генерируется автоматически
- `status` (enum) - статус заказа
- `customer_name`, `customer_phone`, `customer_email` - данные клиента
- `payment_method`, `payment_status` - платежи
- `delivery_type`, `delivery_price` - доставка
- `items` (component, min: 1) - товары
- `total_price` (decimal, private) - автоматически вычисляется

### 3. Утилита генерации номера
**Файл:** `src/utils/generateOrderNumber.js`

Функции:
- `generateOrderNumber()` - генерация номера формата `ORD-YYYY-NNNNN`
- `generateOrderNumberWithIncrement()` - с автоинкрементом

### 4. Lifecycle Hooks
**Файл:** `src/index.js` (в функции bootstrap)

Автоматические действия:
- Генерация `order_number` при создании
- Расчет `total` для каждого item
- Расчет `total_price` для заказа
- Пересчет при обновлении

### 5. Контроллеры API
**Файл:** `src/api/order/controllers/order.js`

Endpoints:
- `POST /api/orders` - создание
- `GET /api/orders` - список (с фильтрами и пагинацией)
- `GET /api/orders/:id` - один заказ
- `PATCH /api/orders/:id` - обновление

---

## 📋 Итоговая структура API

### POST /api/orders
**Создание заказа с автоматическим расчетом totals**

### GET /api/orders
**Список заказов с фильтрами:**
- `filters[status]`
- `filters[payment_status]`
- `sort` (по умолчанию: `createdAt:desc`)
- `pagination[page]`, `pagination[pageSize]`

### GET /api/orders/:id
**Получение одного заказа**

### PATCH /api/orders/:id
**Обновление заказа (автоматический пересчет totals)**

---

## 🔄 Автоматические расчеты

1. **total (item)** = `meters * price_per_meter`
2. **total_price (order)** = `sum(items.total) + delivery_price`

---

## ✅ Статус

- ✅ Все файлы созданы
- ✅ Lifecycle hooks зарегистрированы
- ✅ Strapi запускается без ошибок
- ✅ Валидация настроена
- ✅ API endpoints работают

---

## 📝 Следующие шаги

1. Откройте админ-панель Strapi
2. Перейдите в **Content Manager → Orders**
3. Создайте тестовый заказ
4. Проверьте автоматические расчеты

Подробная документация в файле `ORDERS_STRUCTURE.md`.
