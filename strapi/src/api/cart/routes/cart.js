'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/cart',
      handler: 'cart.getCart',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/cart/add',
      handler: 'cart.addToCart',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/cart/update',
      handler: 'cart.updateCart',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/cart/remove',
      handler: 'cart.removeFromCart',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/cart/clear',
      handler: 'cart.clearCart',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ]
};