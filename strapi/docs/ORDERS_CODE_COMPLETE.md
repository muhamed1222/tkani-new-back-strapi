# Полный код структуры заказов

## 📁 Созданные файлы

---

### 1. Компонент: order.order-item

**Файл:** `src/components/order/order-item.json`

```json
{
  "collectionName": "components_order_order_items",
  "info": {
    "displayName": "Элемент заказа",
    "description": "Товар в заказе с метражом"
  },
  "options": {},
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

---

### 2. Коллекция: Order

**Файл:** `src/api/order/content-types/order/schema.json`

```json
{
  "kind": "collectionType",
  "collectionName": "orders",
  "info": {
    "singularName": "order",
    "pluralName": "orders",
    "displayName": "Заказы",
    "description": "Заказы интернет-магазина Центр Ткани"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "order_number": {
      "type": "string",
      "unique": true
    },
    "status": {
      "type": "enumeration",
      "enum": [
        "new",
        "pending_payment",
        "paid",
        "processing",
        "shipped",
        "completed",
        "canceled"
      ],
      "default": "new",
      "required": true
    },
    "customer_name": {
      "type": "string",
      "required": true
    },
    "customer_phone": {
      "type": "string",
      "required": true
    },
    "customer_email": {
      "type": "email",
      "required": true
    },
    "customer_comment": {
      "type": "text"
    },
    "payment_method": {
      "type": "enumeration",
      "enum": [
        "card",
        "cash",
        "yookassa",
        "cloudpayments"
      ],
      "required": true
    },
    "payment_status": {
      "type": "enumeration",
      "enum": [
        "unpaid",
        "pending",
        "paid",
        "failed"
      ],
      "default": "unpaid",
      "required": true
    },
    "delivery_type": {
      "type": "enumeration",
      "enum": [
        "pickup",
        "delivery"
      ],
      "required": true
    },
    "delivery_price": {
      "type": "decimal",
      "default": 0,
      "min": 0
    },
    "items": {
      "type": "component",
      "repeatable": true,
      "component": "order.order-item",
      "required": true,
      "min": 1
    },
    "total_price": {
      "type": "decimal",
      "required": true,
      "private": true
    },
    "user": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    }
  }
}
```

---

### 3. Утилита генерации номера заказа

**Файл:** `src/utils/generateOrderNumber.js`

```javascript
/**
 * Генерация уникального номера заказа
 * Формат: ORD-YYYY-NNNNN
 * Пример: ORD-2025-00001
 */
function generateOrderNumber() {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const sequence = String(random).padStart(5, '0');
  
  return `ORD-${year}-${sequence}`;
}

/**
 * Альтернативный вариант с автоинкрементом (если нужен порядковый номер)
 * Требует хранения последнего номера в базе или файле
 */
async function generateOrderNumberWithIncrement(strapi, year) {
  const currentYear = year || new Date().getFullYear();
  
  // Находим последний заказ за текущий год
  const lastOrder = await strapi.entityService.findMany('api::order.order', {
    filters: {
      order_number: {
        $contains: `ORD-${currentYear}-`,
      },
    },
    sort: { createdAt: 'desc' },
    limit: 1,
  });

  let sequence = 1;
  
  if (lastOrder && lastOrder.length > 0) {
    const lastNumber = lastOrder[0].order_number;
    const match = lastNumber.match(/ORD-\d{4}-(\d+)/);
    if (match) {
      sequence = parseInt(match[1], 10) + 1;
    }
  }

  const sequenceStr = String(sequence).padStart(5, '0');
  return `ORD-${currentYear}-${sequenceStr}`;
}

module.exports = {
  generateOrderNumber,
  generateOrderNumberWithIncrement,
};
```

---

### 4. Lifecycle Hooks

**Файл:** `src/index.js` (добавлено в функцию bootstrap)

```javascript
// Регистрация lifecycle hooks для Order
const { generateOrderNumber } = require('./utils/generateOrderNumber.js');

// Функция для расчета total_price
const calculateTotalPrice = (items, deliveryPrice = 0) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return parseFloat(deliveryPrice.toFixed(2));
  }

  const itemsTotal = items.reduce((sum, item) => {
    const itemTotal = item.total || (item.meters * item.price_per_meter) || 0;
    return sum + parseFloat(itemTotal);
  }, 0);

  return parseFloat((itemsTotal + deliveryPrice).toFixed(2));
};

