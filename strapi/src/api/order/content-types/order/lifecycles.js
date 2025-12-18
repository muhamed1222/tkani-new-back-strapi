'use strict';

// Валидные значения для order_status
const VALID_ORDER_STATUSES = ['new', 'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'canceled'];

/**
 * Нормализует значение order_status
 */
function normalizeOrderStatus(value, defaultValue = 'new') {
  if (!value || typeof value !== 'string') {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  // Проверяем точное совпадение
  if (VALID_ORDER_STATUSES.includes(normalized)) {
    return normalized;
  }

  // Пробуем найти похожее значение (без подчеркиваний)
  const normalizedWithoutUnderscore = normalized.replace(/_/g, '');
  for (const valid of VALID_ORDER_STATUSES) {
    const validNormalized = valid.replace(/_/g, '');
    if (validNormalized === normalizedWithoutUnderscore) {
      return valid;
    }
  }

  return defaultValue;
}

module.exports = {
  async beforeCreate(event) {
    console.log('\n🎯 LIFECYCLE beforeCreate запущен!');
    const { data } = event.params;

    // Нормализуем order_status при создании
    if (data.order_status !== undefined) {
      const original = data.order_status;
      data.order_status = normalizeOrderStatus(data.order_status);
      console.log(`🔧 Order_status при создании: "${original}" → "${data.order_status}"`);
    }
  },

  async beforeUpdate(event) {
    console.log('\n🎯 LIFECYCLE beforeUpdate запущен!');
    const { data, where } = event.params;

    console.log('📦 Данные для обновления:', data);
    console.log('🔍 Where:', where);

    // Нормализуем order_status если он есть в данных
    if (data && data.order_status !== undefined) {
      const original = data.order_status;
      const normalized = normalizeOrderStatus(data.order_status);
      data.order_status = normalized;
      console.log(`🔧 Order_status нормализован: "${original}" → "${normalized}"`);
    }
  },

  async afterUpdate(event) {
    console.log('\n✅ LIFECYCLE afterUpdate завершен!');
    const { result } = event;
    console.log(`📝 Заказ ${result.order_number} обновлен`);
    console.log(`📊 Order_status: ${result.order_status}`);
  }
};