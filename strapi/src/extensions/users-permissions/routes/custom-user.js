'use strict';

module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/user/personal-info',
      handler: 'custom-user.updatePersonalInfo',
      config: {
        prefix: '',
        policies: []
      }
    },
    {
      method: 'PUT',
      path: '/user/email',
      handler: 'custom-user.updateEmail',
      config: {
        prefix: '',
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/user/profile',
      handler: 'custom-user.getProfile',
      config: {
        prefix: '',
        policies: []
      }
    }
  ]
};