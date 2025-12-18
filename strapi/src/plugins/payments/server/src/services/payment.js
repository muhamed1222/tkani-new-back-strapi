'use strict';

const axios = require('axios');
const crypto = require('crypto');

module.exports = ({ strapi }) => ({
  /**
   * Создание клиента YooKassa API
   */
  _getYooKassaClient(shopId, apiKey) {
    const auth = Buffer.from(`${shopId}:${apiKey}`).toString('base64');
    return axios.create({
      baseURL: 'https://api.yookassa.ru/v3',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  },

  /**
   * Генерация уникального ключа идемпотентности
   */
  _generateIdempotenceKey() {
    return crypto.randomUUID();
  },

  /**
   * Инициализация платежа через YooKassa
   */
  async initYooKassaPayment(orderId, amount, description, returnUrl) {
    try {
      const pluginConfig = strapi.config.get('plugin.payments');
      const { shopId, apiKey } = pluginConfig?.providers?.yookassa || {};

      if (!shopId || !apiKey) {
        throw new Error('YooKassa credentials not configured');
      }

      const client = this._getYooKassaClient(shopId, apiKey);
      const idempotenceKey = this._generateIdempotenceKey();

      const paymentData = {
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB',
        },
        confirmation: {
          type: 'redirect',
          return_url: returnUrl,
        },
        capture: true,
        description: description || `Оплата заказа #${orderId}`,
        metadata: {
          orderId: orderId.toString(),
        },
      };

      const response = await client.post('/payments', paymentData, {
        headers: {
          'Idempotence-Key': idempotenceKey,
        },
      });

      const payment = response.data;

      // Сохраняем payment_id в заказ
      await strapi.entityService.update('api::order.order', orderId, {
        data: {
          payment_id: payment.id,
          payment_provider: 'yookassa',
        },
      });

      return {
        paymentId: payment.id,
        confirmationUrl: payment.confirmation?.confirmation_url,
        status: payment.status,
      };
    } catch (error) {
      strapi.log.error('YooKassa payment initialization error:', error);
      if (error.response) {
        strapi.log.error('YooKassa API error:', error.response.data);
        throw new Error(`YooKassa API error: ${error.response.data?.description || error.message}`);
      }
      throw error;
    }
  },

  /**
   * Проверка статуса платежа YooKassa
   */
  async checkYooKassaPaymentStatus(paymentId) {
    try {
      const pluginConfig = strapi.config.get('plugin.payments');
      const { shopId, apiKey } = pluginConfig?.providers?.yookassa || {};

      if (!shopId || !apiKey) {
        throw new Error('YooKassa credentials not configured');
      }

      const client = this._getYooKassaClient(shopId, apiKey);
      const response = await client.get(`/payments/${paymentId}`);

      const payment = response.data;

      return {
        id: payment.id,
        status: payment.status,
        paid: payment.paid,
        amount: payment.amount,
        metadata: payment.metadata,
      };
    } catch (error) {
      strapi.log.error('YooKassa payment status check error:', error);
      if (error.response) {
        strapi.log.error('YooKassa API error:', error.response.data);
        throw new Error(`YooKassa API error: ${error.response.data?.description || error.message}`);
      }
      throw error;
    }
  },

  /**
   * Инициализация платежа через CloudPayments
   */
  async initCloudPaymentsPayment(orderId, amount, description) {
    try {
      const pluginConfig = strapi.config.get('plugin.payments');
      const { publicId } = pluginConfig?.providers?.cloudpayments || {};

      if (!publicId) {
        throw new Error('CloudPayments credentials not configured');
      }

      // CloudPayments использует криптограмму на клиенте
      // Здесь возвращаем только публичный ID для клиента
      return {
        publicId,
        orderId,
        amount,
        description: description || `Оплата заказа #${orderId}`,
      };
    } catch (error) {
      strapi.log.error('CloudPayments payment initialization error:', error);
      throw error;
    }
  },

  /**
   * Проверка статуса платежа CloudPayments через API
   */
  async checkCloudPaymentsPaymentStatus(transactionId) {
    try {
      const pluginConfig = strapi.config.get('plugin.payments');
      const { publicId, apiKey } = pluginConfig?.providers?.cloudpayments || {};

      if (!publicId || !apiKey) {
        throw new Error('CloudPayments credentials not configured');
      }

      // CloudPayments API проверка через HTTP запрос
      const https = require('https');
      const url = `https://api.cloudpayments.ru/payments/find?TransactionId=${transactionId}`;
      
      return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${publicId}:${apiKey}`).toString('base64');
        const options = {
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        };

        https.get(url, options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              resolve({
                id: result.Model?.TransactionId,
                status: result.Model?.Status,
                amount: result.Model?.Amount,
              });
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });
    } catch (error) {
      strapi.log.error('CloudPayments payment status check error:', error);
      throw error;
    }
  },
});
