/**
 * Генерация уникального номера заказа
 * Формат: ORD-YYYY-NNNNN
 * Пример: ORD-2025-00001
 */
function generateOrderNumber() {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const sequence = String(random).padStart(5, '0');
  
  return `ORD-${year}-${sequence}`;
}

/**
 * Альтернативный вариант с автоинкрементом (если нужен порядковый номер)
 * Требует хранения последнего номера в базе или файле
 */
async function generateOrderNumberWithIncrement(strapi, year) {
  const currentYear = year || new Date().getFullYear();
  
  // Находим последний заказ за текущий год
  const lastOrder = await strapi.entityService.findMany('api::order.order', {
    filters: {
      order_number: {
        $contains: `ORD-${currentYear}-`,
      },
    },
    sort: { createdAt: 'desc' },
    limit: 1,
  });

  let sequence = 1;
  
  if (lastOrder && lastOrder.length > 0) {
    const lastNumber = lastOrder[0].order_number;
    const match = lastNumber.match(/ORD-\d{4}-(\d+)/);
    if (match) {
      sequence = parseInt(match[1], 10) + 1;
    }
  }

  const sequenceStr = String(sequence).padStart(5, '0');
  return `ORD-${currentYear}-${sequenceStr}`;
}

module.exports = {
  generateOrderNumber,
  generateOrderNumberWithIncrement,
};
