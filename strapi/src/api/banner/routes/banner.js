'use strict';

module.exports = {
  routes: [
    { method: 'GET', path: '/banners', handler: 'banner.find', config: { auth: false } },
    { method: 'GET', path: '/banners/:id', handler: 'banner.findOne', config: { auth: false } },
  ],
};
