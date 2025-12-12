// strapi/src/api/registration/routes/registration.js
'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/registration/register',
      handler: 'registration.register',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/registration/health',
      handler: 'registration.health',
      config: {
        auth: false,
      },
    }
  ],
};