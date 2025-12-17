'use strict';

module.exports = {
  /**
   * Перед созданием заказа
   */
  async beforeCreate(event) {
    const { data } = event.params;

    console.log('🔍 Lifecycle beforeCreate:', {
      hasItems: !!data.items,
      itemsLength: data.items?.length,
      total_price_provided: data.total_price,
      delivery_price: data.delivery_price,
      status: data.status
    });

    // Генерация order_number, если не указан
    if (!data.order_number) {
      data.order_number = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Установка created_at, если не указан
    if (!data.created_at) {
      data.created_at = new Date();
    }

    // Если статус не указан или невалидный, устанавливаем 'new'
    if (!data.status || !['new', 'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'canceled'].includes(data.status)) {
      data.status = 'new';
      console.log('🔄 Установлен статус по умолчанию: new');
    }

    // Расчет total для каждого item
    if (data.items && Array.isArray(data.items)) {
      console.log('🔍 Расчет totals для items:');
      for (const item of data.items) {
        if (item.total !== undefined) {
          console.log(`  Item: meters=${item.meters}, price_per_meter=${item.price_per_meter}, total=${item.total} (уже установлен)`);
        }
        else if (item.meters && item.price_per_meter) {
          item.total = parseFloat((item.meters * item.price_per_meter).toFixed(2));
          console.log(`  Item: meters=${item.meters}, price_per_meter=${item.price_per_meter}, total=${item.total} (рассчитан)`);
        } else {
          console.log(`  Item: недостаточно данных для расчета total`, item);
        }
      }
    }

    // Расчет total_price заказа
    const calculatedTotal = calculateTotalPrice(data);
    console.log('🔍 Итоговый total_price:', {
      calculated: calculatedTotal,
      provided: data.total_price,
      willUse: data.total_price || calculatedTotal
    });

    if (!data.total_price || data.total_price === 0) {
      data.total_price = calculatedTotal;
    }
  },

  /**
   * После создания заказа
   */
  async afterCreate(event) {
    const { result } = event;
    console.log(`✅ Заказ создан: ${result.order_number} (ID: ${result.id}), total_price: ${result.total_price}, status: ${result.status}`);
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;

    console.log('🔍 Lifecycle beforeUpdate DEEPLOG:', {
      data: JSON.stringify(data),
      where: JSON.stringify(where),
      action: event.action,
      model: event.model?.uid,
      hasStatus: data?.status !== undefined,
      statusValue: data?.status,
      dataKeys: Object.keys(data || {})
    });

    // ВАЖНОЕ ИЗМЕНЕНИЕ: Если статус не отправлен, находим текущий заказ и добавляем его статус
    if (!data.status) {
      console.log('⚠️ Статус не отправлен в данных! Ищем текущий заказ...');

      try {
        // Находим текущий заказ
        const existingOrder = await strapi.db.query('api::order.order').findOne({
          where: where
        });

        if (existingOrder && existingOrder.status) {
          console.log('🔄 Добавляем текущий статус:', existingOrder.status);
          data.status = existingOrder.status;
        } else {
          console.log('🔄 Устанавливаем статус по умолчанию: new');
          data.status = 'new';
        }
      } catch (error) {
        console.error('❌ Ошибка при поиске заказа:', error);
        data.status = 'new';
      }
    }

    // Запрещаем изменение order_number
    if (data.order_number !== undefined) {
      delete data.order_number;
    }

    // Валидация статуса
    if (data.status) {
      const validStatuses = ['new', 'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'canceled'];
      if (!validStatuses.includes(data.status)) {
        console.log(`⚠️ Некорректный статус в lifecycle: ${data.status}, устанавливаем 'new'`);
        data.status = 'new';
      } else {
        console.log(`✅ Lifecycle: Статус валидный: ${data.status}`);
      }
    }

    // Пересчет total для каждого item
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.meters && item.price_per_meter) {
          item.total = parseFloat((item.meters * item.price_per_meter).toFixed(2));
        }
      }
    }

    // Если обновляем items или delivery_price, пересчитываем total_price
    if (data.items || data.delivery_price !== undefined) {
      const calculatedTotal = calculateTotalPrice(data);

      if (!data.total_price || data.total_price === 0) {
        data.total_price = calculatedTotal;
      }
    }
  },

  /**
   * После обновления заказа
   */
  async afterUpdate(event) {
    const { result } = event;
    console.log(`✅ Lifecycle afterUpdate: Заказ ${result.order_number} обновлен, статус: ${result.status}`);
  }
};

/**
 * Вспомогательная функция для расчета total_price
 * Возвращает значение, но не изменяет data напрямую
 */
function calculateTotalPrice(data) {
  if (!data.items || !Array.isArray(data.items)) {
    console.log('🔍 calculateTotalPrice: нет items, возвращаем delivery_price или 0');
    return parseFloat(data.delivery_price) || 0;
  }

  // Сумма total всех items
  const itemsTotal = data.items.reduce((sum, item) => {
    const itemTotal = item.total || 0;
    console.log(`🔍 Item total: ${itemTotal} (meters: ${item.meters}, price_per_meter: ${item.price_per_meter})`);
    return sum + itemTotal;
  }, 0);

  // Добавляем стоимость доставки
  const deliveryPrice = parseFloat(data.delivery_price) || 0;
  const finalTotal = parseFloat((itemsTotal + deliveryPrice).toFixed(2));

  console.log('🔍 calculateTotalPrice результат:', {
    itemsTotal,
    deliveryPrice,
    finalTotal
  });

  return finalTotal;
}