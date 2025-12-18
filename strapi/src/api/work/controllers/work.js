// strapi/src/api/work/controllers/work.js
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::work.work', ({ strapi }) => ({
  async find(ctx) {
    console.log('🔍 Custom find method called');

    try {
      const populateConfig = {
        images: true,
        fabrics: {
          populate: ['image']
        }
      };

      console.log('🧵 Populate config:', populateConfig);

      const entities = await strapi.entityService.findMany('api::work.work', {
        ...this.sanitizeQuery(ctx),
        populate: populateConfig
      });

      console.log(`✅ Found ${entities.length} works`);

      // Используем кастомный sanitizeOutput
      const sanitizedResults = await this.customSanitizeOutput(entities, ctx);
      return this.customTransformResponse(sanitizedResults);

    } catch (error) {
      console.error('❌ Error in custom find:', error);
      return ctx.internalServerError('Error finding works');
    }
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    console.log('🔍 Custom findOne called for ID:', id);

    try {
      const populateConfig = {
        images: true,
        fabrics: {
          populate: ['image']
        }
      };

      console.log('🧵 Populate config:', populateConfig);

      const entity = await strapi.entityService.findOne('api::work.work', id, {
        ...this.sanitizeQuery(ctx),
        populate: populateConfig
      });

      if (!entity) {
        console.log('❌ Work not found');
        return ctx.notFound('Work not found');
      }

      console.log('✅ Work found');

      // Используем кастомный sanitizeOutput
      const sanitizedEntity = await this.customSanitizeOutput(entity, ctx);
      return this.customTransformResponse(sanitizedEntity);

    } catch (error) {
      console.error('❌ Error in custom findOne:', error);
      return ctx.internalServerError('Error finding work');
    }
  },

  // Кастомный sanitizeOutput который не удаляет fabrics
  async customSanitizeOutput(data, ctx) {
    const sanitizedData = await this.sanitizeOutput(data, ctx);

    // Если это массив работ, сохраняем fabrics для каждой
    if (Array.isArray(data)) {
      return data.map((item, index) => ({
        ...sanitizedData[index],
        fabrics: item.fabrics || []
      }));
    }

    // Если это одна работа, сохраняем fabrics
    return {
      ...sanitizedData,
      fabrics: data.fabrics || []
    };
  },

  // Кастомный transformResponse который сохраняет структуру
  customTransformResponse(data, meta = {}) {
    if (Array.isArray(data)) {
      return {
        data: data.map(item => this.formatEntity(item)),
        meta
      };
    }

    return {
      data: this.formatEntity(data),
      meta
    };
  },

  // Форматируем сущность с сохранением изображений тканей
  formatEntity(entity) {
    if (!entity) return null;

    // Форматируем изображения работы
    const formattedImages = (entity.images || []).map(img => ({
      id: img.id,
      documentId: img.documentId,
      name: img.name,
      url: img.url,
      formats: img.formats
    }));

    // Форматируем ткани с их изображениями
    const formattedFabrics = (entity.fabrics || []).map(fabric => {
      const formattedFabric = {
        id: fabric.id,
        documentId: fabric.documentId,
        title: fabric.title,
        description: fabric.description,
        price: fabric.price,
        stock: fabric.stock,
        article: fabric.article,
        discount_price: fabric.discount_price,
        discount: fabric.discount,
        composition: fabric.composition,
        width: fabric.width,
        density: fabric.density,
        country: fabric.country,
        createdAt: fabric.createdAt,
        updatedAt: fabric.updatedAt,
        publishedAt: fabric.publishedAt
      };

      // Добавляем изображение если есть
      if (fabric.image) {
        formattedFabric.image = {
          id: fabric.image.id,
          documentId: fabric.image.documentId,
          name: fabric.image.name,
          url: fabric.image.url,
          formats: fabric.image.formats,
          // Можно добавить другие нужные поля
        };
      }

      return formattedFabric;
    });

    return {
      id: entity.id,
      documentId: entity.documentId,
      title: entity.title,
      description: entity.description,
      link: entity.link,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      publishedAt: entity.publishedAt,
      images: formattedImages,
      fabrics: formattedFabrics
    };
  }
}));