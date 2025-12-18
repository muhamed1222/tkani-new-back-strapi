// 'use strict';

// // Email service для отправки уведомлений о заказах
// module.exports = ({ strapi }) => {
//   /**
//    * Валидирует email адрес
//    */
//   const isValidEmail = (email) => {
//     if (!email || typeof email !== 'string') {
//       return false;
//     }

//     // Базовая проверка формата
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return false;
//     }

//     // Проверка на опасные символы
//     const dangerousPatterns = [
//       /@.*@/, // Множественные @
//       /\.\./, // Двойные точки
//       /^\./, // Начинается с точки
//       /\.$/, // Заканчивается точкой
//       /@\./, // @ перед точкой
//       /\.@/, // Точка перед @
//       /\s/, // Пробелы
//       /[<>]/, // Угловые скобки
//       /["']/, // Кавычки
//     ];

//     for (const pattern of dangerousPatterns) {
//       if (pattern.test(email)) {
//         return false;
//       }
//     }

//     // Проверка длины
//     if (email.length > 254) {
//       return false;
//     }

//     // Извлекаем домен
//     const parts = email.split('@');
//     if (parts.length !== 2) {
//       return false;
//     }

//     const domain = parts[1].toLowerCase();
//     const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i;

//     return domainRegex.test(domain);
//   };

//   return {
//     /**
//      * Отправка email уведомления о создании заказа
//      */
//     async sendOrderCreated(order) {
//       try {
//         const emailService = strapi.plugin('email').service('email');

//         if (!order.user?.email) {
//           strapi.log.warn('Order user email not found');
//           return;
//         }

//         // Валидация email перед отправкой
//         if (!isValidEmail(order.user.email)) {
//           strapi.log.warn(`Invalid email address for order ${order.id}: ${order.user.email}`);
//           return;
//         }

//         await emailService.send({
//           to: order.user.email,
//           subject: `Заказ #${order.order_number} создан`,
//           text: `Ваш заказ #${order.order_number} успешно создан. Сумма: ${order.total_price} руб.`,
//           html: `
//           <h1>Заказ создан</h1>
//           <p>Ваш заказ #${order.order_number} успешно создан.</p>
//           <p>Сумма заказа: <strong>${order.total_price} руб.</strong></p>
//           <p>Статус: ${order.status}</p>
//         `,
//         });

//         strapi.log.info(`Order created email sent to ${order.user.email}`);
//       } catch (error) {
//         strapi.log.error('Error sending order created email:', error);
//       }
//     },

//     /**
//      * Отправка email уведомления об оплате заказа
//      */
//     async sendOrderPaid(order) {
//       try {
//         const emailService = strapi.plugin('email').service('email');

//         if (!order.user?.email) {
//           strapi.log.warn('Order user email not found');
//           return;
//         }

//         // Валидация email перед отправкой
//         if (!isValidEmail(order.user.email)) {
//           strapi.log.warn(`Invalid email address for order ${order.id}: ${order.user.email}`);
//           return;
//         }

//         await emailService.send({
//           to: order.user.email,
//           subject: `Заказ #${order.order_number} оплачен`,
//           text: `Ваш заказ #${order.order_number} успешно оплачен.`,
//           html: `
//           <h1>Заказ оплачен</h1>
//           <p>Ваш заказ #${order.order_number} успешно оплачен.</p>
//           <p>Сумма: <strong>${order.total_price} руб.</strong></p>
//         `,
//         });

//         strapi.log.info(`Order paid email sent to ${order.user.email}`);
//       } catch (error) {
//         strapi.log.error('Error sending order paid email:', error);
//       }
//     },

//     /**
//      * Отправка email уведомления об отправке заказа
//      */
//     async sendOrderShipped(order) {
//       try {
//         const emailService = strapi.plugin('email').service('email');

//         if (!order.user?.email) {
//           strapi.log.warn('Order user email not found');
//           return;
//         }

//         // Валидация email перед отправкой
//         if (!isValidEmail(order.user.email)) {
//           strapi.log.warn(`Invalid email address for order ${order.id}: ${order.user.email}`);
//           return;
//         }

//         await emailService.send({
//           to: order.user.email,
//           subject: `Заказ #${order.order_number} отправлен`,
//           text: `Ваш заказ #${order.order_number} отправлен.`,
//           html: `
//           <h1>Заказ отправлен</h1>
//           <p>Ваш заказ #${order.order_number} отправлен.</p>
//           <p>Ожидайте доставку в ближайшее время.</p>
//         `,
//         });

//         strapi.log.info(`Order shipped email sent to ${order.user.email}`);
//       } catch (error) {
//         strapi.log.error('Error sending order shipped email:', error);
//       }
//     };
//   };
