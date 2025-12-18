'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/orders/search',
      handler: 'order.search',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/orders/:id/status',
      handler: 'order.updateStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/orders/:id/totals',
      handler: 'order.updateTotals',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
