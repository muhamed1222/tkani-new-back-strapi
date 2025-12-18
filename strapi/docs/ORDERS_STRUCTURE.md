# Структура заказов для интернет-магазина "Центр Ткани"

## Обзор

Создана полная структура e-commerce заказов для Strapi v5.31.3 с автоматическим расчетом totals и валидацией.

---

## 1. Компонент: order.order-item

**Файл:** `src/components/order/order-item.json`

### Поля:
- **product** (relation) - связь с `api::product.product`
- **meters** (decimal, required, min=0.1) - метраж ткани
- **price_per_meter** (decimal, required, min=0) - цена за метр
- **total** (decimal, private) - автоматически вычисляется: `meters * price_per_meter`

### Особенности:
- Поле `total` вычисляется автоматически через lifecycle hooks
- Поле `total` помечено как `private` - не отображается в админке для редактирования
- Валидация: meters >= 0.1, price_per_meter > 0

---

## 2. Коллекция: order

**Файл:** `src/api/order/content-types/order/schema.json`

### Поля:

#### Основная информация:
- **order_number** (UID) - уникальный номер заказа, генерируется автоматически
- **status** (enum, required) - статус заказа:
  - `new` - новый заказ
  - `pending_payment` - ожидает оплаты
  - `paid` - оплачен
  - `processing` - в обработке
  - `shipped` - отправлен
  - `completed` - завершен
  - `canceled` - отменен

#### Данные клиента:
- **customer_name** (string, required) - имя клиента
- **customer_phone** (string, required) - телефон клиента
- **customer_email** (email, required) - email клиента
- **customer_comment** (text) - комментарий клиента

#### Платежи:
- **payment_method** (enum, required) - способ оплаты:
  - `card` - карта
  - `cash` - наличные
  - `yookassa` - YooKassa
  - `cloudpayments` - CloudPayments
- **payment_status** (enum, required, default: unpaid) - статус оплаты:
  - `unpaid` - не оплачен
  - `pending` - в процессе
  - `paid` - оплачен
  - `failed` - ошибка оплаты

#### Доставка:
- **delivery_type** (enum, required) - тип доставки:
  - `pickup` - самовывоз
  - `delivery` - доставка
- **delivery_price** (decimal, default: 0, min: 0) - стоимость доставки

#### Товары и итоги:
- **items** (component, repeatable, required, min: 1) - товары в заказе (компонент `order.order-item`)
- **total_price** (decimal, required, private) - общая стоимость заказа (автоматически вычисляется)

#### Связи:
- **user** (relation) - связь с пользователем (опционально, если заказ от авторизованного пользователя)

---

## 3. Lifecycle Hooks

**Файл:** `src/index.js` (в функции bootstrap)

### Автоматические действия:

#### beforeCreate:
1. Генерирует `order_number`, если не указан
2. Вычисляет `total` для каждого item: `meters * price_per_meter`
3. Вычисляет `total_price`: сумма всех `total` из items + `delivery_price`

#### beforeUpdate:
1. При изменении `items`:
   - Пересчитывает `total` для каждого item
   - Пересчитывает `total_price`
2. При изменении `delivery_price`:
   - Пересчитывает `total_price` с учетом новых items
3. Запрещает прямое редактирование `total_price` (удаляет из data, если нет изменений в items/delivery_price)

---

## 4. Валидация

### На уровне API (контроллер):
- `customer_name`, `customer_phone`, `customer_email` - обязательны
- `items` - минимум 1 элемент
- Каждый item должен иметь:
  - `product` - связь с продуктом
  - `meters >= 0.1`
  - `price_per_meter > 0`

### На уровне схемы:
- `meters` - min: 0.1
- `price_per_meter` - min: 0
- `items` - min: 1
- Все enum поля имеют валидные значения

---

## 5. API Endpoints

### POST /api/orders
**Создание заказа**

**Request:**
```json
{
  "data": {
    "customer_name": "Иван Иванов",
    "customer_phone": "+79001234567",
    "customer_email": "ivan@example.com",
    "customer_comment": "Позвонить перед доставкой",
    "payment_method": "yookassa",
    "payment_status": "unpaid",
    "delivery_type": "delivery",
    "delivery_price": 500,
    "items": [
      {
        "product": 1,
        "meters": 2.5,
        "price_per_meter": 1500
      },
      {
        "product": 2,
        "meters": 1.0,
        "price_per_meter": 2000
      }
    ]
  }
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "order_number": "ORD-2025-01234",
    "status": "new",
    "customer_name": "Иван Иванов",
    "total_price": 5750.00,
    "items": [
      {
        "id": 1,
        "product": { "id": 1, "title": "Ткань 1" },
        "meters": 2.5,
        "price_per_meter": 1500,
        "total": 3750.00
      },
      {
        "id": 2,
        "product": { "id": 2, "title": "Ткань 2" },
        "meters": 1.0,
        "price_per_meter": 2000,
        "total": 2000.00
      }
    ]
  }
}
```

