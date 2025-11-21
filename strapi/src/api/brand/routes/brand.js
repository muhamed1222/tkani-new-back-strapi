'use strict';

module.exports = {
  routes: [
    { method: 'GET', path: '/brands', handler: 'brand.find', config: { auth: false } },
    { method: 'GET', path: '/brands/:id', handler: 'brand.findOne', config: { auth: false } },
  ],
};


