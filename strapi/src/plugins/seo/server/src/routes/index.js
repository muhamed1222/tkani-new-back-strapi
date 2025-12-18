'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/seo/:contentType/:id',
      handler: 'seo.getMetaTags',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
