'use strict';

/**
 * Миграция для удаления поля status и добавления/проверки order_status
 */
module.exports = {
  async up(knex) {
    // Проверяем, существует ли поле status
    const hasStatusColumn = await knex.schema.hasColumn('orders', 'status');

    // Проверяем, существует ли поле order_status
    const hasOrderStatusColumn = await knex.schema.hasColumn('orders', 'order_status');

    // Если есть status, копируем данные в order_status и удаляем status
    if (hasStatusColumn) {
      console.log('🔄 Обнаружено поле status, переносим данные в order_status...');

      // Сначала добавляем order_status если его нет
      if (!hasOrderStatusColumn) {
        await knex.schema.table('orders', (table) => {
          table.string('order_status').defaultTo('new');
        });
        console.log('✅ Поле order_status добавлено');
      }

      // Копируем данные из status в order_status
      await knex.raw(`
        UPDATE orders 
        SET order_status = status 
        WHERE order_status IS NULL OR order_status = ''
      `);
      console.log('✅ Данные скопированы из status в order_status');

      // Удаляем старое поле status
      await knex.schema.table('orders', (table) => {
        table.dropColumn('status');
      });
      console.log('🗑️ Поле status удалено');
    } else if (!hasOrderStatusColumn) {
      // Если нет ни status, ни order_status - добавляем order_status
      await knex.schema.table('orders', (table) => {
        table.string('order_status').defaultTo('new');
      });
      console.log('✅ Поле order_status добавлено (status не существовало)');
    } else {
      console.log('ℹ️ Поле order_status уже существует, status не существует');
    }
  },

  async down(knex) {
    // Восстанавливаем поле status и копируем данные обратно
    const hasStatusColumn = await knex.schema.hasColumn('orders', 'status');
    const hasOrderStatusColumn = await knex.schema.hasColumn('orders', 'order_status');

    if (!hasStatusColumn && hasOrderStatusColumn) {
      // Добавляем status
      await knex.schema.table('orders', (table) => {
        table.string('status').defaultTo('new');
      });
      console.log('✅ Поле status добавлено обратно');

      // Копируем данные из order_status в status
      await knex.raw(`
        UPDATE orders 
        SET status = order_status 
        WHERE status IS NULL OR status = ''
      `);
      console.log('✅ Данные скопированы из order_status в status');
    }

    // Оставляем order_status для обратной совместимости
    console.log('ℹ️ Поле order_status оставлено для обратной совместимости');
  }
};