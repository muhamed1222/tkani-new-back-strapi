'use strict';

module.exports = {
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

      console.log('✅ Количество товара обновлено');
      console.log('📦 Корзина после обновления:', updatedCart.items?.map(item => ({
        id: item.id,
        product_id: item.product?.id,
        product_name: item.product?.title,
        quantity: item.quantity
      })));

      return {
        data: updatedCart
      };

    } catch (error) {
      console.error('❌ Ошибка обновления корзины:', error);
      console.error('Stack:', error.stack);
      return ctx.badRequest('Ошибка обновления корзины: ' + error.message);
    }
  },

  async checkout(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      console.log('💰 ОФОРМЛЕНИЕ ЗАКАЗА для пользователя:', user.id, user.email);

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

      console.log('📦 Товаров в корзине для оформления:', cart.items.length);

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

      // Формируем письмо (новый текст)
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
Общая сумма: ${totalAmount} ₽

👤 Информация о покупателе:
Имя пользователя: ${user.username}
Email: ${user.email}
Телефон: ${user.phone || 'не указан'}
ID пользователя: ${user.id}

📅 Дата заказа: ${new Date().toLocaleString('ru-RU')}

📱 Спасибо за покупку! В ближайшее время отпишемся на оставленный вами номер для подтверждения заказа.

📍 Сайт: https://centertkani.ru
    `;

      // Формируем HTML версию письма (новый текст)
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
        .total { font-size: 18px; font-weight: bold; color: #4CAF50; margin-top: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
        .thank-you { background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-top: 20px; font-size: 16px; }
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
                <p>📊 ИТОГО:</p>
                <p>Количество товаров: ${totalQuantity} шт.</p>
                <p>Общая сумма: ${totalAmount} ₽</p>
            </div>

            <h2>👤 Информация о покупателе:</h2>
            <p><strong>Имя пользователя:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Телефон:</strong> ${user.phone || 'не указан'}</p>
            <p><strong>Дата заказа:</strong> ${new Date().toLocaleString('ru-RU')}</p>

            <div class="thank-you">
                <p><strong>📱 Спасибо за покупку!</strong></p>
                <p>В ближайшее время отпишемся на оставленный вами номер для подтверждения заказа.</p>
            </div>
            
            <div class="footer">
                <p>📍 Сайт: <a href="https://centertkani.ru">https://centertkani.ru</a></p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

      // Создаем запись заказа в базе данных (опционально)
      try {
        const order = await strapi.entityService.create('api::order.order', {
          data: {
            user: user.id,
            items: cart.items.map(item => ({
              product: item.product.id,
              quantity: item.quantity,
              price: item.price,
              total: parseFloat(item.quantity) * parseFloat(item.price)
            })),
            total_quantity: totalQuantity,
            total_amount: totalAmount,
            status: 'pending',
            order_date: new Date(),
            email_content: emailContent,
            html_email_content: htmlEmailContent
          }
        });
        console.log('✅ Заказ создан в базе с ID:', order.id);
      } catch (orderError) {
        console.log('⚠️ Не удалось создать запись заказа в базе:', orderError.message);
        // Продолжаем работу даже если не создалась запись в базе
      }

      // Очищаем корзину после оформления заказа
      await strapi.entityService.update('api::cart.cart', cart.id, {
        data: {
          items: []
        }
      });

      console.log('✅ Корзина очищена после оформления заказа');

      return {
        success: true,
        message: 'Заказ успешно оформлен!',
        data: {
          order_id: `ORDER-${Date.now()}`,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone
          },
          items: itemsDetails,
          summary: {
            total_quantity: totalQuantity,
            total_amount: totalAmount,
            currency: '₽'
          },
          email_content: emailContent,
          html_email_content: htmlEmailContent,
          formatted_email: `Вы заказали на сайте centertkani.ru на сумму ${totalAmount} ₽. В ближайшее время с вами свяжутся для подтверждения заказа.`
        }
      };

    } catch (error) {
      console.error('❌ Ошибка оформления заказа:', error);
      console.error('Stack:', error.stack);
      return ctx.badRequest('Ошибка оформления заказа: ' + error.message);
    }
  }

};