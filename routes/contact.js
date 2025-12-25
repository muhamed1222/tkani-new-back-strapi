'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/contact/send',
      handler: 'contact-message.send',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};