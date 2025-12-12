'use strict';

module.exports = ({ strapi }) => ({
  async search(ctx) {
    try {
      const { query } = ctx;
      const { filters = {}, sort = { createdAt: 'desc' }, pagination = {} } = query;

      const orderService = strapi.plugin('orders').service('order');
      const results = await orderService.search(filters, sort, pagination);

      ctx.body = results;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  async updateStatus(ctx) {
    try {
      const { id } = ctx.params;
      const { status } = ctx.request.body;

      const pluginConfig = strapi.config.get('plugin.orders');
      const allowedStatuses = pluginConfig?.statuses || [];

      if (!allowedStatuses.includes(status)) {
        return ctx.badRequest(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`);
      }

      const order = await strapi.entityService.update('api::order.order', id, {
        data: { status },
      });

      ctx.body = order;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  async updateTotals(ctx) {
    try {
      const { id } = ctx.params;

      const orderService = strapi.plugin('orders').service('order');
      const order = await orderService.updateOrderTotals(id);

      ctx.body = order;
    } catch (error) {
      ctx.throw(500, error);
    }
  },
});
