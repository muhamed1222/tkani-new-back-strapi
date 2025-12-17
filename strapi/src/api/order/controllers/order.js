'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({

  async create(ctx) {
    try {
      const requestBody = ctx.request.body;
      console.log('🔍 CREATE ORDER REQUEST BODY:', JSON.stringify(requestBody, null, 2));

      // --- ИСПРАВЛЕНИЕ: обрабатываем оба формата данных ---
      let data;

      // 1. Формат с "data" (новый)
      if (requestBody.data && typeof requestBody.data === 'object') {
        data = requestBody.data;
      }
      // 2. Простой формат (старый)
      else if (requestBody && typeof requestBody === 'object') {
        data = requestBody;
      } else {
        return ctx.badRequest('Неизвестный формат данных');
      }

      console.log('📦 Данные после обработки:', data);

      // Валидация обязательных полей
      if (!data.customer_name || !data.customer_phone || !data.customer_email) {
        return ctx.badRequest('Необходимо указать имя, телефон и email клиента');
      }

      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return ctx.badRequest('Заказ должен содержать минимум один товар');
      }

      // --- ВАЖНОЕ ИСПРАВЛЕНИЕ: Генерация order_number ---
      if (!data.order_number) {
        // Генерируем уникальный номер
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 9).toUpperCase();
        data.order_number = `ORDER-${timestamp}-${randomStr}`;
        console.log('🔢 Сгенерирован номер заказа:', data.order_number);
      }

      // Связываем с пользователем, если авторизован
      if (ctx.state.user) {
        data.user = ctx.state.user.id;
      }

      // Убедимся, что есть обязательные поля статусов
      if (!data.status) {
        data.status = 'new';
      }
      if (!data.payment_status) {
        data.payment_status = 'unpaid';
      }

      const order = await strapi.entityService.create('api::order.order', {
        data,
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

      console.log('🔍 UPDATE REQUEST RAW BODY:', JSON.stringify(requestBody, null, 2));

      // --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: обрабатываем оба формата ---
      let dataToUpdate;

      // 1. Новый формат Strapi 5: данные в свойстве "data"
      if (requestBody.data && typeof requestBody.data === 'object') {
        dataToUpdate = requestBody.data;
      }
      // 2. Простой формат: данные напрямую в теле запроса
      else if (requestBody && typeof requestBody === 'object') {
        dataToUpdate = requestBody;
      }
      // 3. Старый формат Strapi 4: данные в "data.attributes"
      else if (requestBody.data && requestBody.data.attributes) {
        dataToUpdate = requestBody.data.attributes;
      } else {
        return ctx.badRequest('Неизвестный формат данных');
      }
      // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

      console.log('📦 Данные для обновления после обработки:', dataToUpdate);

      if (!dataToUpdate || Object.keys(dataToUpdate).length === 0) {
        return ctx.badRequest('Данные для обновления отсутствуют');
      }

      // Ищем заказ (ваш существующий код)
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

      // Обновляем заказ с обработанными данными
      const updatedOrder = await strapi.entityService.update('api::order.order', existingOrder.id, {
        data: dataToUpdate, // ← ВАЖНО: используем обработанные данные
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

      console.log(`✅ Заказ обновлен: ${updatedOrder.order_number}, новый статус: ${updatedOrder.status}`);
      return {
        data: updatedOrder,
      };
    } catch (error) {
      console.error('❌ Ошибка обновления заказа:', error);
      return ctx.badRequest('Ошибка обновления заказа: ' + error.message);
    }
  },
  async find(ctx) {
    try {
      const { query } = ctx;
      const user = ctx.state.user;

      // Фильтры
      const filters = {};

      // Если пользователь не админ, показываем только его заказы
      if (user && !user.isAdmin) {
        filters.user = user.id;
      }

      // Фильтр по статусу
      if (query.filters?.status) {
        filters.status = query.filters.status;
      }

      // Фильтр по payment_status
      if (query.filters?.payment_status) {
        filters.payment_status = query.filters.payment_status;
      }

      // Сортировка
      const sort = query.sort || { createdAt: 'desc' };

      // Пагинация
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

      // Проверяем, является ли id documentId (строка) или числовым ID
      let order;

      // Если id не число, ищем по documentId
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
        // Если id число, ищем по числовому ID
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

      // Проверка прав доступа
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