'use strict';

module.exports = {
  routes: [
    { method: 'GET', path: '/works', handler: 'work.find', config: { auth: false } },
    { method: 'GET', path: '/works/:id', handler: 'work.findOne', config: { auth: false } },
  ],
};


