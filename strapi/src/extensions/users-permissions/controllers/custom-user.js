'use strict';

module.exports = {
  // Обновление имени и фамилии
  async updatePersonalInfo(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const { firstName, lastName, middleName } = ctx.request.body;

      console.log('🔄 Обновление личных данных для пользователя:', user.id);
      console.log('📝 Новые данные:', { firstName, lastName, middleName });

      // Валидация
      if (!firstName && !lastName) {
        return ctx.badRequest('Необходимо указать имя или фамилию');
      }

      const updateData = {};
      if (firstName !== undefined) {
        if (firstName.trim().length < 2) {
          return ctx.badRequest('Имя должно содержать минимум 2 символа');
        }
        updateData.firstName = firstName.trim();
      }
      if (lastName !== undefined) {
        if (lastName.trim().length < 2) {
          return ctx.badRequest('Фамилия должна содержать минимум 2 символа');
        }
        updateData.lastName = lastName.trim();
      }
      if (middleName !== undefined) {
        if (middleName.trim().length > 0 && middleName.trim().length < 2) {
          return ctx.badRequest('Отчество должно содержать минимум 2 символа');
        }
        updateData.middleName = middleName.trim();
      }

      const updatedUser = await strapi.entityService.update(
        'plugin::users-permissions.user',
        user.id,
        {
          data: updateData
        }
      );

      // Возвращаем обновленные данные
      const { password, resetPasswordToken, confirmationToken, ...safeUser } = updatedUser;

      ctx.send({
        success: true,
        message: 'Личные данные успешно обновлены',
        user: safeUser
      });

    } catch (error) {
      console.error('❌ Ошибка обновления личных данных:', error);
      ctx.badRequest('Ошибка обновления: ' + error.message);
    }
  },

  // Обновление email
  async updateEmail(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      const { email } = ctx.request.body;

      console.log('🔄 Обновление email для пользователя:', user.id);
      console.log('📝 Новый email:', email);

      // Валидация
      if (!email) {
        return ctx.badRequest('Email обязателен');
      }

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

      const updatedUser = await strapi.entityService.update(
        'plugin::users-permissions.user',
        user.id,
        {
          data: {
            email: email.toLowerCase()
          }
        }
      );

      // Возвращаем обновленные данные
      const { password, resetPasswordToken, confirmationToken, ...safeUser } = updatedUser;

      ctx.send({
        success: true,
        message: 'Email успешно обновлен',
        user: safeUser
      });

    } catch (error) {
      console.error('❌ Ошибка обновления email:', error);
      ctx.badRequest('Ошибка обновления email: ' + error.message);
    }
  },

  // Получение данных пользователя
  async getProfile(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Not authenticated');
      }

      // Получаем актуальные данные пользователя
      const userData = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        {
          fields: ['id', 'username', 'email', 'firstName', 'lastName', 'middleName', 'phone', 'createdAt'],
          populate: {}
        }
      );

      ctx.send({
        success: true,
        user: userData
      });

    } catch (error) {
      console.error('❌ Ошибка получения профиля:', error);
      ctx.badRequest('Ошибка получения профиля');
    }
  }
};