'use strict';

module.exports = {
  async find(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const { query } = ctx;

      const notifications = await strapi.entityService.findMany('api::notification.notification', {
        filters: {
          user: user.id
        },
        sort: { createdAt: 'desc' },
        ...query
      });

      return {
        data: notifications
      };

    } catch (error) {
      console.error('❌ Ошибка получения уведомлений:', error);
      return ctx.badRequest('Ошибка получения уведомлений: ' + error.message);
    }
  },

  async findOne(ctx) {
    try {
      const user = ctx.state.user;
      const { id } = ctx.params;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const notification = await strapi.entityService.findOne('api::notification.notification', id, {
        populate: ['user']
      });

      if (!notification) {
        return ctx.notFound('Уведомление не найдено');
      }

      // Проверяем, что уведомление принадлежит пользователю
      if (notification.user.id !== user.id) {
        return ctx.forbidden('Доступ запрещен');
      }

      return {
        data: notification
      };

    } catch (error) {
      console.error('❌ Ошибка получения уведомления:', error);
      return ctx.badRequest('Ошибка получения уведомления: ' + error.message);
    }
  },

  async markAsRead(ctx) {
    try {
      const user = ctx.state.user;
      const { id } = ctx.params;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const notification = await strapi.entityService.findOne('api::notification.notification', id, {
        populate: ['user']
      });

      if (!notification) {
        return ctx.notFound('Уведомление не найдено');
      }

      // Проверяем, что уведомление принадлежит пользователю
      if (notification.user.id !== user.id) {
        return ctx.forbidden('Доступ запрещен');
      }

      // Помечаем как прочитанное
      const updatedNotification = await strapi.entityService.update('api::notification.notification', id, {
        data: {
          is_read: true
        }
      });

      return {
        data: updatedNotification
      };

    } catch (error) {
      console.error('❌ Ошибка обновления уведомления:', error);
      return ctx.badRequest('Ошибка обновления уведомления: ' + error.message);
    }
  },

  async markAllAsRead(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      // Находим все непрочитанные уведомления пользователя
      const unreadNotifications = await strapi.entityService.findMany('api::notification.notification', {
        filters: {
          user: user.id,
          is_read: false
        }
      });

      // Помечаем все как прочитанные
      const updatePromises = unreadNotifications.map(notification =>
        strapi.entityService.update('api::notification.notification', notification.id, {
          data: {
            is_read: true
          }
        })
      );

      await Promise.all(updatePromises);

      return {
        data: {
          message: `Помечено как прочитано: ${unreadNotifications.length} уведомлений`,
          count: unreadNotifications.length
        }
      };

    } catch (error) {
      console.error('❌ Ошибка массового обновления уведомлений:', error);
      return ctx.badRequest('Ошибка массового обновления уведомлений: ' + error.message);
    }
  },

  async getUnreadCount(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const count = await strapi.entityService.count('api::notification.notification', {
        filters: {
          user: user.id,
          is_read: false
        }
      });

      return {
        data: {
          count
        }
      };

    } catch (error) {
      console.error('❌ Ошибка получения количества уведомлений:', error);
      return ctx.badRequest('Ошибка получения количества уведомлений: ' + error.message);
    }
  },
  async create(ctx) {
    try {
      const user = ctx.state.user;
      const { data } = ctx.request.body;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const { title, message, type, order_id } = data;

      // Валидация
      if (!title || !message) {
        return ctx.badRequest('Заголовок и сообщение обязательны');
      }

      // Создаем уведомление
      const notification = await strapi.entityService.create('api::notification.notification', {
        data: {
          title,
          message,
          type: type || 'system',
          is_read: false,
          order_id: order_id || null,
          user: user.id
        }
      });

      console.log('✅ Создано уведомление:', notification.id);

      return {
        data: notification
      };

    } catch (error) {
      console.error('❌ Ошибка создания уведомления:', error);
      return ctx.badRequest('Ошибка создания уведомления: ' + error.message);
    }
  }
};