### GET /api/orders
**Получение списка заказов**

**Query параметры:**
- `filters[status]` - фильтр по статусу
- `filters[payment_status]` - фильтр по статусу оплаты
- `sort` - сортировка (по умолчанию: `createdAt:desc`)
- `pagination[page]` - номер страницы
- `pagination[pageSize]` - размер страницы

**Response:**
```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 5,
      "total": 120
    }
  }
}
```

### GET /api/orders/:id
**Получение одного заказа**

### PATCH /api/orders/:id
**Обновление заказа**

**Автоматически пересчитывает totals при изменении items или delivery_price**

---

## 6. Генерация номера заказа

**Файл:** `src/utils/generateOrderNumber.js`

### Формат: `ORD-YYYY-NNNNN`
- `ORD` - префикс
- `YYYY` - год (2025)
- `NNNNN` - случайное число (00001-99999)

**Пример:** `ORD-2025-01234`

### Альтернативный вариант:
Функция `generateOrderNumberWithIncrement` - генерирует порядковые номера с автоинкрементом.

---

## 7. Структура файлов

```
src/
├── components/
│   └── order/
│       └── order-item.json          # Компонент элемента заказа
├── api/
│   └── order/
│       ├── content-types/
│       │   └── order/
│       │       └── schema.json      # Схема коллекции Order
│       ├── controllers/
│       │   └── order.js             # Контроллеры API
│       └── routes/
│           └── order.js             # Маршруты API
├── utils/
│   └── generateOrderNumber.js       # Утилита генерации номера
└── index.js                         # Lifecycle hooks регистрация
```

---

## 8. Особенности реализации

### Автоматические расчеты:
1. **total для item** = `meters * price_per_meter`
2. **total_price для order** = `sum(items.total) + delivery_price`

### Защита от редактирования:
- Поле `total` в компоненте помечено как `private` - не редактируется в админке
- Поле `total_price` в схеме помечено как `private` - не редактируется в админке
- В контроллере удаляется `total_price` из data, если нет изменений в items/delivery_price

### Валидация:
- На уровне схемы (min значения)
- На уровне контроллера (проверка обязательных полей)
- Lifecycle hooks проверяют корректность данных перед сохранением

---

## 9. Использование в админке

После создания структуры:

1. **Откройте админ-панель Strapi**
2. **Перейдите в Content Manager → Orders**
3. **Создайте новый заказ:**
   - Заполните данные клиента
   - Выберите способ оплаты и доставки
   - Добавьте товары (items):
     - Выберите продукт
     - Укажите метраж (>= 0.1)
     - Укажите цену за метр
     - Поле `total` заполнится автоматически
   - Поле `total_price` рассчитается автоматически
   - Номер заказа сгенерируется автоматически

4. **При редактировании:**
   - Изменение items или delivery_price автоматически пересчитает total_price
   - Поля `total` и `total_price` не редактируются вручную

---

## 10. Примеры использования

### Создание заказа через API:

```javascript
const response = await fetch('http://localhost:1337/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    data: {
      customer_name: 'Иван Иванов',
      customer_phone: '+79001234567',
      customer_email: 'ivan@example.com',
      payment_method: 'yookassa',
      delivery_type: 'delivery',
      delivery_price: 500,
      items: [
        {
          product: 1,
          meters: 2.5,
          price_per_meter: 1500
        }
      ]
    }
  })
});
```

### Обновление заказа:

```javascript
// Изменение items автоматически пересчитает total_price
await fetch('http://localhost:1337/api/orders/1', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    data: {
      items: [
        {
          product: 1,
          meters: 3.0,  // Изменили метраж
          price_per_meter: 1500
        }
      ]
      // total_price пересчитается автоматически
    }
  })
});
```

---

## 11. Проверка работы

После создания структуры:

1. **Запустите Strapi:** `npm run develop`
2. **Проверьте логи** - должно быть: `✅ Order lifecycle hooks registered`
3. **Создайте тестовый заказ** через админку или API
4. **Проверьте:**
   - Номер заказа сгенерирован
   - total для каждого item рассчитан
   - total_price рассчитан правильно
5. **Отредактируйте заказ:**
   - Измените метраж в item
   - Проверьте, что total и total_price пересчитались

---

## 12. Итоговая структура API

### Endpoints:
- `POST /api/orders` - создание заказа
- `GET /api/orders` - список заказов (с фильтрами и пагинацией)
- `GET /api/orders/:id` - один заказ
- `PATCH /api/orders/:id` - обновление заказа

### Автоматические функции:
- ✅ Генерация `order_number`
- ✅ Расчет `total` для каждого item
- ✅ Расчет `total_price` для заказа
- ✅ Пересчет при изменении items или delivery_price
- ✅ Валидация данных
- ✅ Защита от ручного редактирования calculated полей

---

## Готово! 🎉

Структура заказов полностью настроена и готова к использованию.
