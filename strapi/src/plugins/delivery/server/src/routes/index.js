'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/delivery/calculate',
      handler: 'delivery.calculate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/delivery/cdek/points',
      handler: 'delivery.getPoints',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
