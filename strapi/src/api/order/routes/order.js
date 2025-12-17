'use strict';

module.exports = {
  routes: [
    // Стандартные Content API роуты для админки
    {
      method: 'GET',
      path: '/order',
      handler: 'order.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/order/:id',
      handler: 'order.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/order',
      handler: 'order.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/order/:id',
      handler: 'order.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/order/:id',
      handler: 'order.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // Content Manager API роуты для админки - ТОЛЬКО ЭТИ ДВА!
    // Они нужны для работы админки Strapi
    {
      method: 'GET',
      path: '/content-manager/collection-types/order/:id',
      handler: 'order.contentManagerFindOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/content-manager/collection-types/order/:id',
      handler: 'order.contentManagerUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // Ваши кастомные роуты для фронтенда
    {
      method: 'POST',
      path: '/orders',
      handler: 'order.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/orders',
      handler: 'order.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/orders/:id',
      handler: 'order.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PATCH',
      path: '/orders/:id',
      handler: 'order.update',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ]
};