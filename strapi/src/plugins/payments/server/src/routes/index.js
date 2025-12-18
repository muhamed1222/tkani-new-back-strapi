'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/payments/init',
      handler: 'payment.init',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/payments/:provider/:paymentId/status',
      handler: 'payment.checkStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/payments/yookassa/webhook',
      handler: 'payment.yookassaWebhook',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/payments/cloudpayments/webhook',
      handler: 'payment.cloudpaymentsWebhook',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
