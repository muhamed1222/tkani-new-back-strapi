'use strict';

module.exports = async ({ strapi }) => {
  // SEO компонент уже добавлен к Product и Category через schema.json
  const contentTypes = ['api::product.product', 'api::category.category'];

  for (const contentType of contentTypes) {
    try {
      const model = strapi.contentTypes[contentType];
      if (!model) {
        strapi.log.warn(`Content type ${contentType} not found for SEO`);
        continue;
      }

      // SEO компонент будет добавлен через schema.json
      strapi.log.info(`SEO enabled for ${contentType}`);
    } catch (error) {
      strapi.log.error(`Failed to enable SEO for ${contentType}:`, error);
    }
  }
};
