'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap: async ({ strapi }) => {
    // Автовыдача публичных прав на чтение для основных коллекций
    const uidMap = [
      'api::product.product',
      'api::category.category',
      'api::work.work',
      'api::banner.banner',
    ];
    try {
      const rolesService = strapi.plugin('users-permissions').service('role');
      const publicRole = await rolesService.getRole('public');
      if (publicRole?.id) {
        const permissionsService = strapi.plugin('users-permissions').service('permission');
        const updates = [];
        for (const uid of uidMap) {
          // Разрешаем find и findOne
          for (const action of ['find', 'findOne']) {
            updates.push(
              permissionsService.updatePermission(publicRole.id, uid, action, { enabled: true })
            );
          }
        }
        await Promise.all(updates);
        strapi.log.info('✅ Public permissions enabled for product/category/work/banner (find, findOne)');
        strapi.log.info('✅ Public permissions enabled for cart (find, findOne, create, update) - для неавторизованных пользователей');
      }
    } catch (e) {
      strapi.log.warn(`Failed to set public permissions automatically: ${e?.message || e}`);
    }

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
          data.order_number = await generateOrderNumber(strapi);
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
  },
};

