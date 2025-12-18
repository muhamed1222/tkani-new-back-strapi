'use strict';

module.exports = ({ strapi }) => ({
  async getMetaTags(ctx) {
    try {
      const { contentType, id } = ctx.params;
      const { query } = ctx;

      let entity;
      if (contentType === 'product') {
        entity = await strapi.entityService.findOne('api::product.product', id, {
          populate: ['image', 'category'],
        });
      } else if (contentType === 'category') {
        entity = await strapi.entityService.findOne('api::category.category', id);
      } else {
        return ctx.badRequest('Invalid content type');
      }

      if (!entity) {
        return ctx.notFound('Entity not found');
      }

      const seoService = strapi.plugin('seo').service('seo');
      const metaTags = seoService.generateMetaTags({
        metaTitle: entity.seo?.metaTitle || entity.title || entity.name,
        metaDescription: entity.seo?.metaDescription || entity.description,
        ogTitle: entity.seo?.ogTitle || entity.title || entity.name,
        ogDescription: entity.seo?.ogDescription || entity.description,
        ogImage: entity.seo?.ogImage?.url || entity.image?.url,
        canonicalUrl: query.url,
      });

      // Добавляем JSON-LD схему
      let jsonLd = null;
      if (contentType === 'product') {
        jsonLd = seoService.generateProductSchema(entity);
      } else if (contentType === 'category') {
        jsonLd = seoService.generateCategorySchema(entity);
      }

      ctx.body = {
        meta: metaTags,
        jsonLd,
      };
    } catch (error) {
      ctx.throw(500, error);
    }
  },
});
