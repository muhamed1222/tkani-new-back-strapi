'use strict';

module.exports = {
  async update(ctx) {
    try {
      console.log('🔄 Обновление профиля - начало');

      // Получаем пользователя из JWT токена
      const user = ctx.state.user;

      if (!user) {
        console.log('❌ Пользователь не авторизован');
        return ctx.unauthorized('Не авторизован');
      }

      const { firstName, lastName, middleName, email, phone } = ctx.request.body;

      console.log('🔄 Обновление профиля для пользователя:', user.id);
      console.log('📝 Новые данные:', { firstName, lastName, middleName, email, phone });

      // Валидация email
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return ctx.badRequest('Неверный формат email');
        }

        // Проверяем, не занят ли email другим пользователем
        if (email !== user.email) {
          const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
            where: {
              email: email.toLowerCase(),
              id: { $ne: user.id }
            }
          });

          if (existingUser) {
            return ctx.badRequest('Email уже используется другим пользователем');
          }
        }
      }

      // Валидация телефона (если передан)
      if (phone && phone.trim() !== '') {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
        const cleanPhone = phone.replace(/\s/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          return ctx.badRequest('Неверный формат телефона');
        }
      }

      // Обновляем данные
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (middleName !== undefined) updateData.middleName = middleName;
      if (email !== undefined) updateData.email = email.toLowerCase();
      if (phone !== undefined) updateData.phone = phone.trim();

      console.log('🔄 Данные для обновления:', updateData);

      // Используем правильный метод для обновления
      const updatedUser = await strapi.plugins['users-permissions'].services.user.edit(
        user.id,
        updateData
      );

      console.log('✅ Профиль успешно обновлен:', {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone
      });

      // Убираем чувствительные данные
      const { password, resetPasswordToken, confirmationToken, provider, ...safeUser } = updatedUser;

      return {
        success: true,
        message: 'Профиль успешно обновлен',
        user: safeUser
      };

    } catch (error) {
      console.error('❌ Ошибка обновления профиля:', error);
      return {
        success: false,
        error: 'Ошибка обновления профиля: ' + error.message
      };
    }
  },

  async checkAuth(ctx) {
    try {
      console.log('🔐 Проверка авторизации - начало');
      console.log('🔐 User state:', ctx.state.user);

      const user = ctx.state.user;

      if (!user) {
        console.log('❌ Пользователь не авторизован');
        return ctx.unauthorized('Not authenticated');
      }

      // Получаем полные данные пользователя
      const fullUser = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        {
          populate: ['role']
        }
      );

      console.log('✅ Данные пользователя из БД:', {
        id: fullUser.id,
        username: fullUser.username,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        phone: fullUser.phone,
        role: fullUser.role
      });

      // Убираем чувствительные данные
      const { password, resetPasswordToken, confirmationToken, ...safeUser } = fullUser;

      ctx.send({
        success: true,
        message: 'Авторизация успешна',
        user: safeUser
      });

    } catch (error) {
      console.error('❌ Ошибка проверки авторизации:', error);
      ctx.unauthorized('Ошибка авторизации');
    }
  },

  async deleteAccount(ctx) {
    try {
      console.log('🗑️ Удаление аккаунта - начало');
      console.log('🔐 User state:', ctx.state.user);

      const user = ctx.state.user;

      if (!user) {
        console.log('❌ Пользователь не авторизован');
        return ctx.unauthorized('Not authenticated');
      }

      console.log('🗑️ Удаление пользователя с ID:', user.id);

      // Получаем полные данные пользователя
      const userToDelete = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        {
          populate: ['role', 'cart', 'orders', 'avatar']
        }
      );

      if (!userToDelete) {
        return ctx.notFound('Пользователь не найден');
      }

      console.log('👤 Данные пользователя для удаления:', {
        id: userToDelete.id,
        email: userToDelete.email,
        username: userToDelete.username
      });

      // Удаляем связанные данные (корзина, заказы и т.д.)
      try {
        // Удаляем корзину пользователя если существует
        if (userToDelete.cart) {
          await strapi.entityService.delete('api::cart.cart', userToDelete.cart.id);
          console.log('✅ Корзина пользователя удалена');
        }

        // Удаляем аватар если существует
        if (userToDelete.avatar) {
          await strapi.plugins['upload'].services.upload.remove(userToDelete.avatar);
          console.log('✅ Аватар пользователя удален');
        }

        // Помечаем заказы как анонимные или удаляем (в зависимости от бизнес-логики)
        // await strapi.entityService.updateMany('api::order.order', {
        //   filters: { user: user.id },
        //   data: { user: null }
        // });
        // console.log('✅ Заказы пользователя обновлены');

      } catch (cleanupError) {
        console.warn('⚠️ Ошибка при очистке связанных данных:', cleanupError);
        // Продолжаем удаление пользователя даже если очистка не удалась
      }

      // Удаляем пользователя
      const deletedUser = await strapi.entityService.delete(
        'plugin::users-permissions.user',
        user.id
      );

      console.log('✅ Аккаунт успешно удален:', deletedUser.id);

      ctx.send({
        success: true,
        message: 'Аккаунт успешно удален'
      });

    } catch (error) {
      console.error('❌ Ошибка удаления аккаунта:', error);
      ctx.badRequest('Ошибка удаления аккаунта: ' + error.message);
    }
  }
};