'use strict';

// Валидные значения для enum полей
const VALID_STATUSES = ['new', 'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'canceled'];
const VALID_PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed'];
const VALID_PAYMENT_METHODS = ['card', 'cash', 'invoice', 'yookassa', 'cloudpayments'];
const VALID_DELIVERY_TYPES = ['pickup', 'delivery'];
const VALID_DELIVERY_METHODS = ['pickup', 'russian_post', 'cdek', 'ozon'];

/**
 * Нормализует значение enum поля
 */
function normalizeEnum(value, validValues, defaultValue) {
  if (!value || typeof value !== 'string') {
    return defaultValue;
  }

  // Убираем пробелы и приводим к нижнему регистру
  const normalized = value.trim().toLowerCase();

  // Проверяем точное совпадение
  if (validValues.includes(normalized)) {
    return normalized;
  }

  // Пробуем найти похожее значение (без подчеркиваний, с заменой пробелов)
  const normalizedWithoutUnderscore = normalized.replace(/_/g, '');
  for (const valid of validValues) {
    const validNormalized = valid.replace(/_/g, '');
    if (validNormalized === normalizedWithoutUnderscore) {
      return valid;
    }
  }

  // Если не найдено, возвращаем значение по умолчанию
  return defaultValue;
}

/**
 * Нормализует данные заказа в body запроса
 */
function normalizeOrderDataInBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  // Обрабатываем формат { data: { ... } }
  if (body.data && typeof body.data === 'object') {
    const data = body.data;
    
    // Нормализуем status
    if (data.status !== undefined && data.status !== null) {
      data.status = normalizeEnum(data.status, VALID_STATUSES, 'new');
    }

    // Нормализуем payment_status
    if (data.payment_status !== undefined && data.payment_status !== null) {
      data.payment_status = normalizeEnum(data.payment_status, VALID_PAYMENT_STATUSES, 'unpaid');
    }

    // Нормализуем payment_method
    if (data.payment_method !== undefined && data.payment_method !== null) {
      data.payment_method = normalizeEnum(data.payment_method, VALID_PAYMENT_METHODS, 'cash');
    }

    // Нормализуем delivery_type
    if (data.delivery_type !== undefined && data.delivery_type !== null) {
      data.delivery_type = normalizeEnum(data.delivery_type, VALID_DELIVERY_TYPES, 'pickup');
    }

    // Нормализуем delivery_method
    if (data.delivery_method !== undefined && data.delivery_method !== null && data.delivery_method !== '') {
      data.delivery_method = normalizeEnum(data.delivery_method, VALID_DELIVERY_METHODS, null);
    } else if (data.delivery_method === '' || data.delivery_method === null) {
      delete data.delivery_method;
    }
  } else {
    // Обрабатываем прямой формат { ... }
    if (body.status !== undefined && body.status !== null) {
      body.status = normalizeEnum(body.status, VALID_STATUSES, 'new');
    }

    if (body.payment_status !== undefined && body.payment_status !== null) {
      body.payment_status = normalizeEnum(body.payment_status, VALID_PAYMENT_STATUSES, 'unpaid');
    }

    if (body.payment_method !== undefined && body.payment_method !== null) {
      body.payment_method = normalizeEnum(body.payment_method, VALID_PAYMENT_METHODS, 'cash');
    }

    if (body.delivery_type !== undefined && body.delivery_type !== null) {
      body.delivery_type = normalizeEnum(body.delivery_type, VALID_DELIVERY_TYPES, 'pickup');
    }

    if (body.delivery_method !== undefined && body.delivery_method !== null && body.delivery_method !== '') {
      body.delivery_method = normalizeEnum(body.delivery_method, VALID_DELIVERY_METHODS, null);
    } else if (body.delivery_method === '' || body.delivery_method === null) {
      delete body.delivery_method;
    }
  }

  return body;
}

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Применяем только к запросам к заказам
    if (ctx.request.url.includes('/api/orders') || ctx.request.url.includes('/api/order')) {
      // Нормализуем body только для POST и PUT запросов
      if (ctx.request.method === 'POST' || ctx.request.method === 'PUT' || ctx.request.method === 'PATCH') {
        if (ctx.request.body) {
          const originalBody = JSON.parse(JSON.stringify(ctx.request.body));
          ctx.request.body = normalizeOrderDataInBody(ctx.request.body);
          
          // Логируем изменения для отладки
          if (JSON.stringify(originalBody) !== JSON.stringify(ctx.request.body)) {
            strapi.log.info('🔧 Order enum normalizer: данные нормализованы', {
              original: originalBody,
              normalized: ctx.request.body
            });
          }
        }
      }
    }

    await next();
  };
};
