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
                populate: ['images', 'category', 'brand']
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
                  populate: ['images', 'category', 'brand']
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

      // Проверяем существование товара
      const product = await strapi.entityService.findOne('api::product.product', product_id, {
        populate: ['images', 'category', 'brand']
      });

      if (!product) {
        return ctx.badRequest('Product not found');
      }

      // Находим корзину пользователя
      const carts = await strapi.entityService.findMany('api::cart.cart', {
        filters: {
          user: user.id
        },
        populate: {
          items: {
            populate: ['product']
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
          }
        });
      }

      console.log('🛒 Работаем с корзиной ID:', cart.id);
      console.log('📦 Текущие товары в корзине:', cart.items?.length);

      // Инициализируем items
      const currentItems = cart.items || [];

      // Проверяем, есть ли товар уже в корзине
      const existingItemIndex = currentItems.findIndex(item =>
        item.product && item.product.id == product_id
      );

      let updatedCart;

      if (existingItemIndex >= 0) {
        // Обновляем количество существующего товара
        // В Strapi v4 для обновления компонентов нужно использовать правильный формат
        const updatedItems = currentItems.map((item, index) => {
          if (index === existingItemIndex) {
            return {
              id: item.id, // Сохраняем ID компонента
              product: item.product.id, // Сохраняем связь с продуктом
              quantity: parseFloat(quantity),
              price: item.price || product.price
            };
          }
          return item;
        });

        console.log('🔄 Обновляем существующий товар:', {
          existingItemIndex,
          currentQuantity: currentItems[existingItemIndex].quantity,
          newQuantity: quantity,
          updatedItemsCount: updatedItems.length
        });

        updatedCart = await strapi.entityService.update('api::cart.cart', cart.id, {
          data: {
            items: updatedItems
          },
          populate: {
            items: {
              populate: {
                product: {
                  populate: ['images', 'category', 'brand']
                }
              }
            }
          }
        });

        console.log('✅ Количество товара обновлено');
      } else {
        // Добавляем новый товар - ПРАВИЛЬНАЯ СТРУКТУРА ДЛЯ КОМПОНЕНТА
        const newItem = {
          product: product_id,
          quantity: parseFloat(quantity),
          price: product.price
        };

        const updatedItems = [...currentItems, newItem];

        console.log('🆕 Добавляем новый товар в корзину:', {
          currentItemsCount: currentItems.length,
          newItem,
          updatedItemsCount: updatedItems.length
        });

        updatedCart = await strapi.entityService.update('api::cart.cart', cart.id, {
          data: {
            items: updatedItems
          },
          populate: {
            items: {
              populate: {
                product: {
                  populate: ['images', 'category', 'brand']
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
            product_name: item.product?.name,
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
            populate: ['product']
          }
        }
      });

      if (!carts || carts.length === 0) {
        return ctx.badRequest('Cart not found');
      }

      const userCart = carts[0];
      const currentItems = userCart.items || [];

      // Фильтруем товары
      const updatedItems = currentItems.filter(item =>
        !item.product || item.product.id != product_id
      );

      const updatedCart = await strapi.entityService.update('api::cart.cart', userCart.id, {
        data: {
          items: updatedItems
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: ['images']
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
                populate: ['images']
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

      // Находим корзину пользователя с полным populate
      const carts = await strapi.entityService.findMany('api::cart.cart', {
        filters: {
          user: user.id
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: ['images', 'category', 'brand']
              }
            }
          }
        }
      });

      if (!carts || carts.length === 0) {
        return ctx.badRequest('Cart not found');
      }

      const userCart = carts[0];
      const currentItems = userCart.items || [];

      console.log('🔍 Текущие товары в корзине:', currentItems.map(item => ({
        id: item.id,
        product_id: item.product?.id,
        product_name: item.product?.name,
        quantity: item.quantity
      })));

      // Ищем товар для обновления
      const itemIndex = currentItems.findIndex(item =>
        item.product && item.product.id == product_id
      );

      if (itemIndex === -1) {
        return ctx.badRequest('Product not found in cart');
      }

      // Создаем обновленный элемент с сохранением ВСЕХ данных
      const updatedItems = currentItems.map((item, index) => {
        if (index === itemIndex) {
          return {
            id: item.id, // Сохраняем ID компонента
            product: item.product.id, // Сохраняем связь с продуктом
            quantity: parseFloat(quantity),
            price: item.price || item.product?.price
          };
        }
        return item;
      });

      console.log('🔄 Обновляемые данные:', {
        itemIndex,
        oldQuantity: currentItems[itemIndex].quantity,
        newQuantity: quantity,
        product_id: product_id
      });

      // Обновляем корзину
      const updatedCart = await strapi.entityService.update('api::cart.cart', userCart.id, {
        data: {
          items: updatedItems
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: ['images', 'category', 'brand']
              }
            }
          }
        }
      });

      console.log('✅ Количество товара обновлено');
      console.log('📦 Корзина после обновления:', updatedCart.items?.map(item => ({
        id: item.id,
        product_id: item.product?.id,
        product_name: item.product?.name,
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
  }
};