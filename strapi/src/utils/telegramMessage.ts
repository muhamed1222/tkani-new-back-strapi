// /**
//  * Генератор текста уведомления о новом заказе для Telegram
//  */

// interface OrderItem {
//   product?: {
//     title?: string;
//     id?: number;
//   } | number | null;
//   meters?: number;
// }

// interface Order {
//   order_number?: string;
//   customer_name?: string;
//   customer_phone?: string;
//   total_price?: number;
//   items?: OrderItem[];
// }

// export function generateOrderMessage(order: Order): string {
//   // Формируем список товаров
//   let itemsList = '';
  
//   if (order.items && Array.isArray(order.items) && order.items.length > 0) {
//     itemsList = order.items
//       .map((item) => {
//         const productTitle = 
//           typeof item.product === 'object' && item.product !== null
//             ? item.product.title || 'Товар'
//             : 'Товар';
//         const meters = item.meters || 0;
//         return `${productTitle} — ${meters} м`;
//       })
//       .join('\n');
//   } else {
//     itemsList = 'Товары не указаны';
//   }

//   // Формируем сообщение
//   const message = `📦 <b>Новый заказ</b>

// Номер: ${order.order_number || 'Не указан'}
// Имя: ${order.customer_name || 'Не указано'}
// Телефон: ${order.customer_phone || 'Не указан'}

// 🧵 Товары:
// ${itemsList}

// 💰 Сумма: ${order.total_price || 0} ₽`;

//   return message;
// }
