'use strict';

module.exports = {
  // Получить корзину текущего пользователя
  async getCart(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      console.log('🛒 ПОЛУЧЕНИЕ КОРЗИНЫ для пользователя:', user.id);

      // Ищем корзину пользователя с правильным populate для Strapi v4
      const carts = await strapi.entityService.findMany('api::cart.cart', {
        filters: {
          user: user.id
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: ['images', 'category']  // Убрали brand
              }
            }
          }
        }
      });

      console.log('🛒 Найдено корзин:', carts.length);

      let cart = carts && carts.length > 0 ? carts[0] : null;

      // Если корзины нет, создаем новую
      if (!cart) {
        console.log('🛒 Создаем новую корзину');
        cart = await strapi.entityService.create('api::cart.cart', {
          data: {
            user: user.id,
            items: []
          },
          populate: {
            items: {
              populate: {
                product: {
                  populate: ['images', 'category']
                }
              }
            }
          }
        });
        console.log('🛒 Новая корзина создана с ID:', cart.id);
      }

      return {
        data: cart
      };

    } catch (error) {
      console.error('❌ Ошибка получения корзины:', error);
      return ctx.badRequest('Ошибка получения корзины: ' + error.message);
    }
  },

  // Добавить товар в корзину
  async addToCart(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const { product_id, quantity = 1 } = ctx.request.body;

      console.log('🛒 ДОБАВЛЕНИЕ В КОРЗИНУ:', {
        user: user.id,
        product_id,
        quantity
      });

      // Валидация
      if (!product_id) {
        return ctx.badRequest('Product ID is required');
      }

      // Проверяем существование товара - ИСПРАВЛЕНО: убрали brand
      const product = await strapi.entityService.findOne('api::product.product', product_id, {
        populate: ['images', 'category']  // Убрали brand
      });

      if (!product) {
        return ctx.badRequest('Product not found');
      }

      console.log('✅ Товар найден:', product.title);

      // Находим корзину пользователя
      const carts = await strapi.entityService.findMany('api::cart.cart', {
        filters: {
          user: user.id
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: ['images', 'category']
              }
            }
          }
        }
      });

      console.log('🛒 Найдено корзин:', carts.length);

      let cart = carts && carts.length > 0 ? carts[0] : null;

      // Если корзины нет, создаем
      if (!cart) {
        console.log('🛒 Корзина не найдена, создаем новую');
        cart = await strapi.entityService.create('api::cart.cart', {
          data: {
            user: user.id,
            items: []
          },
          populate: {
            items: {
              populate: {
                product: {
                  populate: ['images', 'category']
                }
              }
            }
          }
        });
      }

      console.log('🛒 Работаем с корзиной ID:', cart.id);
      console.log('📦 Текущие товары в корзине:', cart.items?.length);

      // Проверяем, есть ли товар уже в корзине
      const existingItemIndex = cart.items?.findIndex(item =>
        item.product && item.product.id == product_id
      ) ?? -1;

      let updatedCart;

      if (existingItemIndex >= 0) {
        // Обновляем количество существующего товара
        const updatedItems = [...cart.items];
        const newQuantity = parseFloat(quantity) + parseFloat(updatedItems[existingItemIndex].quantity || 0);

        // Создаем массив для обновления
        const itemsForUpdate = cart.items.map((item, index) => {
          if (index === existingItemIndex) {
            return {
              product: item.product.id,
              quantity: newQuantity,
              price: parseFloat(item.price || product.price)
            };
          }
          return {
            product: item.product.id,
            quantity: parseFloat(item.quantity),
            price: parseFloat(item.price || item.product?.price)
          };
        });

        console.log('🔄 Обновляем существующий товар:', {
          existingItemIndex,
          currentQuantity: cart.items[existingItemIndex].quantity,
          newQuantity: newQuantity,
          updatedItemsCount: itemsForUpdate.length
        });

        updatedCart = await strapi.entityService.update('api::cart.cart', cart.id, {
          data: {
            items: itemsForUpdate
          },
          populate: {
            items: {
              populate: {
                product: {
                  populate: ['images', 'category']
                }
              }
            }
          }
        });

        console.log('✅ Количество товара обновлено');
      } else {
        // Добавляем новый товар
        const newItem = {
          product: product_id,
          quantity: parseFloat(quantity),
          price: product.price
        };

        // Создаем новый массив элементов
        const currentItems = cart.items || [];
        const itemsForUpdate = [
          ...currentItems.map(item => ({
            product: item.product.id,
            quantity: parseFloat(item.quantity),
            price: parseFloat(item.price || item.product?.price)
          })),
          newItem
        ];

        console.log('🆕 Добавляем новый товар в корзину:', {
          currentItemsCount: currentItems.length,
          product_id: product_id,
          quantity: quantity,
          price: product.price,
          updatedItemsCount: itemsForUpdate.length
        });

        updatedCart = await strapi.entityService.update('api::cart.cart', cart.id, {
          data: {
            items: itemsForUpdate
          },
          populate: {
            items: {
              populate: {
                product: {
                  populate: ['images', 'category']
                }
              }
            }
          }
        });

        console.log('✅ Новый товар добавлен в корзину');
      }

      console.log('🛒 Корзина обновлена, ID:', updatedCart.id);
      console.log('📦 Товаров в корзине после обновления:', updatedCart.items?.length);

      if (updatedCart.items && updatedCart.items.length > 0) {
        updatedCart.items.forEach((item, index) => {
          console.log(`   Товар ${index + 1}:`, {
            id: item.id,
            product_id: item.product?.id,
            product_name: item.product?.title,
            quantity: item.quantity
          });
        });
      } else {
        console.log('❌ В корзине нет товаров после обновления!');
      }

      return {
        data: updatedCart
      };

    } catch (error) {
      console.error('❌ Ошибка добавления в корзину:', error);
      console.error('Stack:', error.stack);
      return ctx.badRequest('Ошибка добавления в корзину: ' + error.message);
    }
  },

  // Удалить товар из корзины
  async removeFromCart(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const { product_id } = ctx.request.body;

      console.log('🛒 УДАЛЕНИЕ ИЗ КОРЗИНЫ:', { user: user.id, product_id });

      if (!product_id) {
        return ctx.badRequest('Product ID is required');
      }

      // Находим корзину пользователя
      const carts = await strapi.entityService.findMany('api::cart.cart', {
        filters: {
          user: user.id
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: ['images', 'category']
              }
            }
          }
        }
      });

      if (!carts || carts.length === 0) {
        return ctx.badRequest('Cart not found');
      }

      const userCart = carts[0];

      // Фильтруем товары и создаем новый массив без удаленного товара
      const itemsForUpdate = userCart.items
        .filter(item => !item.product || item.product.id != product_id)
        .map(item => ({
          product: item.product.id,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price || item.product?.price)
        }));

      const updatedCart = await strapi.entityService.update('api::cart.cart', userCart.id, {
        data: {
          items: itemsForUpdate
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: ['images', 'category']
              }
            }
          }
        }
      });

      return {
        data: updatedCart
      };

    } catch (error) {
      console.error('❌ Ошибка удаления из корзины:', error);
      return ctx.badRequest('Ошибка удаления из корзины: ' + error.message);
    }
  },

  // Очистить корзину
  async clearCart(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      console.log('🛒 ОЧИСТКА КОРЗИНЫ для пользователя:', user.id);

      // Находим корзину пользователя
      const carts = await strapi.entityService.findMany('api::cart.cart', {
        filters: {
          user: user.id
        }
      });

      if (!carts || carts.length === 0) {
        return {
          data: { message: 'Cart is already empty' }
        };
      }

      const userCart = carts[0];

      // Очищаем корзину
      const updatedCart = await strapi.entityService.update('api::cart.cart', userCart.id, {
        data: {
          items: []
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: ['images', 'category']
              }
            }
          }
        }
      });

      return {
        data: updatedCart
      };

    } catch (error) {
      console.error('❌ Ошибка очистки корзины:', error);
      return ctx.badRequest('Ошибка очистки корзины: ' + error.message);
    }
  },

  // Обновить количество товара в корзине
  async updateCart(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const { product_id, quantity } = ctx.request.body;

      console.log('🛒 ОБНОВЛЕНИЕ КОРЗИНЫ:', {
        user: user.id,
        product_id,
        quantity
      });

      // Валидация
      if (!product_id) {
        return ctx.badRequest('Product ID is required');
      }

      if (!quantity || quantity < 0.1) {
        return ctx.badRequest('Quantity must be at least 0.1');
      }

      // Находим корзину пользователя
      const carts = await strapi.entityService.findMany('api::cart.cart', {
        filters: {
          user: user.id
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: ['images', 'category']
              }
            }
          }
        }
      });

      if (!carts || carts.length === 0) {
        return ctx.badRequest('Cart not found');
      }

      const userCart = carts[0];

      console.log('🔍 Текущие товары в корзине:', userCart.items?.map(item => ({
        id: item.id,
        product_id: item.product?.id,
        product_name: item.product?.title,
        quantity: item.quantity
      })));

      // Ищем товар для обновления
      const existingItemIndex = userCart.items?.findIndex(item =>
        item.product && item.product.id == product_id
      ) ?? -1;

      if (existingItemIndex === -1) {
        return ctx.badRequest('Product not found in cart');
      }

      // Создаем обновленный массив элементов
      const itemsForUpdate = userCart.items.map((item, index) => {
        if (index === existingItemIndex) {
          return {
            product: item.product.id,
            quantity: parseFloat(quantity),
            price: parseFloat(item.price || item.product?.price || 0)
          };
        }
        return {
          product: item.product.id,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price || item.product?.price || 0)
        };
      });

      console.log('🔄 Обновляемые данные:', {
        existingItemIndex,
        oldQuantity: userCart.items[existingItemIndex].quantity,
        newQuantity: quantity,
        product_id: product_id
      });

      // Обновляем корзину
      const updatedCart = await strapi.entityService.update('api::cart.cart', userCart.id, {
        data: {
          items: itemsForUpdate
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: ['images', 'category']
              }
            }
          }
        }
      });

      return {
        data: updatedCart
      };

    } catch (error) {
      console.error('❌ Ошибка обновления корзины:', error);
      console.error('Stack:', error.stack);
      return ctx.badRequest('Ошибка обновления корзины: ' + error.message);
    }
  },

  // Оформление заказа (checkout) для авторизованных пользователей
  async checkout(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      // Получаем данные из формы
      const checkoutData = ctx.request.body;

      console.log('📦 Данные заказа от фронтенда:', JSON.stringify(checkoutData, null, 2));

      // Получаем корзину с полной информацией
      const carts = await strapi.entityService.findMany('api::cart.cart', {
        filters: {
          user: user.id
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: ['images', 'category']
              }
            }
          }
        }
      });

      if (!carts || carts.length === 0) {
        return ctx.badRequest('Корзина пуста');
      }

      const cart = carts[0];

      if (!cart.items || cart.items.length === 0) {
        return ctx.badRequest('Корзина пуста');
      }

      // Рассчитываем итоги
      let totalQuantity = 0;
      let totalAmount = 0;
      const itemsDetails = [];

      cart.items.forEach((item, index) => {
        const itemTotal = parseFloat(item.quantity) * parseFloat(item.price);
        totalQuantity += parseFloat(item.quantity);
        totalAmount += itemTotal;

        itemsDetails.push({
          номер: index + 1,
          товар: item.product?.title || 'Неизвестный товар',
          артикул: item.product?.article || 'N/A',
          количество: item.quantity,
          цена: `${item.price} ₽`,
          сумма: `${itemTotal} ₽`
        });
      });

      // Вспомогательные функции
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

      // Функция для отображения способа доставки в письмах
      const getDeliveryDisplayText = (method) => {
        const deliveryMethods = {
          'pickup': 'Самовывоз',
          'delivery': 'Доставка (Почта России, СДЭК, ОЗОН, ТК)',
          'russian_post': 'Доставка (Почта России, СДЭК, ОЗОН, ТК)',
          'cdek': 'Доставка (Почта России, СДЭК, ОЗОН, ТК)',
          'ozon': 'Доставка (Почта России, СДЭК, ОЗОН, ТК)',
          'courier': 'Курьерская доставка',
          'deliveryMethod': 'Доставка (Почта России, СДЭК, ОЗОН, ТК)'
        };
        return deliveryMethods[method] || method;
      };

      // Получаем отображаемое название для писем
      const deliveryDisplayText = getDeliveryDisplayText(checkoutData.delivery_method || 'pickup');

      // ========== СОЗДАНИЕ ЗАКАЗА ==========
      const orderData = {
        customer_name: checkoutData.customer_name || `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username,
        customer_firstName: checkoutData.customer_firstName || user.firstname || '',
        customer_lastName: checkoutData.customer_lastName || user.lastname || '',
        customer_middleName: checkoutData.customer_middleName || user.middleName || '',
        customer_email: checkoutData.customer_email || user.email,
        customer_phone: checkoutData.customer_phone || user.phone || '+79990000000',
        customer_company: checkoutData.customer_company || '',
        customer_city: checkoutData.customer_city || '',
        customer_address: checkoutData.customer_address || '',
        customer_postcode: checkoutData.customer_postcode || '',
        customer_region: checkoutData.customer_region || '',
        delivery_method: checkoutData.delivery_method || 'pickup',
        delivery_address: checkoutData.delivery_address || '',
        delivery_type: checkoutData.delivery_type || 'pickup',
        delivery_price: checkoutData.delivery_price || 0,
        delivery_city: checkoutData.delivery_city || checkoutData.customer_city || '',
        delivery_postcode: checkoutData.delivery_postcode || checkoutData.customer_postcode || '',
        delivery_region: checkoutData.delivery_region || checkoutData.customer_region || '',
        payment_method: checkoutData.payment_method || 'cash',
        order_comments: checkoutData.order_comments || '',
        order_status: 'new',
        payment_status: 'unpaid',
        total_price: checkoutData.total || totalAmount,
        subtotal: checkoutData.subtotal || totalAmount,
        discount: checkoutData.discount || 0,
        delivery_cost: checkoutData.delivery_cost || 0,
        items: cart.items.map(item => ({
          product: item.product.id,
          meters: parseFloat(item.quantity) || 1,
          price_per_meter: parseFloat(item.price) || 0,
          total: parseFloat(item.quantity) * parseFloat(item.price)
        })),
        user: user.id,
        is_public_order: false
      };

      // Генерация номера заказа
      if (!orderData.order_number) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 9).toUpperCase();
        orderData.order_number = `ORDER-${timestamp}-${randomStr}`;
        console.log('🔢 Сгенерирован номер заказа в checkout:', orderData.order_number);
      }

      console.log('🔍 Данные для создания заказа:', JSON.stringify(orderData, null, 2));

      let createdOrder;
      try {
        // Создаем заказ
        createdOrder = await strapi.entityService.create('api::order.order', {
          data: orderData
        });

        console.log('✅ Заказ создан в базе с ID:', createdOrder.id, 'Номер:', createdOrder.order_number);

        // Проверяем total_price
        const expectedTotal = checkoutData.total || totalAmount;
        if (createdOrder.total_price === 0 || createdOrder.total_price !== expectedTotal) {
          console.log(`⚠️ total_price не совпадает: expected ${expectedTotal}, got ${createdOrder.total_price}, исправляем...`);

          await strapi.entityService.update('api::order.order', createdOrder.id, {
            data: {
              total_price: expectedTotal
            }
          });

          createdOrder.total_price = expectedTotal;
        }

      } catch (orderError) {
        console.error('❌ ОШИБКА создания заказа:', orderError.message);
        throw orderError;
      }

      // ========== ОТПРАВКА ПИСЕМ ==========

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
                    ${cart.items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.product?.title || 'Неизвестный товар'}</td>
                        <td>${item.product?.article || 'N/A'}</td>
                        <td>${item.quantity} шт.</td>
                        <td>${item.price} ₽</td>
                        <td>${parseFloat(item.quantity) * parseFloat(item.price)} ₽</td>
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

      // Формируем письмо для администратора (текст)
      const adminEmailContent = `
🚨 НОВЫЙ ЗАКАЗ НА САЙТЕ CENTERTKANI.RU

💼 ДЕТАЛИ ЗАКАЗА:

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
👤 ID пользователя: ${user.id}
📊 Статус заказа: ${createdOrder.order_status || 'Новый'}

💰 ИТОГОВАЯ СУММА: ${checkoutData.total || totalAmount} ₽
    `;

      // HTML версия для администратора
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 НОВЫЙ ЗАКАЗ НА САЙТЕ CENTERTKANI.RU</h1>
        </div>
        <div class="content">
            <p class="urgent">ТРЕБУЕТСЯ ОБРАБОТКА!</p>
            
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
                    ${cart.items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.product?.title || 'Неизвестный товар'}</td>
                        <td>${item.product?.article || 'N/A'}</td>
                        <td>${item.quantity} шт.</td>
                        <td>${item.price} ₽</td>
                        <td>${parseFloat(item.quantity) * parseFloat(item.price)} ₽</td>
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
                <p><strong>👤 ID пользователя:</strong> ${user.id}</p>
                <p><strong>📊 Статус заказа:</strong> ${createdOrder.order_status || 'Новый'}</p>
                <p style="font-size: 16px; font-weight: bold; color: #f44336;">💰 ИТОГОВАЯ СУММА: ${checkoutData.total || totalAmount} ₽</p>
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

      // Отправляем письмо администратору
      try {
        await strapi.plugins['email'].services.email.send({
          to: 'centertkani-shop@yandex.com',
          from: 'centertkani-shop@yandex.com',
          subject: `🚨 Новый заказ! ${createdOrder.order_number} на сумму ${checkoutData.total || totalAmount} ₽`,
          text: adminEmailContent,
          html: adminHtmlEmailContent,
        });
        console.log('✅ Письмо администратору отправлено');
      } catch (adminEmailError) {
        console.error('🔴 Ошибка отправки письма администратору:', adminEmailError.message);
      }

      // Очищаем корзину после оформления заказа
      try {
        await strapi.entityService.update('api::cart.cart', cart.id, {
          data: {
            items: []
          }
        });
        console.log('✅ Корзина очищена после оформления заказа');
      } catch (clearError) {
        console.error('⚠️ Ошибка очистки корзины:', clearError.message);
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
      console.error('❌ Ошибка оформления заказа:', error);
      console.error('Stack:', error.stack);
      return ctx.badRequest('Ошибка оформления заказа: ' + error.message);
    }
  }
};