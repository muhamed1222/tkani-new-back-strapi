// /**
//  * Утилита для отправки сообщений в Telegram
//  * JavaScript версия для совместимости с lifecycles.js
//  */

// async function sendTelegramMessage(chatId, text) {
//   const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;

//   // Если TG_BOT_TOKEN отсутствует → просто return без ошибки
//   if (!TG_BOT_TOKEN) {
//     return;
//   }

//   try {
//     const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;

//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         chat_id: chatId,
//         text: text,
//         parse_mode: 'HTML',
//       }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       console.error('Ошибка отправки Telegram сообщения:', {
//         status: response.status,
//         statusText: response.statusText,
//         error: errorData,
//       });
//     }
//   } catch (error) {
//     console.error('Ошибка при отправке Telegram сообщения:', error);
//   }
// }

// module.exports = {
//   sendTelegramMessage,
// };
