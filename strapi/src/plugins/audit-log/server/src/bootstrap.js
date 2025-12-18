'use strict';

module.exports = async ({ strapi }) => {
  // Конфигурация через переменные окружения или дефолтные значения
  const contentTypes = [
    'api::product.product',
    'api::category.category',
    'api::order.order',
    'plugin::users-permissions.user',
  ];

  // Подписка на события жизненного цикла для отслеживания изменений
  const auditService = strapi.plugin('audit-log').service('audit');

  // Регистрируем хуки для каждого content type
  for (const contentType of contentTypes) {
    try {
      const model = strapi.contentTypes[contentType];
      if (!model) {
        strapi.log.warn(`Content type ${contentType} not found for audit logging`);
        continue;
      }

      // Hook на создание
      strapi.db.lifecycles.subscribe({
        models: [model.collectionName],
        async afterCreate(event) {
          try {
            const ctx = strapi.requestContext.get();
            await auditService.log({
              action: 'create',
              contentType,
              contentId: event.result.id,
              newData: event.result,
              userId: ctx?.state?.user?.id,
              userEmail: ctx?.state?.user?.email,
              ip: ctx?.request?.ip,
              userAgent: ctx?.request?.headers?.['user-agent'],
            });
          } catch (error) {
            strapi.log.error('Error logging audit:', error);
          }
        },
      });

      // Hook на обновление
      strapi.db.lifecycles.subscribe({
        models: [model.collectionName],
        async afterUpdate(event) {
          try {
            const ctx = strapi.requestContext.get();
            await auditService.log({
              action: 'update',
              contentType,
              contentId: event.result.id,
              previousData: event.params.where,
              newData: event.result,
              userId: ctx?.state?.user?.id,
              userEmail: ctx?.state?.user?.email,
              ip: ctx?.request?.ip,
              userAgent: ctx?.request?.headers?.['user-agent'],
            });
          } catch (error) {
            strapi.log.error('Error logging audit:', error);
          }
        },
      });

      // Hook на удаление
      strapi.db.lifecycles.subscribe({
        models: [model.collectionName],
        async afterDelete(event) {
          try {
            const ctx = strapi.requestContext.get();
            await auditService.log({
              action: 'delete',
              contentType,
              contentId: event.result.id,
              previousData: event.result,
              userId: ctx?.state?.user?.id,
              userEmail: ctx?.state?.user?.email,
              ip: ctx?.request?.ip,
              userAgent: ctx?.request?.headers?.['user-agent'],
            });
          } catch (error) {
            strapi.log.error('Error logging audit:', error);
          }
        },
      });

      strapi.log.info(`Audit logging enabled for ${contentType}`);
    } catch (error) {
      strapi.log.error(`Failed to enable audit logging for ${contentType}:`, error);
    }
  }
};
