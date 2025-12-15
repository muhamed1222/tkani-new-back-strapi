'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
  async create(ctx) {
    try {
      const { data } = ctx.request.body;

      // Валидация обязательных полей
      if (!data.customer_name || !data.customer_phone || !data.customer_email) {
        return ctx.badRequest('Необходимо указать имя, телефон и email клиента');
      }

      // Если указаны firstName и lastName, формируем полное имя (с учетом отчества)
      if (data.customer_firstName && data.customer_lastName && !data.customer_name) {
        const nameParts = [data.customer_firstName, data.customer_middleName, data.customer_lastName].filter(Boolean);
        data.customer_name = nameParts.join(' ').trim();
      }

      // Устанавливаем delivery_type на основе delivery_method
      if (data.delivery_method && !data.delivery_type) {
        data.delivery_type = data.delivery_method === 'pickup' ? 'pickup' : 'delivery';
      }

      // Валидация адреса доставки (если не самовывоз)
      if (data.delivery_type === 'delivery' && data.delivery_method !== 'pickup') {
        if (!data.delivery_address || !data.delivery_city || !data.delivery_postcode) {
          return ctx.badRequest('Для доставки необходимо указать адрес, город и почтовый индекс');
        }
      }

      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return ctx.badRequest('Заказ должен содержать минимум один товар');
      }

      // Валидация и нормализация items
      for (const item of data.items) {
        if (!item.product) {
          return ctx.badRequest('Каждый товар должен иметь связь с продуктом');
        }

        // Поддержка обоих форматов: quantity/price и meters/price_per_meter
        if (item.quantity !== undefined && !item.meters) {
          // Преобразуем quantity в meters (для совместимости)
          item.meters = parseFloat(item.quantity) || 1;
        }

        if (item.price !== undefined && !item.price_per_meter) {
          // Преобразуем price в price_per_meter
          item.price_per_meter = parseFloat(item.price) || 0;
        }

        if (!item.meters || item.meters < 0.1) {
          return ctx.badRequest('Метраж должен быть не менее 0.1');
        }
        if (!item.price_per_meter || item.price_per_meter <= 0) {
          return ctx.badRequest('Цена за метр должна быть больше 0');
        }
      }

      // Устанавливаем значения по умолчанию
      if (!data.status) {
        data.status = 'new';
      }
      if (!data.payment_status) {
        data.payment_status = 'unpaid';
      }
      if (data.delivery_price === undefined) {
        data.delivery_price = 0;
      }

      // Связываем с пользователем, если авторизован
      if (ctx.state.user) {
        data.user = ctx.state.user.id;
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

      strapi.log.info(`✅ Заказ создан: ${order.order_number} (ID: ${order.id})`);

      return {
        data: order,
      };
    } catch (error) {
      strapi.log.error('❌ Ошибка создания заказа:', error);
      return ctx.badRequest('Ошибка создания заказа: ' + error.message);
    }
  },

  /**
   * Получение списка заказов
   */
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

  /**
   * Получение одного заказа
   */
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      const user = ctx.state.user;

      const order = await strapi.entityService.findOne('api::order.order', id, {
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

      if (!order) {
        return ctx.notFound('Заказ не найден');
      }

      // Проверка прав доступа (если не админ, только свои заказы)
      if (user && !user.isAdmin && order.user?.id !== user.id) {
        return ctx.forbidden('Доступ запрещен');
      }

      return {
        data: order,
      };
    } catch (error) {
      strapi.log.error('❌ Ошибка получения заказа:', error);
      return ctx.badRequest('Ошибка получения заказа: ' + error.message);
    }
  },

  /**
   * Обновление заказа
   * Автоматически пересчитывает totals при изменении items
   */
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      const user = ctx.state.user;

      const existingOrder = await strapi.entityService.findOne('api::order.order', id);

      if (!existingOrder) {
        return ctx.notFound('Заказ не найден');
      }

      // Проверка прав доступа
      if (user && !user.isAdmin && existingOrder.user?.id !== user.id) {
        return ctx.forbidden('Доступ запрещен');
      }

      // Валидация items, если они обновляются
      if (data.items && Array.isArray(data.items)) {
        if (data.items.length === 0) {
          return ctx.badRequest('Заказ должен содержать минимум один товар');
        }

        for (const item of data.items) {
          if (!item.product) {
            return ctx.badRequest('Каждый товар должен иметь связь с продуктом');
          }

          // Поддержка обоих форматов: quantity/price и meters/price_per_meter
          if (item.quantity !== undefined && !item.meters) {
            item.meters = parseFloat(item.quantity) || 1;
          }

          if (item.price !== undefined && !item.price_per_meter) {
            item.price_per_meter = parseFloat(item.price) || 0;
          }

          if (!item.meters || item.meters < 0.1) {
            return ctx.badRequest('Метраж должен быть не менее 0.1');
          }
          if (!item.price_per_meter || item.price_per_meter <= 0) {
            return ctx.badRequest('Цена за метр должна быть больше 0');
          }
        }
      }

      // Запрещаем изменение order_number
      if (data.order_number) {
        delete data.order_number;
      }

      // Запрещаем прямое изменение total_price (он пересчитывается автоматически)
      if (data.total_price && !data.items && !data.delivery_price) {
        delete data.total_price;
      }

      // Lifecycle hooks автоматически пересчитают totals

      const updatedOrder = await strapi.entityService.update('api::order.order', id, {
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

      strapi.log.info(`✅ Заказ обновлен: ${updatedOrder.order_number} (ID: ${id})`);

      return {
        data: updatedOrder,
      };
    } catch (error) {
      strapi.log.error('❌ Ошибка обновления заказа:', error);
      return ctx.badRequest('Ошибка обновления заказа: ' + error.message);
    }
  },
}));
