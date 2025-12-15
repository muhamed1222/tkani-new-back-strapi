// /**
//  * Скрипт для тестирования SMTP соединения
//  * Запуск: node test-smtp-connection.js
//  */

// const nodemailer = require('nodemailer');
// require('dotenv').config();

// const configs = [
//   {
//     name: 'Yandex (smtp.yandex.com, порт 587)',
//     host: 'smtp.yandex.com',
//     port: 587,
//     secure: false,
//   },
//   {
//     name: 'Yandex (smtp.yandex.com, порт 465)',
//     host: 'smtp.yandex.com',
//     port: 465,
//     secure: true,
//   },
//   {
//     name: 'Yandex (smtp.yandex.ru, порт 587)',
//     host: 'smtp.yandex.ru',
//     port: 587,
//     secure: false,
//   },
//   {
//     name: 'Yandex (smtp.yandex.ru, порт 465)',
//     host: 'smtp.yandex.ru',
//     port: 465,
//     secure: true,
//   },
// ];

// async function testConnection(config) {
//   console.log(`\n🔍 Тестирование: ${config.name}`);
//   console.log(`   Host: ${config.host}:${config.port}`);
//   console.log(`   Secure: ${config.secure}`);

//   const transporter = nodemailer.createTransport({
//     host: config.host,
//     port: config.port,
//     secure: config.secure,
//     auth: {
//       user: process.env.SMTP_EMAIL,
//       pass: process.env.SMTP_PASS,
//     },
//     connectionTimeout: 10000,
//     greetingTimeout: 10000,
//     socketTimeout: 10000,
//     debug: true,
//     logger: true,
//   });

//   try {
//     await transporter.verify();
//     console.log(`   ✅ Соединение успешно установлено!`);
//     return true;
//   } catch (error) {
//     console.log(`   ❌ Ошибка: ${error.message}`);
//     return false;
//   }
// }

// async function main() {
//   console.log('📧 Тестирование SMTP соединений с Yandex Mail\n');
//   console.log(`Email: ${process.env.SMTP_EMAIL || 'не указан'}`);
//   console.log(`Password: ${process.env.SMTP_PASS ? 'указан' : 'не указан'}\n`);

//   if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASS) {
//     console.error('❌ Укажите SMTP_EMAIL и SMTP_PASS в .env файле');
//     process.exit(1);
//   }

//   let successCount = 0;
//   for (const config of configs) {
//     const success = await testConnection(config);
//     if (success) {
//       successCount++;
//       console.log(`\n✅ Рекомендуемые настройки для .env:`);
//       console.log(`SMTP_HOST=${config.host}`);
//       console.log(`SMTP_PORT=${config.port}`);
//       console.log(`SMTP_SECURE=${config.secure}`);
//       break; // Останавливаемся на первом успешном соединении
//     }
//   }

//   if (successCount === 0) {
//     console.log('\n❌ Все соединения не удались.');
//     console.log('\nВозможные причины:');
//     console.log('1. Порты 587/465 заблокированы файрволом или ISP');
//     console.log('2. Неправильный пароль приложения');
//     console.log('3. Проблемы с сетью');
//     console.log('\nРекомендации:');
//     console.log('- Используйте VPN');
//     console.log('- Или используйте локальный SMTP сервер для разработки (maildev)');
//     console.log('- Или используйте другой SMTP сервис (Gmail, Mail.ru)');
//   }
// }

// main().catch(console.error);
