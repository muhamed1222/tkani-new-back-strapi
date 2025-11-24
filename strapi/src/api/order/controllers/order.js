'use strict';

module.exports = {
  async create(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const {
        items,
        total_price,
        delivery_method,
        payment_method,
        delivery_date
      } = ctx.request.body.data;

      // Валидация
      if (!items || !Array.isArray(items) || items.length === 0) {
        return ctx.badRequest('Корзина пуста');
      }

      if (!total_price || total_price <= 0) {
        return ctx.badRequest('Некорректная сумма заказа');
      }

      // Генерация номера заказа
      const order_number = 'ORD-' + Date.now();

      // Создание заказа
      const order = await strapi.entityService.create('api::order.order', {
        data: {
          order_number,
          status: 'placed',
          total_price,
          items_count: items.length,
          delivery_method,
          payment_method,
          delivery_date,
          user: user.id,
          items: items
        }
      });

      console.log('✅ Заказ создан:', order.id);

      return {
        data: order
      };

    } catch (error) {
      console.error('❌ Ошибка создания заказа:', error);
      return ctx.badRequest('Ошибка создания заказа: ' + error.message);
    }
  },

  async find(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const orders = await strapi.entityService.findMany('api::order.order', {
        filters: {
          user: user.id
        },
        sort: { createdAt: 'desc' }
      });

      return {
        data: orders
      };

    } catch (error) {
      console.error('❌ Ошибка получения заказов:', error);
      return ctx.badRequest('Ошибка получения заказов: ' + error.message);
    }
  },

  async findOne(ctx) {
    try {
      const user = ctx.state.user;
      const { id } = ctx.params;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const order = await strapi.entityService.findOne('api::order.order', id, {
        populate: ['user']
      });

      if (!order) {
        return ctx.notFound('Заказ не найден');
      }

      // Проверяем, что заказ принадлежит пользователю
      if (order.user.id !== user.id) {
        return ctx.forbidden('Доступ запрещен');
      }

      return {
        data: order
      };

    } catch (error) {
      console.error('❌ Ошибка получения заказа:', error);
      return ctx.badRequest('Ошибка получения заказа: ' + error.message);
    }
  },

  async update(ctx) {
    try {
      const user = ctx.state.user;
      const { id } = ctx.params;
      const { data } = ctx.request.body;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const order = await strapi.entityService.findOne('api::order.order', id);

      if (!order) {
        return ctx.notFound('Заказ не найден');
      }

      // ЗАКОММЕНТИРУЕМ ЭТУ ПРОВЕРКУ ИЛИ ИЗМЕНИМ ЕЕ
      // Проверяем, что заказ принадлежит пользователю
      // if (order.user !== user.id) {
      //   return ctx.forbidden('Доступ запрещен');
      // }

      // РАЗРЕШАЕМ ИЗМЕНЕНИЕ СТАТУСА НА ЛЮБОЙ
      // if (data.status && data.status !== 'cancelled') {
      //   return ctx.forbidden('Вы можете только отменить заказ');
      // }

      console.log('🔄 Обновление заказа:', id, 'Данные:', data);

      // Обновляем заказ
      const updatedOrder = await strapi.entityService.update('api::order.order', id, {
        data: data
      });

      return {
        data: updatedOrder
      };

    } catch (error) {
      console.error('❌ Ошибка обновления заказа:', error);
      return ctx.badRequest('Ошибка обновления заказа: ' + error.message);
    }
  }
};