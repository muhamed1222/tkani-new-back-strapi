'use strict';

module.exports = {
  async getCart(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      console.log('🛒 ПОЛУЧЕНИЕ КОРЗИНЫ для пользователя:', user.id);

      // Ищем корзину пользователя с полным populate
      const carts = await strapi.entityService.findMany('api::cart.cart', {
        filters: {
          user: user.id
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: {
                  images: true,
                  category: true,
                  brand: true,
                  name: true,
                  price: true,
                  discount: true,
                  discount_price: true
                }
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
                  populate: {
                    images: true,
                    category: true,
                    brand: true,
                    name: true,
                    price: true
                  }
                }
              }
            }
          }
        });
        console.log('🛒 Новая корзина создана с ID:', cart.id);
      }

      // Логируем структуру данных для отладки
      if (cart && cart.items && cart.items.length > 0) {
        console.log('📦 Структура товаров в корзине:');
        cart.items.forEach((item, index) => {
          console.log(`Товар ${index + 1}:`, {
            id: item.id,
            product_id: item.product?.id,
            product_name: item.product?.name,
            product_price: item.product?.price,
            has_images: !!item.product?.images,
            images_count: item.product?.images?.length,
            images_structure: item.product?.images?.[0]
          });
        });
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

      // Проверяем существование товара с полным populate
      const product = await strapi.entityService.findOne('api::product.product', product_id, {
        populate: {
          images: true,
          category: true,
          brand: true,
          name: true,
          price: true,
          discount: true,
          discount_price: true
        }
      });

      if (!product) {
        return ctx.badRequest('Product not found');
      }

      console.log('📦 Найден товар:', {
        id: product.id,
        name: product.name,
        price: product.price,
        has_images: !!product.images,
        images_count: product.images?.length
      });

      // Находим корзину пользователя
      const carts = await strapi.entityService.findMany('api::cart.cart', {
        filters: {
          user: user.id
        },
        populate: {
          items: {
            populate: {
              product: true
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
          }
        });
      }

      console.log('🛒 Работаем с корзиной ID:', cart.id);

      // Инициализируем items
      const currentItems = cart.items || [];

      // Проверяем, есть ли товар уже в корзине
      const existingItemIndex = currentItems.findIndex(item =>
        item.product && item.product.id == product_id
      );

      let updatedCart;

      if (existingItemIndex >= 0) {
        // Обновляем количество существующего товара
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity = parseFloat(quantity);

        updatedCart = await strapi.entityService.update('api::cart.cart', cart.id, {
          data: {
            items: updatedItems
          },
          populate: {
            items: {
              populate: {
                product: {
                  populate: {
                    images: true,
                    category: true,
                    brand: true,
                    name: true,
                    price: true
                  }
                }
              }
            }
          }
        });
      } else {
        // Добавляем новый товар
        const newItem = {
          product: product_id,
          quantity: parseFloat(quantity),
          price: product.price
        };

        const updatedItems = [...currentItems, newItem];

        updatedCart = await strapi.entityService.update('api::cart.cart', cart.id, {
          data: {
            items: updatedItems
          },
          populate: {
            items: {
              populate: {
                product: {
                  populate: {
                    images: true,
                    category: true,
                    brand: true,
                    name: true,
                    price: true
                  }
                }
              }
            }
          }
        });
      }

      console.log('✅ Товар добавлен в корзину ID:', updatedCart.id);
      return {
        data: updatedCart
      };

    } catch (error) {
      console.error('❌ Ошибка добавления в корзину:', error);
      console.error('Stack:', error.stack);
      return ctx.badRequest('Ошибка добавления в корзину: ' + error.message);
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

      if (!product_id || quantity === undefined) {
        return ctx.badRequest('Product ID and quantity are required');
      }

      if (quantity < 0.1) {
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
              product: true
            }
          }
        }
      });

      if (!carts || carts.length === 0) {
        return ctx.badRequest('Cart not found');
      }

      const userCart = carts[0];
      const currentItems = userCart.items || [];

      // Находим товар в корзине
      const itemIndex = currentItems.findIndex(item =>
        item.product && item.product.id == product_id
      );

      if (itemIndex === -1) {
        return ctx.badRequest('Product not found in cart');
      }

      // Обновляем количество
      const updatedItems = [...currentItems];
      updatedItems[itemIndex].quantity = parseFloat(quantity);

      const updatedCart = await strapi.entityService.update('api::cart.cart', userCart.id, {
        data: {
          items: updatedItems
        },
        populate: {
          items: {
            populate: {
              product: {
                populate: {
                  images: true,
                  category: true,
                  brand: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      console.log('✅ Корзина обновлена ID:', updatedCart.id);
      return {
        data: updatedCart
      };

    } catch (error) {
      console.error('❌ Ошибка обновления корзины:', error);
      return ctx.badRequest('Ошибка обновления корзины: ' + error.message);
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
              product: true
            }
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
                populate: {
                  images: true,
                  category: true,
                  brand: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      console.log('✅ Товар удален из корзины ID:', updatedCart.id);
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
                populate: {
                  images: true,
                  category: true,
                  brand: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      console.log('✅ Корзина очищена ID:', updatedCart.id);
      return {
        data: updatedCart
      };

    } catch (error) {
      console.error('❌ Ошибка очистки корзины:', error);
      return ctx.badRequest('Ошибка очистки корзины: ' + error.message);
    }
  }
};