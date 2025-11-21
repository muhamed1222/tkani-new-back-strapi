'use strict';

module.exports = {
  async update(ctx) {
    try {
      console.log('🔄 Обновление профиля - начало');
      console.log('🔐 User state:', ctx.state.user);

      const user = ctx.state.user;

      if (!user) {
        console.log('❌ Пользователь не авторизован');
        return ctx.unauthorized('Not authenticated');
      }

      const { firstName, lastName, email } = ctx.request.body;

      console.log('🔄 Обновление профиля для пользователя:', user.id);
      console.log('📝 Новые данные:', { firstName, lastName, email });

      // Валидация
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

      // Обновляем данные - используем правильные имена полей для Strapi
      const updateData = {};
      if (firstName !== undefined) updateData.firstname = firstName;
      if (lastName !== undefined) updateData.lastname = lastName;
      if (email !== undefined) updateData.email = email.toLowerCase();

      console.log('🔄 Данные для обновления:', updateData);

      const updatedUser = await strapi.entityService.update(
        'plugin::users-permissions.user',
        user.id,
        {
          data: updateData,
          populate: ['role'] // Добавляем populate для получения полных данных
        }
      );

      console.log('✅ Профиль успешно обновлен:', {
        id: updatedUser.id,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        email: updatedUser.email
      });

      // Убираем чувствительные данные
      const { password, resetPasswordToken, confirmationToken, ...safeUser } = updatedUser;

      ctx.send({
        success: true,
        message: 'Профиль успешно обновлен',
        user: safeUser
      });

    } catch (error) {
      console.error('❌ Ошибка обновления профиля:', error);
      ctx.badRequest('Ошибка обновления: ' + error.message);
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
        firstname: fullUser.firstname,
        lastname: fullUser.lastname,
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
  }
};