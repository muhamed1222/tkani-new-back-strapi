'use strict';

module.exports = async ({ strapi }) => {
  // Регистрируем контроллер
  strapi.controller('plugin::delivery.delivery', require('./controllers/delivery'));
  
  // Регистрируем сервисы
  strapi.service('plugin::delivery.cdek', require('./services/cdek'));
  strapi.service('plugin::delivery.russian-post', require('./services/russian-post'));
  
  strapi.log.info('Delivery plugin registered');
};
