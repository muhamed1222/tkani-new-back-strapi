'use strict';

module.exports = ({ strapi }) => ({
  async find(ctx) {
    try {
      const { query } = ctx;
      const auditLogs = await strapi
        .plugin('audit-log')
        .service('audit')
        .find(query.filters || {});

      ctx.body = auditLogs;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      const auditLog = await strapi
        .plugin('audit-log')
        .service('audit')
        .findOne(id);

      if (!auditLog) {
        return ctx.notFound('Audit log not found');
      }

      ctx.body = auditLog;
    } catch (error) {
      ctx.throw(500, error);
    }
  },
});
