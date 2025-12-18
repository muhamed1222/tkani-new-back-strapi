'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/forgot-password/send-code',
      handler: 'forgot-password.sendCode',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/forgot-password/reset',
      handler: 'forgot-password.resetPassword',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    }
  ],
};