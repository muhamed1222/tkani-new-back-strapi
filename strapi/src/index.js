'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap: async ({ strapi }) => {
    // Автовыдача публичных прав на чтение для основных коллекций
    const uidMap = [
      'api::product.product',
      'api::category.category',
      'api::brand.brand',
      'api::work.work',
    ];
    try {
      const rolesService = strapi.plugin('users-permissions').service('role');
      const publicRole = await rolesService.getRole('public');
      if (publicRole?.id) {
        const permissionsService = strapi.plugin('users-permissions').service('permission');
        const updates = [];
        for (const uid of uidMap) {
          // Разрешаем find и findOne
          for (const action of ['find', 'findOne']) {
            updates.push(
              permissionsService.updatePermission(publicRole.id, uid, action, { enabled: true })
            );
          }
        }
        await Promise.all(updates);
        strapi.log.info('Public permissions enabled for product/category/brand/work (find, findOne)');
      }
    } catch (e) {
      strapi.log.warn(`Failed to set public permissions automatically: ${e?.message || e}`);
    }
  },
};

