# Руководство по миграции фронтенда на Strapi API

## Изменения в src/http/api.js

### 1. Удалить Flask API URL

Заменить:
```javascript
const STRAPI_API_URL = `${getStrapiUrl()}/api`;
const FLASK_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
```

На:
```javascript
const API_URL = `${getStrapiUrl()}/api`;
```

### 2. Обновить базовый класс ApiService

Заменить:
```javascript
constructor(baseURL = API_URL) {
  this.baseURL = baseURL;
}
```

На:
```javascript
constructor(baseURL = API_URL) {
  this.baseURL = baseURL;
}
```

## Изменения API endpoints

### Аутентификация

**Регистрация:**
```javascript
// Было:
async register(userData) {
  const response = await fetch(`${FLASK_API_URL}/auth/register`, {...});
}

// Стало:
async register(userData) {
  const response = await fetch(`${API_URL}/registration`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      data: {
        username: userData.email,
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
      }
    })
  });
}
```

**Вход:**
```javascript
// Было:
async login(email, password) {
  const response = await fetch(`${FLASK_API_URL}/auth/login`, {...});
}

// Стало:
async login(email, password) {
  const response = await fetch(`${API_URL}/auth/local`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      identifier: email,
      password: password,
    })
  });
  // Ответ: { jwt: "token", user: {...} }
}
```

**Получить текущего пользователя:**
```javascript
// Было:
async getMe() {
  return this._makeRequest(`${FLASK_API_URL}/auth/me`);
}

// Стало:
async getMe() {
  return this._makeRequest(`${API_URL}/users/me`, {
    headers: getHeaders(true)
  });
}
```

### Корзина

**Получить корзину:**
```javascript
// Было:
async getCart() {
  return this._makeRequest(`${FLASK_API_URL}/cart/`);
}

// Стало:
async getCart() {
  return this._makeRequest(`${API_URL}/cart`, {
    headers: getHeaders(true)
  });
}
```

**Добавить в корзину:**
```javascript
// Было:
async addToCart(productId, quantity) {
  return this._makeRequest(`${FLASK_API_URL}/cart/add`, {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity })
  });
}

// Стало (корзина уже в Strapi):
async addToCart(productId, quantity) {
  return this._makeRequest(`${API_URL}/cart/add`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ product_id: productId, quantity })
  });
}
```

### Заказы

**Создать заказ:**
```javascript
// Было:
async createOrder(orderData) {
  return this._makeRequest(`${FLASK_API_URL}/orders/create`, {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
}

// Стало:
async createOrder(orderData) {
  return this._makeRequest(`${API_URL}/orders`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({
      data: {
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_email: orderData.customerEmail,
        items: orderData.items,
        delivery_method: orderData.deliveryMethod,
        delivery_address: orderData.deliveryAddress,
        delivery_price: orderData.deliveryPrice,
        payment_method: orderData.paymentMethod,
      }
    })
  });
}
```

**Получить мои заказы:**
```javascript
// Было:
async getMyOrders() {
  return this._makeRequest(`${FLASK_API_URL}/orders/my`);
}

// Стало:
async getMyOrders() {
  return this._makeRequest(`${API_URL}/orders?filters[user]=${userId}&populate=items.product`, {
    headers: getHeaders(true)
  });
}
```

### Доставка (новый плагин)

**Расчет стоимости доставки:**
```javascript
async calculateDeliveryCost(provider, weight, fromCity, toCity) {
  return this._makeRequest(`${API_URL}/delivery/calculate`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      provider: provider, // 'cdek', 'russian_post', 'pickup'
      weight: weight,
      fromCity: fromCity,
      toCity: toCity,
      dimensions: { length: 10, width: 10, height: 10 }
    })
  });
}
```

**Получить пункты выдачи СДЭК:**
```javascript
async getCDEKPoints(city) {
  return this._makeRequest(`${API_URL}/delivery/cdek/points?city=${city}`);
}
```

### Платежи (уже в Strapi)

**Инициализация платежа:**
```javascript
// Было:
async initiatePayment(orderId, provider) {
  return this._makeRequest(`${FLASK_API_URL}/payment/yoomoney/init`, {...});
}

// Стало:
async initiatePayment(orderId, provider, returnUrl) {
  return this._makeRequest(`${API_URL}/payments/init`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({
      orderId: orderId,
      provider: provider, // 'yookassa' or 'cloudpayments'
      returnUrl: returnUrl
    })
  });
}
```

## Обновление Store (MobX)

### UserStore.jsx

```javascript
// Обновить методы:
async login(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/local`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ identifier: email, password })
    });
    const data = await response.json();
    
    if (data.jwt) {
      localStorage.setItem('authToken', data.jwt);
      this.user = data.user;
      this.isAuth = true;
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}

async checkAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    this.isAuth = false;
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {'Authorization': `Bearer ${token}`}
    });
    const data = await response.json();
    this.user = data;
    this.isAuth = true;
  } catch (error) {
    console.error('Auth check error:', error);
    this.logout();
  }
}
```

## Тестирование

После внесения изменений проверьте:

1. ✅ Регистрацию нового пользователя
2. ✅ Вход в систему
3. ✅ Получение профиля пользователя
4. ✅ Просмотр каталога товаров
5. ✅ Добавление товара в корзину
6. ✅ Обновление количества в корзине
7. ✅ Создание заказа
8. ✅ Просмотр истории заказов
9. ✅ Расчет стоимости доставки (СДЭК, Почта России)
10. ✅ Инициализацию платежа

## Переменные окружения

Обновите `.env` в проекте фронтенда:

```env
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_URL_PRODUCTION=https://api.centertkani.ru
```

Удалите:
```env
VITE_API_URL=http://localhost:5001/api/v1  # Больше не нужно
```

## Важные примечания

1. **Strapi возвращает данные в формате `{ data: {...}, meta: {...} }`** - учитывайте это при обработке ответов
2. **JWT токен хранится в localStorage** и передается в заголовке `Authorization: Bearer <token>`
3. **Корзина привязана к пользователю** - требуется авторизация
4. **Заказы автоматически связываются с текущим пользователем** в Strapi
5. **URL плагинов:** `/api/delivery/*` и `/api/payments/*` (без префикса `plugin/`)
