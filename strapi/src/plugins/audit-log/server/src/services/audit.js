'use strict';

module.exports = ({ strapi }) => ({
  async log({ action, contentType, contentId, userId, userEmail, changes, previousData, newData, ip, userAgent }) {
    try {
      const auditLog = await strapi.entityService.create('plugin::audit-log.audit-log', {
        data: {
          action,
          contentType,
          contentId,
          userId,
          userEmail,
          changes,
          previousData,
          newData,
          ip: ip || null,
          userAgent: userAgent || null,
          publishedAt: new Date(),
        },
      });

      return auditLog;
    } catch (error) {
      strapi.log.error('Failed to create audit log:', error);
      throw error;
    }
  },

  async find(filters = {}) {
    try {
      const auditLogs = await strapi.entityService.findMany('plugin::audit-log.audit-log', {
        filters,
        sort: { createdAt: 'desc' },
        populate: ['userId'],
      });

      return auditLogs;
    } catch (error) {
      strapi.log.error('Failed to find audit logs:', error);
      throw error;
    }
  },

  async findOne(id) {
    try {
      const auditLog = await strapi.entityService.findOne('plugin::audit-log.audit-log', id, {
        populate: ['userId'],
      });

      return auditLog;
    } catch (error) {
      strapi.log.error('Failed to find audit log:', error);
      throw error;
    }
  },
});
