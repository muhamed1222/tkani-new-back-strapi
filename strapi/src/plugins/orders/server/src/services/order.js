'use strict';

module.exports = ({ strapi }) => ({
  /**
   * Вычисление общей стоимости заказа
   */
  calculateTotal(order) {
    if (!order.items || !Array.isArray(order.items)) {
      return 0;
    }

    return order.items.reduce((total, item) => {
      const itemPrice = item.price || 0;
      const itemQuantity = item.quantity || 0;
      return total + itemPrice * itemQuantity;
    }, 0);
  },

  /**
   * Подсчет количества товаров в заказе
   */
  calculateItemsCount(order) {
    if (!order.items || !Array.isArray(order.items)) {
      return 0;
    }

    return order.items.reduce((count, item) => {
      return count + (item.quantity || 0);
    }, 0);
  },

  /**
   * Генерация номера заказа
   */
  generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  },

  /**
   * Обновление totals заказа
   */
  async updateOrderTotals(orderId) {
    const order = await strapi.entityService.findOne('api::order.order', orderId, {
      populate: ['items'],
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const totalPrice = this.calculateTotal(order);
    const itemsCount = this.calculateItemsCount(order);

    return await strapi.entityService.update('api::order.order', orderId, {
      data: {
        total_price: totalPrice,
        items_count: itemsCount,
      },
    });
  },

  /**
   * Поиск заказов с фильтрами
   */
  async search(filters = {}, sort = { createdAt: 'desc' }, pagination = {}) {
    const { page = 1, pageSize = 25 } = pagination;
    const start = (page - 1) * pageSize;
    const limit = pageSize;

    const orders = await strapi.entityService.findMany('api::order.order', {
      filters,
      sort,
      start,
      limit,
      populate: ['user', 'items'],
    });

    const total = await strapi.entityService.count('api::order.order', {
      filters,
    });

    return {
      data: orders,
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total,
      },
    };
  },
});
