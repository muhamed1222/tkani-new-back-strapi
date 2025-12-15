// /**
//  * Тестовый скрипт для отправки уведомления о заказе через Telegram бота
//  */

// const path = require('path');
// const fs = require('fs');

// // Загружаем .env
// const envPath = path.resolve(__dirname, '../.env');
// if (fs.existsSync(envPath)) {
//   const envContent = fs.readFileSync(envPath, 'utf8');
//   envContent.split('\n').forEach(line => {
//     const match = line.match(/^([^#=]+)=(.*)$/);
//     if (match) {
//       const key = match[1].trim();
//       let value = match[2].trim();
//       if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
//         value = value.slice(1, -1);
//       }
//       if (!process.env[key]) {
//         process.env[key] = value;
//       }
//     }
//   });
// }

// const { sendTelegramMessage } = require('./src/utils/telegram');
// const { generateOrderMessage } = require('./src/utils/telegramMessage');

// // Тестовый объект заказа
// const testOrder = {
//   id: 999,
//   order_number: 'ORD-2025-TEST-001',
//   customer_name: 'Иван Иванов',
//   customer_phone: '+7 (999) 123-45-67',
//   total_price: 2500.75,
//   items: [
//     {
//       id: 1,
//       product: {
//         id: 1,
//         title: 'Ткань хлопок белая',
//       },
//       meters: 2.5,
//       price_per_meter: 300.00,
//       total: 750.00,
//     },
//     {
//       id: 2,
//       product: {
//         id: 2,
//         title: 'Ткань лён синяя',
//       },
//       meters: 3.0,
//       price_per_meter: 250.00,
//       total: 750.00,
//     },
//     {
//       id: 3,
//       product: {
//         id: 3,
//         title: 'Ткань шёлк красная',
//       },
//       meters: 4.0,
//       price_per_meter: 250.19,
//       total: 1000.75,
//     },
//   ],
// };

// async function testOrderNotification() {
//   console.log('🧪 ТЕСТОВАЯ ОТПРАВКА УВЕДОМЛЕНИЯ О ЗАКАЗЕ\n');
//   console.log('='.repeat(60));

//   // Проверка переменных окружения
//   console.log('\n📋 Проверка переменных окружения:');
//   console.log('TG_BOT_TOKEN:', process.env.TG_BOT_TOKEN ? '✅ Установлен' : '❌ Не установлен');

//   if (!process.env.TG_BOT_TOKEN) {
//     console.error('\n❌ Ошибка: TG_BOT_TOKEN не установлен в .env');
//     process.exit(1);
//   }

//   // Генерируем сообщение
//   console.log('\n📝 Генерация сообщения о заказе...');
//   const message = generateOrderMessage(testOrder);
//   console.log('✅ Сообщение сгенерировано');
//   console.log(`   Длина: ${message.length} символов`);
//   console.log('\n📄 Содержимое сообщения:');
//   console.log('-'.repeat(60));
//   console.log(message);
//   console.log('-'.repeat(60));

//   // Получаем chat_id из .env (для обратной совместимости)
//   const chatId = process.env.TG_NOTIFY_CHAT_ID;
  
//   if (!chatId || chatId === '' || chatId === '""') {
//     console.error('\n❌ Ошибка: TG_NOTIFY_CHAT_ID не установлен в .env');
//     console.log('\n💡 Для тестирования множественных получателей:');
//     console.log('   1. Добавьте получателей через админку Strapi');
//     console.log('   2. Или установите TG_NOTIFY_CHAT_ID в .env для теста');
//     process.exit(1);
//   }

//   // Отправляем сообщение
//   console.log(`\n📤 Отправка сообщения на chat_id: ${chatId}...`);
  
//   try {
//     await sendTelegramMessage(chatId, message);
//     console.log('✅ Сообщение отправлено успешно!');
//     console.log('\n📱 Проверьте ваш Telegram чат.');
//   } catch (error) {
//     console.error('❌ Ошибка при отправке сообщения:', error.message);
//     process.exit(1);
//   }

//   console.log('\n' + '='.repeat(60));
//   console.log('\n✅ Тест завершен успешно!');
// }

// testOrderNotification();