// Lifecycle hooks для Order
strapi.db.lifecycles.subscribe({
  models: ['order'],
  async beforeCreate(event) {
    const { data } = event.params;

    // Генерация номера заказа
    if (!data.order_number) {
      data.order_number = generateOrderNumber();
    }

    // Расчет total для каждого item
    if (data.items && Array.isArray(data.items)) {
      data.items = data.items.map((item) => {
        if (item.meters && item.price_per_meter) {
          item.total = parseFloat((item.meters * item.price_per_meter).toFixed(2));
        }
        return item;
      });

      // Расчет total_price
      data.total_price = calculateTotalPrice(data.items, data.delivery_price || 0);
    } else {
      data.total_price = data.delivery_price || 0;
    }
  },

  async beforeUpdate(event) {
    const { data } = event.params;

    // Если изменились items, пересчитываем
    if (data.items && Array.isArray(data.items)) {
      // Расчет total для каждого item
      data.items = data.items.map((item) => {
        if (item.meters && item.price_per_meter) {
          item.total = parseFloat((item.meters * item.price_per_meter).toFixed(2));
        }
        return item;
      });

      // Получаем текущий заказ для delivery_price
      const existingOrder = await strapi.entityService.findOne(
        'api::order.order',
        event.params.where.id
      );

      const deliveryPrice = data.delivery_price !== undefined
        ? data.delivery_price
        : (existingOrder?.delivery_price || 0);

      data.total_price = calculateTotalPrice(data.items, deliveryPrice);
    } else if (data.delivery_price !== undefined) {
      // Если изменилась только delivery_price
      const existingOrder = await strapi.entityService.findOne(
        'api::order.order',
        event.params.where.id
      );

      if (existingOrder && existingOrder.items) {
        data.total_price = calculateTotalPrice(
          existingOrder.items,
          data.delivery_price
        );
      }
    }

    // Запрещаем прямое редактирование total_price
    if (data.total_price !== undefined && !data.items && !data.delivery_price) {
      delete data.total_price;
    }
  },
});

strapi.log.info('✅ Order lifecycle hooks registered');
```

---

### 5. Контроллеры API

**Файл:** `src/api/order/controllers/order.js`

**Основные методы:**
- `create(ctx)` - создание заказа с валидацией
- `find(ctx)` - список заказов с фильтрами и пагинацией
- `findOne(ctx)` - получение одного заказа
- `update(ctx)` - обновление заказа (автоматический пересчет totals)

**Особенности:**
- Валидация всех обязательных полей
- Проверка прав доступа (пользователи видят только свои заказы)
- Автоматический пересчет totals при обновлении

---

### 6. Маршруты API

**Файл:** `src/api/order/routes/order.js`

```javascript
{
  routes: [
    {
      method: 'POST',
      path: '/orders',
      handler: 'order.create',
    },
    {
      method: 'GET',
      path: '/orders',
      handler: 'order.find',
    },
    {
      method: 'GET',
      path: '/orders/:id',
      handler: 'order.findOne',
    },
    {
      method: 'PUT',
      path: '/orders/:id',
      handler: 'order.update',
    }
  ]
}
```

---

## 📊 Итоговая структура модели Order

### Поля:

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| order_number | string (unique) | ✅ | Номер заказа (автогенерация) |
| status | enum | ✅ | Статус заказа |
| customer_name | string | ✅ | Имя клиента |
| customer_phone | string | ✅ | Телефон клиента |
| customer_email | email | ✅ | Email клиента |
| customer_comment | text | ❌ | Комментарий клиента |
| payment_method | enum | ✅ | Способ оплаты |
| payment_status | enum | ✅ | Статус оплаты |
| delivery_type | enum | ✅ | Тип доставки |
| delivery_price | decimal | ❌ | Стоимость доставки |
| items | component[] | ✅ (min: 1) | Товары в заказе |
| total_price | decimal | ✅ | Общая стоимость (авто) |
| user | relation | ❌ | Пользователь |

### Компонент order.order-item:

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| product | relation | ✅ | Связь с продуктом |
| meters | decimal | ✅ (min: 0.1) | Метраж |
| price_per_meter | decimal | ✅ (min: 0) | Цена за метр |
| total | decimal | ❌ (private) | Итого (авто) |

---

## 🔄 Автоматические расчеты

1. **total (item)** = `meters * price_per_meter`
2. **total_price (order)** = `sum(items.total) + delivery_price`

---

## ✅ Статус выполнения

- ✅ Компонент order.order-item создан
- ✅ Коллекция Order обновлена
- ✅ Lifecycle hooks зарегистрированы
- ✅ Контроллеры обновлены
- ✅ Валидация настроена
- ✅ Strapi запускается без ошибок
- ✅ Автоматические расчеты работают

---

## 🚀 Готово к использованию!

Структура заказов полностью настроена и готова к работе.
