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

  async update(ctx) {
    try {
      const { id } = ctx.params;
      const requestBody = ctx.request.body;

      console.log('🔍 UPDATE REQUEST:', {
        id,
        requestBody,
        fullRequest: ctx.request.body
      });

      // Админка Strapi отправляет: { status: 'processing' }
      // Ваш API ожидает: { data: { status: 'processing' } }
      // Поддерживаем оба формата
      let data;

      if (requestBody && requestBody.data !== undefined) {
        // Формат 1: { data: { status: 'processing' } }
        data = requestBody.data;
        console.log('📦 Используем данные из data:', data);
      } else {
        // Формат 2: { status: 'processing' }
        data = requestBody;
        console.log('📦 Используем данные напрямую:', data);
      }

      // Проверяем, что data не undefined
      if (!data) {
        console.log('⚠️ Данные для обновления отсутствуют');
        return ctx.badRequest('Данные для обновления отсутствуют');
      }

      let existingOrder;

      // Ищем заказ по documentId или числовому ID
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

      // ОСОБЕННО ВАЖНО: Если статус не отправлен, сохраняем текущий статус!
      if (data.status === undefined) {
        console.log('⚠️ Status не отправлен в запросе, сохраняем текущий:', existingOrder.status);
        data.status = existingOrder.status; // ← сохраняем текущий статус
      }

      // Валидация статуса (теперь data.status точно определен)
      if (data.status) {
        const validStatuses = ['new', 'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'canceled'];
        if (!validStatuses.includes(data.status)) {
          return ctx.badRequest(`Неверный статус. Допустимые значения: ${validStatuses.join(', ')}`);
        }
      }

      // Запрещаем изменение order_number
      if (data.order_number) {
        delete data.order_number;
      }

      // Обновляем заказ
      const updateId = existingOrder.id;

      console.log('🔄 Обновляем заказ с ID:', updateId, 'данные:', data);

      const updatedOrder = await strapi.entityService.update('api::order.order', updateId, {
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

      strapi.log.info(`✅ Заказ обновлен: ${updatedOrder.order_number} (ID: ${updateId}), новый статус: ${data.status}`);

      return {
        data: updatedOrder,
      };
    } catch (error) {
      console.error('❌ Полная ошибка обновления заказа:', error);
      strapi.log.error('❌ Ошибка обновления заказа:', error.message, error.stack);
      return ctx.badRequest('Ошибка обновления заказа: ' + error.message);
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
  },

  async contentManagerFindOne(ctx) {
    try {
      const { id } = ctx.params;
      console.log('🔍 Content Manager FindOne для ID:', id);

      // Ищем заказ
      let order = await strapi.db.query('api::order.order').findOne({
        where: {
          $or: [
            { documentId: id },
            { order_number: id }
          ]
        },
        populate: '*'
      });

      if (!order) {
        console.log('⚠️ Заказ не найден, ищем по числовому ID');
        order = await strapi.entityService.findOne('api::order.order', id, {
          populate: '*'
        });
      }

      if (!order) {
        return ctx.notFound('Заказ не найден');
      }

      // Если статус пустой, устанавливаем 'new'
      if (!order.status || order.status === '' || order.status === 'Choose here') {
        console.log('🔄 Статус пустой, устанавливаем "new"');

        // Обновляем в базе данных
        await strapi.entityService.update('api::order.order', order.id, {
          data: { status: 'new' }
        });

        // Обновляем локальный объект
        order.status = 'new';
      }

      console.log('📋 Возвращаемый статус:', order.status);

      return order;
    } catch (error) {
      console.error('❌ Ошибка Content Manager FindOne:', error);
      return ctx.badRequest('Ошибка получения заказа: ' + error.message);
    }
  },

  async contentManagerUpdate(ctx) {
    try {
      const { id } = ctx.params;
      const data = ctx.request.body;

      console.log('🔍 Content Manager Update для ID:', id);
      console.log('📦 Полученные данные:', data);
      console.log('🔍 Есть ли статус в данных?', 'status' in data);

      // Ищем заказ
      let existingOrder = await strapi.db.query('api::order.order').findOne({
        where: {
          $or: [
            { documentId: id },
            { order_number: id }
          ]
        },
        populate: '*'  // Добавьте populate чтобы получить полные данные
      });

      if (!existingOrder) {
        console.log('⚠️ Заказ не найден, ищем по числовому ID');
        existingOrder = await strapi.entityService.findOne('api::order.order', id, {
          populate: '*'
        });
      }

      if (!existingOrder) {
        return ctx.notFound('Заказ не найден');
      }

      console.log('📋 Текущий статус заказа:', existingOrder.status);

      // ВАЖНОЕ ИЗМЕНЕНИЕ: Всегда добавляем статус в данные для обновления
      // Если статус не отправлен, используем текущий
      // Если отправлен, используем отправленный (после валидации)

      let statusToUpdate;

      if (data.status === undefined) {
        // Статус не отправлен - используем текущий
        console.log('🔄 Статус не отправлен, используем текущий:', existingOrder.status);
        statusToUpdate = existingOrder.status;
      } else if (data.status === 'Choose here' || data.status === '') {
        // Пустой статус - используем текущий
        console.log('🔄 Статус пустой, используем текущий:', existingOrder.status);
        statusToUpdate = existingOrder.status;
      } else {
        // Статус отправлен - валидируем и используем
        console.log('🔄 Используем отправленный статус:', data.status);
        statusToUpdate = data.status;
      }

      // Валидация статуса
      const validStatuses = ['new', 'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'canceled'];
      if (!validStatuses.includes(statusToUpdate)) {
        return ctx.badRequest(`Неверный статус. Допустимые значения: ${validStatuses.join(', ')}`);
      }

      // Подготавливаем данные для обновления
      const updateData = {
        ...data,
        status: statusToUpdate  // Всегда добавляем статус
      };

      // Запрещаем изменение order_number
      if (updateData.order_number) {
        delete updateData.order_number;
      }

      console.log('📤 Данные для отправки в entityService:', updateData);

      // Обновляем заказ
      const updatedOrder = await strapi.entityService.update('api::order.order', existingOrder.id, {
        data: updateData,
        populate: '*'
      });

      console.log(`✅ Content Manager: Заказ ${updatedOrder.order_number} обновлен, статус: ${updatedOrder.status}`);

      return updatedOrder;
    } catch (error) {
      console.error('❌ Ошибка Content Manager Update:', error);
      return ctx.badRequest('Ошибка обновления заказа: ' + error.message);
    }
  },

  async contentManagerCreate(ctx) {
    try {
      const data = ctx.request.body;
      console.log('🔍 Content Manager Create:', JSON.stringify(data, null, 2));

      // Просто используем стандартный метод create
      ctx.request.body = { data };
      return await this.create(ctx);
    } catch (error) {
      console.error('❌ Ошибка Content Manager Create:', error);
      return ctx.badRequest('Ошибка создания заказа: ' + error.message);
    }
  },

  async contentManagerDelete(ctx) {
    try {
      const { id } = ctx.params;
      console.log('🔍 Content Manager Delete для ID:', id);

      // Просто используем стандартный метод delete
      return await this.delete(ctx);
    } catch (error) {
      console.error('❌ Ошибка Content Manager Delete:', error);
      return ctx.badRequest('Ошибка удаления заказа: ' + error.message);
    }
  },

  async previewUrl(ctx) {
    try {
      const { documentId, locale, status } = ctx.query;

      console.log('🔍 Preview URL запрос:', { documentId, locale, status });

      // Просто возвращаем фиктивный URL для превью
      return {
        url: `/orders/${documentId}`,
        published: status === 'published'
      };
    } catch (error) {
      console.error('❌ Ошибка Preview URL:', error);
      return ctx.badRequest('Ошибка получения превью: ' + error.message);
    }
  },
}));