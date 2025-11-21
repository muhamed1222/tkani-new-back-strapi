'use strict';

module.exports = {
  async register(ctx) {
    try {
      console.log('🔵 Получен запрос на регистрацию:', ctx.request.body);

      const { username, email, password, firstName, lastName, phone } = ctx.request.body;

      // Валидация обязательных полей
      if (!username || !email || !password || !firstName || !lastName || !phone) {
        return ctx.badRequest('Все поля обязательны для заполнения');
      }

      // Проверка формата email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ctx.badRequest('Неверный формат email');
      }

      // Проверка существующего пользователя
      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [
            { email: email.toLowerCase() },
            { username: username }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          return ctx.badRequest('Email уже зарегистрирован');
        }
        if (existingUser.username === username) {
          return ctx.badRequest('Имя пользователя уже занято');
        }
      }

      // Используем сервис users-permissions для создания пользователя
      const userService = strapi.plugins['users-permissions'].services.user;

      // Подготавливаем данные для создания пользователя
      const userData = {
        username: username,
        email: email.toLowerCase(),
        password: password,
        confirmed: true,
        provider: 'local',
        role: 1
      };

      console.log('🟡 Создаем пользователя с данными:', userData);

      // Создаем пользователя
      const user = await userService.add(userData);

      console.log('🟢 Базовый пользователь создан:', user.id);

      // Теперь обновляем пользователя дополнительными полями через entityService
      // Это обходит возможные ограничения валидации
      const updatedUser = await strapi.entityService.update(
        'plugin::users-permissions.user',
        user.id,
        {
          data: {
            firstname: firstName,
            lastname: lastName,
            phone: phone
          },
          populate: ['role'] // Добавляем populate для получения полных данных
        }
      );

      console.log('🟢 Дополнительные поля добавлены:', {
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        phone: updatedUser.phone
      });

      // Генерация JWT токена
      const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
        id: user.id
      });

      // Подготовка ответа - убедимся что все поля присутствуют
      const responseUser = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstname || firstName,
        lastName: updatedUser.lastname || lastName,
        phone: updatedUser.phone || phone,
        firstname: updatedUser.firstname || firstName,
        lastname: updatedUser.lastname || lastName
      };

      console.log('🟢 Данные пользователя для ответа:', responseUser);

      const response = {
        jwt: jwt,
        user: responseUser
      };

      console.log('🟢 Регистрация успешна');
      ctx.send(response);

    } catch (error) {
      console.error('🔴 Ошибка регистрации:', error);

      // Детальная обработка ошибок
      if (error.message.includes('validation')) {
        return ctx.badRequest('Ошибка валидации данных. Проверьте правильность заполнения полей.');
      }

      ctx.badRequest('Ошибка регистрации: ' + error.message);
    }
  },

  async health(ctx) {
    ctx.send({
      status: 'OK',
      message: 'Registration API is working',
      timestamp: new Date().toISOString()
    });
  }
};