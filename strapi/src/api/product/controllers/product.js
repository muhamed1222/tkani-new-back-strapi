// strapi/src/api/product/controllers/product.js
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::product.product', ({ strapi }) => ({
  async find(ctx) {
    try {
      const { query } = ctx;

      console.log('🔍 Product find query:', query);

      // Строим фильтры для Strapi v4
      const filters = {};

      // Обрабатываем фильтр по категории
      if (query['filters[category][id][$eq]']) {
        const categoryId = parseInt(query['filters[category][id][$eq]']);
        console.log('🎯 Filtering by category ID:', categoryId);
        filters.category = { id: { $eq: categoryId } };
      }

      console.log('🔍 Final filters for query:', filters);

      const entities = await strapi.entityService.findMany('api::product.product', {
        filters,
        populate: {
          image: true,
          images: true,
          category: {
            fields: ['id', 'name', 'slug']
          }
        },
        publicationState: 'live'
      });

      console.log(`🔍 Found ${entities.length} products with current filters`);

      // Формат для фронтенда
      return {
        data: entities,
        meta: {
          pagination: {
            page: 1,
            pageSize: entities.length,
            pageCount: 1,
            total: entities.length
          }
        }
      };
    } catch (error) {
      console.error('❌ Product find error:', error);
      ctx.throw(500, error);
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;

      console.log('🔍 Product findOne ID:', id);

      const entity = await strapi.entityService.findOne('api::product.product', id, {
        populate: {
          image: true,
          images: true,
          category: {
            fields: ['id', 'name', 'slug']
          }
        }
      });

      console.log('🔍 Found product:', entity);

      if (!entity) {
        console.log('❌ Product not found with ID:', id);
        return ctx.notFound('Product not found');
      }

      // Формат для фронтенда
      return {
        data: entity
      };
    } catch (error) {
      console.error('❌ Product findOne error:', error);
      ctx.throw(500, error);
    }
  }
}));