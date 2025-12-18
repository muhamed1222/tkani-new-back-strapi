'use strict';

module.exports = {
  routes: [
    // ============================================
    // ОСНОВНЫЕ API РОУТЫ ДЛЯ ФРОНТЕНДА И АДМИНКИ
    // ============================================

    // Получение списка заказов
    {
      method: 'GET',
      path: '/orders',
      handler: 'order.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // Получение одного заказа
    {
      method: 'GET',
      path: '/orders/:id',
      handler: 'order.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // Создание заказа
    {
      method: 'POST',
      path: '/orders',
      handler: 'order.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // Обновление заказа (полное обновление)
    {
      method: 'PUT',
      path: '/orders/:id',
      handler: 'order.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // Удаление заказа
    {
      method: 'DELETE',
      path: '/orders/:id',
      handler: 'order.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },

    // ============================================
    // АЛИАСЫ ДЛЯ СОВМЕСТИМОСТИ
    // ============================================

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
  ]
};