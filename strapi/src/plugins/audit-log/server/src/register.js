'use strict';

module.exports = async ({ strapi }) => {
  // Content type будет зарегистрирован автоматически через schema.json
  strapi.log.info('Audit Log plugin registered');
};
