'use strict';

module.exports = {
  default: {
    providers: {
      cdek: {
        account: '',
        securePassword: '',
        apiUrl: 'https://api.cdek.ru/v2',
      },
      russianPost: {
        apiUrl: 'https://otpravka-api.pochta.ru',
        token: '',
        key: '',
      },
    },
  },
  validator: (config) => {
    // Validate configuration
    if (!config.providers) {
      throw new Error('Delivery providers configuration is required');
    }
  },
};
