'use strict';

module.exports = ({ strapi }) => ({
  /**
   * Инициализация платежа
   */
  async init(ctx) {
    try {
      const { orderId, provider, returnUrl } = ctx.request.body;

      if (!orderId || !provider) {
        return ctx.badRequest('orderId and provider are required');
      }

      // Получаем заказ
      const order = await strapi.entityService.findOne('api::order.order', orderId, {
        populate: ['user', 'items'],
      });

      if (!order) {
        return ctx.notFound('Order not found');
      }

      const paymentService = strapi.plugin('payments').service('payment');
      let result;

      if (provider === 'yookassa') {
        result = await paymentService.initYooKassaPayment(
          orderId,
          parseFloat(order.total_price),
          `Оплата заказа #${order.order_number}`,
          returnUrl || `${strapi.config.get('server.url')}/payment/return`
        );
      } else if (provider === 'cloudpayments') {
        result = await paymentService.initCloudPaymentsPayment(
          orderId,
          parseFloat(order.total_price),
          `Оплата заказа #${order.order_number}`
        );
      } else {
        return ctx.badRequest('Unsupported payment provider');
      }

      ctx.body = result;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Проверка статуса платежа
   */
  async checkStatus(ctx) {
    try {
      const { provider, paymentId } = ctx.params;

      const paymentService = strapi.plugin('payments').service('payment');
      let result;

      if (provider === 'yookassa') {
        result = await paymentService.checkYooKassaPaymentStatus(paymentId);
      } else if (provider === 'cloudpayments') {
        result = await paymentService.checkCloudPaymentsPaymentStatus(paymentId);
      } else {
        return ctx.badRequest('Unsupported payment provider');
      }

      ctx.body = result;
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  /**
   * Webhook для YooKassa
   */
  async yookassaWebhook(ctx) {
    try {
      const { event, object } = ctx.request.body;

      if (event === 'payment.succeeded' && object.paid) {
        const orderId = object.metadata?.orderId;

        if (orderId) {
          // Обновляем статус заказа
          await strapi.entityService.update('api::order.order', orderId, {
            data: {
              status: 'paid',
              payment_status: 'paid',
              paid_at: new Date(),
            },
          });

          // Отправляем email уведомление
          const order = await strapi.entityService.findOne('api::order.order', orderId, {
            populate: ['user'],
          });

          if (order) {
            // Используем email plugin напрямую
            const emailPlugin = strapi.plugin('email');
            if (emailPlugin && order.user?.email) {
              await emailPlugin.service('email').send({
                to: order.user.email,
                subject: `Заказ #${order.order_number} оплачен`,
                text: `Ваш заказ #${order.order_number} успешно оплачен.`,
                html: `<h1>Заказ оплачен</h1><p>Ваш заказ #${order.order_number} успешно оплачен.</p>`,
              });
            }
          }
        }
      }

      ctx.body = { success: true };
    } catch (error) {
      strapi.log.error('YooKassa webhook error:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Webhook для CloudPayments
   */
  async cloudpaymentsWebhook(ctx) {
    try {
      const { TransactionId, Status, Amount, OrderId } = ctx.request.body;

      if (Status === 'Completed' && OrderId) {
        // Обновляем статус заказа
        await strapi.entityService.update('api::order.order', OrderId, {
          data: {
            status: 'paid',
            payment_status: 'paid',
            paid_at: new Date(),
          },
        });

        // Отправляем email уведомление
        const order = await strapi.entityService.findOne('api::order.order', OrderId, {
          populate: ['user'],
        });

        if (order) {
          // Используем email plugin напрямую
          const emailPlugin = strapi.plugin('email');
          if (emailPlugin && order.user?.email) {
            await emailPlugin.service('email').send({
              to: order.user.email,
              subject: `Заказ #${order.order_number} оплачен`,
              text: `Ваш заказ #${order.order_number} успешно оплачен.`,
              html: `<h1>Заказ оплачен</h1><p>Ваш заказ #${order.order_number} успешно оплачен.</p>`,
            });
          }
        }
      }

      ctx.body = { code: 0 };
    } catch (error) {
      strapi.log.error('CloudPayments webhook error:', error);
      ctx.throw(500, error);
    }
  },
});
