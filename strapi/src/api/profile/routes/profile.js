// strapi/src/api/profile/routes/profile.js
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
          scope: ['authenticated']
        }
      }
    },
    {
      method: 'DELETE',
      path: '/profile',
      handler: 'profile.deleteAccount',
      config: {
        policies: [],
        middlewares: [],
        auth: {
          scope: ['authenticated']
        }
      }
    }
  ]
};