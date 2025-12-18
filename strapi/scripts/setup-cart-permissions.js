/**
 * Скрипт для настройки публичных permissions для корзины
 * Запуск: node scripts/setup-cart-permissions.js
 */

const strapi = require('@strapi/strapi');

async function setupCartPermissions() {
  const app = await strapi({ 
    distDir: './dist',
    autoReload: false,
    serveAdminPanel: false,
  }).load();

  try {
    const rolesService = app.plugin('users-permissions').service('role');
    const publicRole = await rolesService.getRole('public');
    
    if (!publicRole?.id) {
      console.error('❌ Public role not found!');
      process.exit(1);
    }

    console.log('✅ Found public role:', publicRole.id);

    const permissionsService = app.plugin('users-permissions').service('permission');
    const cartUid = 'api::cart.cart';
    
    // Настраиваем стандартные permissions для cart
    const actions = ['find', 'findOne', 'create', 'update'];
    const updates = [];

    for (const action of actions) {
      try {
        await permissionsService.updatePermission(publicRole.id, cartUid, action, { enabled: true });
        console.log(`✅ Enabled ${action} for cart`);
      } catch (error) {
        console.error(`❌ Failed to enable ${action}:`, error.message);
      }
    }

    console.log('✅ Cart permissions configured successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up permissions:', error);
    process.exit(1);
  } finally {
    await app.destroy();
  }
}

setupCartPermissions();

