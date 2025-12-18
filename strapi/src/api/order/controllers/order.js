'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

// Валидные значения для enum полей
const VALID_ORDER_STATUSES = ['new', 'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'canceled'];
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
 * Нормализует данные заказа перед валидацией
 */
function normalizeOrderData(data) {
  const normalized = { ...data };

  // Нормализуем order_status
  if (normalized.order_status !== undefined) {
    normalized.order_status = normalizeEnum(normalized.order_status, VALID_ORDER_STATUSES, 'new');
  }

  // Нормализуем payment_status
  if (normalized.payment_status !== undefined) {
    normalized.payment_status = normalizeEnum(normalized.payment_status, VALID_PAYMENT_STATUSES, 'unpaid');
  }

  // Нормализуем payment_method
  if (normalized.payment_method !== undefined) {
    normalized.payment_method = normalizeEnum(normalized.payment_method, VALID_PAYMENT_METHODS, 'cash');
  }

  // Нормализуем delivery_type
  if (normalized.delivery_type !== undefined) {
    normalized.delivery_type = normalizeEnum(normalized.delivery_type, VALID_DELIVERY_TYPES, 'pickup');
  }

  // Нормализуем delivery_method
  if (normalized.delivery_method !== undefined && normalized.delivery_method !== null && normalized.delivery_method !== '') {
    normalized.delivery_method = normalizeEnum(normalized.delivery_method, VALID_DELIVERY_METHODS, null);
  } else if (normalized.delivery_method === '' || normalized.delivery_method === null) {
    // Если пустая строка или null, удаляем поле (необязательное)
    delete normalized.delivery_method;
  }

  return normalized;
}

/**
 * Извлекает данные из различных форматов Strapi
 */
function extractDataFromRequest(requestBody) {
  // 1. Формат админ-панели Strapi 5: { data: { attributes: {...}, ... } }
  if (requestBody.data && requestBody.data.attributes) {
    console.log('📥 Формат: Strapi 5 Admin Panel (data.attributes)');
    return requestBody.data.attributes;
  }

  // 2. Формат API Strapi 5: { data: {...} }
  else if (requestBody.data && typeof requestBody.data === 'object') {
    console.log('📥 Формат: Strapi 5 API (data)');
    return requestBody.data;
  }

  // 3. Прямой формат (старый или фронтенд)
  else if (requestBody && typeof requestBody === 'object') {
    console.log('📥 Формат: Прямой объект');
    return requestBody;
  }

  // 4. Неизвестный формат
  console.error('❌ Неизвестный формат данных:', requestBody);
  return {};
}

module.exports = createCoreController('api::order.order', ({ strapi }) => ({

  async create(ctx) {
    try {
      const requestBody = ctx.request.body;
      console.log('🔍 CREATE ORDER REQUEST BODY:', JSON.stringify(requestBody, null, 2));

      const data = extractDataFromRequest(requestBody);

      if (!data || Object.keys(data).length === 0) {
        return ctx.badRequest('Неверный формат данных');
      }

      console.log('📦 Извлеченные данные:', data);

      // Валидация обязательных полей
      if (!data.customer_name || !data.customer_phone || !data.customer_email) {
        return ctx.badRequest('Необходимо указать имя, телефон и email клиента');
      }

      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return ctx.badRequest('Заказ должен содержать минимум один товар');
      }

      // Генерация order_number, если его нет
      if (!data.order_number) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 9).toUpperCase();
        data.order_number = `ORDER-${timestamp}-${randomStr}`;
        console.log('🔢 Сгенерирован номер заказа:', data.order_number);
      }

      // Связываем с пользователем, если авторизован
      if (ctx.state.user) {
        data.user = ctx.state.user.id;
      }

      // Нормализуем enum поля
      const normalizedData = normalizeOrderData(data);

      // Убедимся, что есть обязательные поля статусов
      if (!normalizedData.order_status) {
        normalizedData.order_status = 'new';
      }
      if (!normalizedData.payment_status) {
        normalizedData.payment_status = 'unpaid';
      }

      console.log('✅ Данные после нормализации:', JSON.stringify(normalizedData, null, 2));

      const order = await strapi.entityService.create('api::order.order', {
        data: normalizedData,
        populate: {
          items: {
            populate: {
              product: {
                populate: ['image', 'category'],
              },
            },
          },
          user: true,
        },
      });

      console.log(`✅ Заказ создан: ${order.order_number} (ID: ${order.id})`);
      console.log(`📊 Order_status: ${order.order_status}`);

      return {
        data: order,
      };
    } catch (error) {
      console.error('❌ Ошибка создания заказа:', error);
      return ctx.badRequest('Ошибка создания заказа: ' + error.message);
    }
  },

  async update(ctx) {
    try {
      const { id } = ctx.params;
      const requestBody = ctx.request.body;

      console.log('🔍 UPDATE REQUEST для заказа:', id);
      console.log('📦 Полное тело запроса:', JSON.stringify(requestBody, null, 2));

      const dataToUpdate = extractDataFromRequest(requestBody);

      console.log('📦 Извлеченные данные для обновления:', dataToUpdate);

      if (!dataToUpdate || Object.keys(dataToUpdate).length === 0) {
        return ctx.badRequest('Нет данных для обновления');
      }

      // Нормализуем данные
      const normalizedData = normalizeOrderData(dataToUpdate);

      console.log('✅ Данные после нормализации:', normalizedData);

      // Ищем заказ
      let existingOrder;
      if (isNaN(id)) {
        existingOrder = await strapi.db.query('api::order.order').findOne({
          where: { documentId: id }
        });
      } else {
        existingOrder = await strapi.entityService.findOne('api::order.order', id);
      }

      if (!existingOrder) {
        return ctx.notFound('Заказ не найден');
      }

      // Обновляем заказ
      const updatedOrder = await strapi.entityService.update('api::order.order', existingOrder.id, {
        data: normalizedData,
        populate: {
          items: {
            populate: {
              product: {
                populate: ['image', 'category'],
              },
            },
          },
          user: true,
        },
      });

      console.log(`✅ Заказ обновлен: ${updatedOrder.order_number}`);
      console.log(`📊 Новый order_status: ${updatedOrder.order_status}`);

      return {
        data: updatedOrder,
      };
    } catch (error) {
      console.error('❌ Ошибка обновления заказа:', error);
      console.error('❌ Детали ошибки:', error.message);
      return ctx.badRequest('Ошибка обновления заказа: ' + error.message);
    }
  },

  async find(ctx) {
    try {
      const { query } = ctx;
      const user = ctx.state.user;

      const filters = {};

      if (user && !user.isAdmin) {
        filters.user = user.id;
      }

      // Фильтр по order_status
      if (query.filters?.order_status) {
        filters.order_status = query.filters.order_status;
      }

      if (query.filters?.payment_status) {
        filters.payment_status = query.filters.payment_status;
      }

      const sort = query.sort || { createdAt: 'desc' };
      const page = parseInt(query.pagination?.page) || 1;
      const pageSize = parseInt(query.pagination?.pageSize) || 25;
      const start = (page - 1) * pageSize;
      const limit = pageSize;

      const orders = await strapi.entityService.findMany('api::order.order', {
        filters,
        sort,
        start,
        limit,
        populate: {
          items: {
            populate: {
              product: {
                populate: ['image', 'category'],
              },
            },
          },
          user: true,
        },
      });

      const total = await strapi.entityService.count('api::order.order', {
        filters,
      });

      return {
        data: orders,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(total / pageSize),
            total,
          },
        },
      };
    } catch (error) {
      strapi.log.error('❌ Ошибка получения заказов:', error);
      return ctx.badRequest('Ошибка получения заказов: ' + error.message);
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;

      let order;

      if (isNaN(id)) {
        order = await strapi.db.query('api::order.order').findOne({
          where: { documentId: id },
          populate: {
            items: {
              populate: {
                product: {
                  populate: ['image', 'category'],
                },
              },
            },
            user: true,
          },
        });
      } else {
        order = await strapi.entityService.findOne('api::order.order', id, {
          populate: {
            items: {
              populate: {
                product: {
                  populate: ['image', 'category'],
                },
              },
            },
            user: true,
          },
        });
      }

      if (!order) {
        return ctx.notFound('Заказ не найден');
      }

      return {
        data: order,
      };
    } catch (error) {
      strapi.log.error('❌ Ошибка получения заказа:', error);
      return ctx.badRequest('Ошибка получения заказа: ' + error.message);
    }
  },

  async delete(ctx) {
    try {
      const { id } = ctx.params;
      const user = ctx.state.user;

      const existingOrder = await strapi.entityService.findOne('api::order.order', id);

      if (!existingOrder) {
        return ctx.notFound('Заказ не найден');
      }

      if (user && !user.isAdmin && existingOrder.user?.id !== user.id) {
        return ctx.forbidden('Доступ запрещен');
      }

      await strapi.entityService.delete('api::order.order', id);

      strapi.log.info(`🗑️ Заказ удален: ${existingOrder.order_number} (ID: ${id})`);

      return {
        data: { id },
      };
    } catch (error) {
      strapi.log.error('❌ Ошибка удаления заказа:', error);
      return ctx.badRequest('Ошибка удаления заказа: ' + error.message);
    }
  }
}));