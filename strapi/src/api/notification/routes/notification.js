'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/notifications',
      handler: 'notification.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/notifications',
      handler: 'notification.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/notifications/:id',
      handler: 'notification.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/notifications/:id/read',
      handler: 'notification.markAsRead',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/notifications/read-all',
      handler: 'notification.markAllAsRead',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/notifications/unread/count',
      handler: 'notification.getUnreadCount',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ]
};