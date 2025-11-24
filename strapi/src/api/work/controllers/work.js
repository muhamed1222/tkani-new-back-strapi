// strapi/src/api/work/controllers/work.js
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::work.work', ({ strapi }) => ({
  async findOne(ctx) {
    const { id } = ctx.params;

    console.log('🔍 Finding work by ID:', id);

    try {
      // Пробуем найти по documentId (новый формат Strapi)
      let entity = await strapi.db.query('api::work.work').findOne({
        where: { documentId: id },
        populate: ['image']
      });

      // Если не нашли по documentId, пробуем по id (старый формат)
      if (!entity) {
        entity = await strapi.db.query('api::work.work').findOne({
          where: { id: id },
          populate: ['image']
        });
      }

      // Если не нашли по id, пробуем числовой id
      if (!entity && !isNaN(id)) {
        entity = await strapi.db.query('api::work.work').findOne({
          where: { id: parseInt(id) },
          populate: ['image']
        });
      }

      if (!entity) {
        console.log('❌ Work not found for ID:', id);
        return ctx.notFound('Work not found');
      }

      console.log('✅ Work found:', entity.id, entity.documentId, entity.title);

      // Преобразуем в формат ответа Strapi
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);

    } catch (error) {
      console.error('❌ Error finding work:', error);
      return ctx.internalServerError('Error finding work');
    }
  },

  async find(ctx) {
    try {
      console.log('🔍 Finding all works with populate');

      // Используем прямой запрос к базе с populate для получения изображений
      const entities = await strapi.db.query('api::work.work').findMany({
        where: {
          publishedAt: { $notNull: true } // Только опубликованные
        },
        populate: ['image'], // Важно: populate для изображений
        orderBy: { createdAt: 'desc' }
      });

      console.log(`✅ Found ${entities.length} works`);

      const sanitizedResults = await this.sanitizeOutput(entities, ctx);

      return this.transformResponse(sanitizedResults);

    } catch (error) {
      console.error('❌ Error finding works:', error);
      return ctx.internalServerError('Error finding works');
    }
  }
}));