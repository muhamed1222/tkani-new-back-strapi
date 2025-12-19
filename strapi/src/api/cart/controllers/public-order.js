// strapi/src/api/order/controllers/public-order.js
'use strict';

module.exports = {
  async createPublicOrder(ctx) {
    try {
      const checkoutData = ctx.request.body;

      console.log('📦 Публичный заказ от неавторизованного пользователя:', JSON.stringify(checkoutData, null, 2));

      // Валидация данных
      if (!checkoutData.customer_email || !checkoutData.customer_phone) {
        return ctx.badRequest('Email и телефон обязательны для оформления заказа');
      }

      // Проверяем наличие товаров
      if (!checkoutData.items || checkoutData.items.length === 0) {
        return ctx.badRequest('Нет товаров в заказе');
      }

      // Генерируем номер заказа
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substr(2, 9).toUpperCase();
      const orderNumber = `PUBLIC-ORDER-${timestamp}-${randomStr}`;

      // Рассчитываем итоги
      let totalQuantity = 0;
      let totalAmount = 0;
      const itemsDetails = [];

      checkoutData.items.forEach((item, index) => {
        const itemTotal = parseFloat(item.total) || 0;
        totalQuantity += parseFloat(item.quantity) || 0;
        totalAmount += itemTotal;

        itemsDetails.push({
          номер: index + 1,
          товар: item.product_name || 'Неизвестный товар',
          артикул: item.product_article || 'N/A',
          количество: item.quantity || 1,
          цена: `${item.product_price || 0} ₽`,
          сумма: `${itemTotal} ₽`
        });
      });

      // Вспомогательные функции для названий методов
      const getPaymentMethodName = (method) => {
        const methods = {
          'card': 'Банковская карта',
          'cash': 'Наличные',
          'sbp': 'СБП',
          'card_online': 'Онлайн карта',
          'invoice': 'По счету'
        };
        return methods[method] || method;
      };

      // Маппинг доставки для Strapi (без изменения схемы)
      const mapDeliveryMethod = (method) => {
        const mapping = {
          'pickup': 'pickup',
          'delivery': 'russian_post', // Преобразуем "доставку" в одно из допустимых значений
          'russian_post': 'russian_post',
          'cdek': 'cdek',
          'ozon': 'ozon'
        };
        return mapping[method] || 'pickup';
      };

      // Преобразуем метод доставки
      const rawDeliveryMethod = checkoutData.delivery_method || 'pickup';
      const mappedDeliveryMethod = mapDeliveryMethod(rawDeliveryMethod);

      console.log('🔍 Маппинг доставки:', {
        получено: rawDeliveryMethod,
        преобразовано: mappedDeliveryMethod
      });

      // Создаем данные заказа
      const orderData = {
        customer_name: checkoutData.customer_name || 'Гость',
        customer_firstName: checkoutData.customer_firstName || '',
        customer_lastName: checkoutData.customer_lastName || '',
        customer_middleName: checkoutData.customer_middleName || '',
        customer_email: checkoutData.customer_email,
        customer_phone: checkoutData.customer_phone,
        customer_company: checkoutData.customer_company || '',
        customer_city: checkoutData.customer_city || '',
        customer_address: checkoutData.customer_address || '',
        customer_postcode: checkoutData.customer_postcode || '',
        customer_region: checkoutData.customer_region || '',
        delivery_method: mappedDeliveryMethod, // Используем преобразованное значение
        delivery_address: checkoutData.delivery_address || '',
        delivery_type: checkoutData.delivery_type || 'pickup',
        delivery_price: checkoutData.delivery_price || 0,
        delivery_city: checkoutData.customer_city || '',
        delivery_postcode: checkoutData.customer_postcode || '',
        delivery_region: checkoutData.customer_region || '',
        payment_method: checkoutData.payment_method || 'cash',
        order_comments: checkoutData.order_comments || '',
        order_status: 'new',
        payment_status: 'unpaid',
        total_price: checkoutData.total || totalAmount,
        subtotal: checkoutData.subtotal || totalAmount,
        discount: checkoutData.discount || 0,
        delivery_cost: checkoutData.delivery_cost || 0,
        order_number: orderNumber,
        is_public_order: true,
        items: checkoutData.items.map(item => ({
          product_name: item.product_name || 'Товар',
          product_article: item.product_article || 'N/A',
          meters: Math.round(parseFloat(item.quantity) || 1), // Округляем
          quantity: Math.round(parseFloat(item.quantity) || 1), // Округляем
          price_per_meter: parseFloat(item.product_price) || 0,
          total: parseFloat(item.total) || 0,
          product_details: item
        }))
      };

      console.log('🔍 Данные для создания публичного заказа:', orderData);

      // Создаем заказ
      const createdOrder = await strapi.entityService.create('api::order.order', {
        data: orderData
      });

      console.log('✅ Публичный заказ создан:', createdOrder.id);

      // ========== ОТПРАВКА ПИСЕМ ==========

      // Определяем способ доставки для письма
      const deliveryTypeForEmail = checkoutData.delivery_type || 'pickup';
      const deliveryDisplayText = deliveryTypeForEmail === 'pickup'
        ? 'Самовывоз'
        : 'Доставка (Почта России, СДЭК, ОЗОН, ТК)';

      console.log('✉️ Определение способа доставки для письма:', {
        deliveryType: deliveryTypeForEmail,
        displayText: deliveryDisplayText
      });

      // Формируем письмо для покупателя (текст)
      const emailContent = `
🎉 ВАШ ЗАКАЗ НА САЙТЕ CENTERTKANI.RU

💼 Детали заказа:

${itemsDetails.map(item => `
${item.номер}. ${item.товар} (Арт: ${item.артикул})
   Количество: ${item.количество} шт.
   Цена: ${item.цена}
   Сумма: ${item.сумма}
`).join('')}

📊 ИТОГО:
Количество товаров: ${totalQuantity} шт.
Сумма товаров: ${checkoutData.subtotal || totalAmount} ₽
${checkoutData.discount > 0 ? `Скидка: -${checkoutData.discount} ₽\n` : ''}${checkoutData.delivery_cost > 0 ? `Доставка: ${checkoutData.delivery_cost} ₽\n` : ''}
Общая сумма: ${checkoutData.total || totalAmount} ₽

👤 ИНФОРМАЦИЯ О ЗАКАЗЧИКЕ:
ФИО: ${orderData.customer_name}
${orderData.customer_company ? `Компания: ${orderData.customer_company}\n` : ''}
Email: ${orderData.customer_email}
Телефон: ${orderData.customer_phone}

📍 АДРЕС ДОСТАВКИ:
${orderData.delivery_address}

🚚 СПОСОБ ДОСТАВКИ: ${deliveryDisplayText}
💳 СПОСОБ ОПЛАТЫ: ${getPaymentMethodName(orderData.payment_method)}

${orderData.order_comments ? `💬 КОММЕНТАРИЙ К ЗАКАЗУ:\n${orderData.order_comments}\n` : ''}

📅 Дата заказа: ${new Date().toLocaleString('ru-RU')}
📦 Номер заказа: ${createdOrder.order_number}
📊 Статус заказа: ${createdOrder.order_status || 'Новый'}

📱 Спасибо за покупку! В ближайшее время с вами свяжутся для подтверждения заказа.

📍 Сайт: https://centertkani.ru
      `;

      // HTML версия письма для покупателя
      const htmlEmailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .order-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .order-details th { background-color: #4CAF50; color: white; padding: 10px; text-align: left; }
        .order-details td { padding: 10px; border-bottom: 1px solid #ddd; }
        .total { font-size: 16px; font-weight: bold; color: #4CAF50; margin-top: 20px; }
        .summary-item { margin: 5px 0; }
        .customer-info { background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
        .thank-you { background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-top: 20px; font-size: 16px; }
        .comment { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #ffc107; }
        .status-badge { 
            display: inline-block; 
            padding: 5px 10px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: bold; 
            margin-left: 10px; 
        }
        .status-new { background-color: #4CAF50; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 ВАШ ЗАКАЗ НА САЙТЕ CENTERTKANI.RU</h1>
        </div>
        <div class="content">
            <h2>💼 Детали заказа:</h2>
            
            <table class="order-details">
                <thead>
                    <tr>
                        <th>№</th>
                        <th>Товар</th>
                        <th>Артикул</th>
                        <th>Кол-во</th>
                        <th>Цена</th>
                        <th>Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    ${checkoutData.items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.product_name || 'Товар'}</td>
                        <td>${item.product_article || 'N/A'}</td>
                        <td>${item.quantity} шт.</td>
                        <td>${item.product_price} ₽</td>
                        <td>${item.total} ₽</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total">
                <h3>📊 ИТОГО:</h3>
                <div class="summary-item">Количество товаров: ${totalQuantity} шт.</div>
                <div class="summary-item">Сумма товаров: ${checkoutData.subtotal || totalAmount} ₽</div>
                ${checkoutData.discount > 0 ? `<div class="summary-item">Скидка: -${checkoutData.discount} ₽</div>` : ''}
                ${checkoutData.delivery_cost > 0 ? `<div class="summary-item">Доставка: ${checkoutData.delivery_cost} ₽</div>` : ''}
                <div class="summary-item" style="font-size: 18px; color: #d32f2f;">Общая сумма: ${checkoutData.total || totalAmount} ₽</div>
            </div>

            <div class="customer-info">
                <h2>👤 ИНФОРМАЦИЯ О ЗАКАЗЧИКЕ:</h2>
                <p><strong>ФИО:</strong> ${orderData.customer_name}</p>
                ${orderData.customer_company ? `<p><strong>Компания:</strong> ${orderData.customer_company}</p>` : ''}
                <p><strong>Email:</strong> ${orderData.customer_email}</p>
                <p><strong>Телефон:</strong> ${orderData.customer_phone}</p>
                
                <h3>📍 АДРЕС ДОСТАВКИ:</h3>
                <p>${orderData.delivery_address || 'Не указан'}</p>
                
                <p><strong>🚚 Способ доставки:</strong> ${deliveryDisplayText}</p>
                <p><strong>💳 Способ оплаты:</strong> ${getPaymentMethodName(orderData.payment_method)}</p>
                <p><strong>📊 Статус заказа:</strong> 
                    <span class="status-badge status-new">${createdOrder.order_status || 'Новый'}</span>
                </p>
            </div>

            ${orderData.order_comments ? `
            <div class="comment">
                <h3>💬 КОММЕНТАРИЙ К ЗАКАЗУ:</h3>
                <p>${orderData.order_comments}</p>
            </div>
            ` : ''}

            <div class="thank-you">
                <p><strong>📱 Спасибо за покупку!</strong></p>
                <p>В ближайшее время с вами свяжутся для подтверждения заказа.</p>
                <p><strong>Дата заказа:</strong> ${new Date().toLocaleString('ru-RU')}</p>
                <p><strong>Номер заказа:</strong> ${createdOrder.order_number}</p>
                <p><strong>Статус:</strong> ${createdOrder.order_status || 'Новый'}</p>
            </div>
            
            <div class="footer">
                <p>📍 Сайт: <a href="https://centertkani.ru">https://centertkani.ru</a></p>
            </div>
        </div>
    </div>
</body>
</html>
      `;

      // Формируем текстовое письмо для администратора
      const adminEmailContent = `
🚨 НОВЫЙ ПУБЛИЧНЫЙ ЗАКАЗ НА САЙТЕ CENTERTKANI.RU

💼 ДЕТАЛИ ЗАКАЗА:

${checkoutData.items.map((item, index) => `
${index + 1}. ${item.product_name || 'Товар'} (Арт: ${item.product_article || 'N/A'})
   Количество: ${item.quantity} шт.
   Цена: ${item.product_price || 0} ₽
   Сумма: ${item.total || 0} ₽
`).join('')}

📊 ИТОГО:
Количество товаров: ${totalQuantity} шт.
Сумма товаров: ${checkoutData.subtotal || totalAmount} ₽
${checkoutData.discount > 0 ? `Скидка: -${checkoutData.discount} ₽\n` : ''}${checkoutData.delivery_cost > 0 ? `Доставка: ${checkoutData.delivery_cost} ₽\n` : ''}
Общая сумма: ${checkoutData.total || totalAmount} ₽

👤 ИНФОРМАЦИЯ О ЗАКАЗЧИКЕ (ГОСТЬ):
ФИО: ${orderData.customer_name}
${orderData.customer_company ? `Компания: ${orderData.customer_company}\n` : ''}
Имя: ${orderData.customer_firstName}
Фамилия: ${orderData.customer_lastName}
${orderData.customer_middleName ? `Отчество: ${orderData.customer_middleName}\n` : ''}
Email: ${orderData.customer_email}
Телефон: ${orderData.customer_phone}

📍 АДРЕС ДОСТАВКИ:
Город: ${orderData.customer_city || 'не указан'}
Регион: ${orderData.customer_region || 'не указан'}
Адрес: ${orderData.customer_address || 'не указан'}
Индекс: ${orderData.customer_postcode || 'не указан'}
Полный адрес: ${orderData.delivery_address}

🚚 СПОСОБ ДОСТАВКИ: ${deliveryDisplayText}
💳 СПОСОБ ОПЛАТЫ: ${getPaymentMethodName(orderData.payment_method)}

${orderData.order_comments ? `💬 КОММЕНТАРИЙ К ЗАКАЗУ:\n${orderData.order_comments}\n` : ''}

📅 Дата заказа: ${new Date().toLocaleString('ru-RU')}
🔗 Номер заказа: ${createdOrder.order_number}
🔗 ID заказа: ${createdOrder.id}
👤 Тип заказа: Публичный (гость)
📊 Статус заказа: ${createdOrder.order_status || 'Новый'}

💰 ИТОГОВАЯ СУММА: ${checkoutData.total || totalAmount} ₽

⚠️ ВНИМАНИЕ: Этот заказ оформлен неавторизованным пользователем (гостем)
      `;

      // HTML версия письма для администратора
      const adminHtmlEmailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #fff; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #ddd; }
        .order-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .order-details th { background-color: #f44336; color: white; padding: 10px; text-align: left; }
        .order-details td { padding: 10px; border-bottom: 1px solid #ddd; }
        .total { font-size: 16px; font-weight: bold; color: #f44336; margin-top: 20px; }
        .summary-item { margin: 5px 0; }
        .customer-info { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .address-info { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 10px; }
        .urgent { color: #f44336; font-weight: bold; }
        .comment { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #ffc107; }
        .meta-info { background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-top: 15px; font-size: 14px; }
        .status-badge { 
            display: inline-block; 
            padding: 5px 10px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: bold; 
            margin-left: 10px; 
        }
        .status-new { background-color: #4CAF50; color: white; }
        .guest-badge { 
            background-color: #ff9800; 
            color: white; 
            padding: 5px 10px; 
            border-radius: 20px; 
            font-size: 12px; 
            margin-left: 10px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 НОВЫЙ ПУБЛИЧНЫЙ ЗАКАЗ НА САЙТЕ CENTERTKANI.RU</h1>
        </div>
        <div class="content">
            <p class="urgent">ТРЕБУЕТСЯ ОБРАБОТКА! <span class="guest-badge">ГОСТЕВОЙ ЗАКАЗ</span></p>
            
            <h2>💼 Детали заказа:</h2>
            
            <table class="order-details">
                <thead>
                    <tr>
                        <th>№</th>
                        <th>Товар</th>
                        <th>Артикул</th>
                        <th>Кол-во</th>
                        <th>Цена</th>
                        <th>Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    ${checkoutData.items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.product_name || 'Товар'}</td>
                        <td>${item.product_article || 'N/A'}</td>
                        <td>${item.quantity} шт.</td>
                        <td>${item.product_price} ₽</td>
                        <td>${item.total} ₽</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total">
                <h3>📊 ИТОГО:</h3>
                <div class="summary-item">Количество товаров: ${totalQuantity} шт.</div>
                <div class="summary-item">Сумма товаров: ${checkoutData.subtotal || totalAmount} ₽</div>
                ${checkoutData.discount > 0 ? `<div class="summary-item">Скидка: -${checkoutData.discount} ₽</div>` : ''}
                ${checkoutData.delivery_cost > 0 ? `<div class="summary-item">Доставка: ${checkoutData.delivery_cost} ₽</div>` : ''}
                <div class="summary-item" style="font-size: 18px; color: #d32f2f;">Общая сумма: ${checkoutData.total || totalAmount} ₽</div>
            </div>

            <div class="customer-info">
                <h2>👤 ИНФОРМАЦИЯ О ЗАКАЗЧИКЕ (ГОСТЬ):</h2>
                <p><strong>ФИО:</strong> ${orderData.customer_name}</p>
                <p><strong>Имя:</strong> ${orderData.customer_firstName}</p>
                <p><strong>Фамилия:</strong> ${orderData.customer_lastName}</p>
                ${orderData.customer_middleName ? `<p><strong>Отчество:</strong> ${orderData.customer_middleName}</p>` : ''}
                ${orderData.customer_company ? `<p><strong>Компания:</strong> ${orderData.customer_company}</p>` : ''}
                <p><strong>Email:</strong> ${orderData.customer_email}</p>
                <p><strong>Телефон:</strong> ${orderData.customer_phone}</p>
            </div>

            <div class="address-info">
                <h3>📍 АДРЕС ДОСТАВКИ:</h3>
                <p><strong>Город:</strong> ${orderData.customer_city || 'не указан'}</p>
                <p><strong>Регион:</strong> ${orderData.customer_region || 'не указан'}</p>
                <p><strong>Адрес:</strong> ${orderData.customer_address || 'не указан'}</p>
                <p><strong>Индекс:</strong> ${orderData.customer_postcode || 'не указан'}</p>
                <p><strong>Полный адрес:</strong> ${orderData.delivery_address || 'не указан'}</p>
                
                <p><strong>🚚 Способ доставки:</strong> ${deliveryDisplayText}</p>
                <p><strong>💳 Способ оплаты:</strong> ${getPaymentMethodName(orderData.payment_method)}</p>
                <p><strong>📊 Статус заказа:</strong> 
                    <span class="status-badge status-new">${createdOrder.order_status || 'Новый'}</span>
                </p>
            </div>

            ${orderData.order_comments ? `
            <div class="comment">
                <h3>💬 КОММЕНТАРИЙ К ЗАКАЗУ:</h3>
                <p>${orderData.order_comments}</p>
            </div>
            ` : ''}

            <div class="meta-info">
                <p><strong>📅 Дата заказа:</strong> ${new Date().toLocaleString('ru-RU')}</p>
                <p><strong>🔗 Номер заказа:</strong> ${createdOrder.order_number}</p>
                <p><strong>🔗 ID заказа:</strong> ${createdOrder.id}</p>
                <p><strong>👤 Тип заказа:</strong> <span class="guest-badge">Публичный (гость)</span></p>
                <p><strong>📊 Статус заказа:</strong> ${createdOrder.order_status || 'Новый'}</p>
                <p style="font-size: 16px; font-weight: bold; color: #f44336;">💰 ИТОГОВАЯ СУММА: ${checkoutData.total || totalAmount} ₽</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #ff9800;">
                <p><strong>⚠️ ВНИМАНИЕ:</strong> Этот заказ оформлен неавторизованным пользователем (гостем).</p>
                <p>Рекомендуется связаться с клиентом для подтверждения заказа.</p>
            </div>
        </div>
    </div>
</body>
</html>
      `;

      // Отправляем письмо покупателю
      try {
        await strapi.plugins['email'].services.email.send({
          to: orderData.customer_email,
          from: 'centertkani-shop@yandex.com',
          replyTo: 'centertkani-shop@yandex.com',
          subject: `🎉 Ваш заказ на centertkani.ru (№${createdOrder.order_number})`,
          text: emailContent,
          html: htmlEmailContent,
        });
        console.log('✅ Письмо покупателю отправлено на:', orderData.customer_email);
      } catch (emailError) {
        console.error('🔴 Ошибка отправки письма покупателю:', emailError.message);
      }

      // Отправляем письмо администратору (ОДИН РАЗ!)
      try {
        await strapi.plugins['email'].services.email.send({
          to: 'centertkani-shop@yandex.com',
          from: 'centertkani-shop@yandex.com',
          subject: `🚨 Новый публичный заказ! ${createdOrder.order_number} на сумму ${checkoutData.total || totalAmount} ₽`,
          text: adminEmailContent,
          html: adminHtmlEmailContent,
        });
        console.log('✅ Письмо администратору отправлено');
      } catch (adminEmailError) {
        console.error('🔴 Ошибка отправки письма администратору:', adminEmailError.message);
      }

      console.log('✅ Заказ успешно обработан, письма отправлены');

      return {
        success: true,
        message: 'Заказ успешно оформлен! Письмо отправлено на вашу почту.',
        data: {
          order_id: createdOrder.id,
          order_number: createdOrder.order_number,
          order_status: createdOrder.order_status,
          customer_email: orderData.customer_email,
          items_count: itemsDetails.length,
          summary: {
            total_quantity: totalQuantity,
            subtotal: checkoutData.subtotal || totalAmount,
            discount: checkoutData.discount || 0,
            delivery_cost: checkoutData.delivery_cost || 0,
            total_amount: checkoutData.total || totalAmount,
            currency: '₽'
          },
          email_sent: true
        }
      };

    } catch (error) {
      console.error('❌ Ошибка создания публичного заказа:', error);
      console.error('Stack:', error.stack);
      return ctx.badRequest('Ошибка оформления заказа: ' + error.message);
    }
  }
};