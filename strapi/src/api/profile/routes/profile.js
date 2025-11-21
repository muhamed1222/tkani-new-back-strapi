'use strict';

module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/profile',
      handler: 'profile.update',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          strategies: ['jwt'],
          scope: ['authenticated']
        }
      }
    },
    {
      method: 'GET',
      path: '/profile/check',
      handler: 'profile.checkAuth',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          strategies: ['jwt'],
          scope: ['authenticated']
        }
      }
    }
  ]
};