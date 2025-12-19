// strapi/src/api/order/routes/public-order.js
'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/orders/public/create',
      handler: 'public-order.createPublicOrder',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ]
};