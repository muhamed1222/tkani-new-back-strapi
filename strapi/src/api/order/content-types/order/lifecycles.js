/**
 * Lifecycle hooks для модели Order
 * Автоматически:
 * - Генерирует order_number при создании
 * - Рассчитывает total для каждого order-item
 * - Рассчитывает total_price заказа
 */

const { generateOrderNumber } = require('../../../../utils/generateOrderNumber');

module.exports = {
  /**
   * Перед созданием заказа
   */
  async beforeCreate(event) {
    const { data } = event.params;

    // 1. Генерация order_number, если не указан
    if (!data.order_number) {
      data.order_number = await generateOrderNumber(event.params.strapi);
    }

    // 2. Установка created_at, если не указан
    if (!data.created_at) {
      data.created_at = new Date();
    }

    // 3. Расчет total для каждого item
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.meters && item.price_per_meter) {
          item.total = parseFloat((item.meters * item.price_per_meter).toFixed(2));
        }
      }
    }

    // 4. Расчет total_price заказа
    calculateTotalPrice(data);
  },

  /**
   * После создания заказа
   */
  async afterCreate(event) {
    const { result } = event;
    event.params.strapi.log.info(`✅ Заказ создан: ${result.order_number} (ID: ${result.id})`);

    // Отправка Telegram-уведомления
    try {
      // Импортируем утилиты для отправки Telegram-уведомлений
      const { sendTelegramMessage } = require('../../../../utils/telegram');
      const { generateOrderMessage } = require('../../../../utils/telegramMessage');

      // Получаем заказ с populated relations для корректного формирования сообщения
      const orderWithRelations = await event.params.strapi.entityService.findOne(
        'api::order.order',
        result.id,
        {
          populate: {
            items: {
              populate: {
                product: {
                  fields: ['title'],
                },
              },
            },
          },
        }
      );

      if (orderWithRelations) {
        const message = generateOrderMessage(orderWithRelations);

        // Получаем список активных получателей уведомлений
        const recipients = await event.params.strapi.entityService.findMany(
          'api::notification-recipient.notification-recipient',
          {
            filters: { is_active: true },
          }
        );

        // Отправляем уведомление каждому получателю
        if (recipients && recipients.length > 0) {
          for (const recipient of recipients) {
            try {
              await sendTelegramMessage(recipient.telegram_chat_id, message);
            } catch (error) {
              // Логируем ошибку для конкретного получателя, но продолжаем отправку остальным
              console.error(`Ошибка отправки уведомления получателю ${recipient.name} (${recipient.telegram_chat_id}):`, error);
            }
          }
        }
      }
    } catch (error) {
      // Логируем ошибку, но не прерываем выполнение
      event.params.strapi.log.error('Ошибка отправки Telegram-уведомления:', error);
    }
  },

  /**
   * Перед обновлением заказа
   */
  async beforeUpdate(event) {
    const { data } = event.params;

    // 1. Запрещаем изменение order_number
    if (data.order_number !== undefined) {
      delete data.order_number;
    }

    // 2. Пересчет total для каждого item (если изменились meters или price_per_meter)
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.meters && item.price_per_meter) {
          item.total = parseFloat((item.meters * item.price_per_meter).toFixed(2));
        }
      }
    }

    // 3. Пересчет total_price заказа
    // Если обновляются items или delivery_price, нужно пересчитать total_price
    if (data.items || data.delivery_price !== undefined) {
      // Получаем текущий заказ для расчета с учетом существующих данных
      const existingOrder = await event.params.strapi.entityService.findOne(
        'api::order.order',
        event.params.where.id,
        { populate: ['items'] }
      );

      if (existingOrder) {
        // Используем обновленные items или существующие
        const itemsToCalculate = data.items || existingOrder.items || [];
        
        // Пересчитываем total для всех items
        const recalculatedItems = itemsToCalculate.map((item) => {
          if (item.meters && item.price_per_meter) {
            return {
              ...item,
              total: parseFloat((item.meters * item.price_per_meter).toFixed(2)),
            };
          }
          return item;
        });

        // Рассчитываем total_price
        const itemsTotal = recalculatedItems.reduce(
          (sum, item) => sum + (item.total || 0),
          0
        );
        const deliveryPrice = data.delivery_price !== undefined 
          ? parseFloat(data.delivery_price) || 0 
          : (existingOrder.delivery_price || 0);
        
        data.total_price = parseFloat((itemsTotal + deliveryPrice).toFixed(2));
      } else {
        // Если заказа нет, рассчитываем только из data
        calculateTotalPrice(data);
      }
    }
  },

  /**
   * После обновления заказа
   */
  async afterUpdate(event) {
    const { result } = event;
    event.params.strapi.log.info(`✅ Заказ обновлен: ${result.order_number} (ID: ${result.id})`);
  },
};

/**
 * Вспомогательная функция для расчета total_price
 */
function calculateTotalPrice(data) {
  if (!data.items || !Array.isArray(data.items)) {
    data.total_price = data.delivery_price || 0;
    return;
  }

  // Сумма total всех items
  const itemsTotal = data.items.reduce(
    (sum, item) => sum + (item.total || 0),
    0
  );

  // Добавляем стоимость доставки
  const deliveryPrice = parseFloat(data.delivery_price) || 0;
  data.total_price = parseFloat((itemsTotal + deliveryPrice).toFixed(2));
}

