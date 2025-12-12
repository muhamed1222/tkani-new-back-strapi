'use strict';

module.exports = {
  async sendCode(ctx) {
    try {
      const { email } = ctx.request.body;

      if (!email) {
        return ctx.badRequest('Email обязателен');
      }

      console.log('🔵 Запрос на сброс пароля для:', email);

      // Проверяем существование пользователя
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: email.toLowerCase() },
      });

      // Всегда возвращаем успех для безопасности (даже если пользователь не найден)
      if (!user) {
        console.log('🟡 Пользователь не найден, но возвращаем успех для безопасности');
        return ctx.send({
          success: true,
          message: 'Если email зарегистрирован, код будет отправлен'
        });
      }

      // Генерируем простой код (6 символов)
      const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Сохраняем код в базе данных
      await strapi.entityService.update('plugin::users-permissions.user', user.id, {
        data: {
          resetPasswordToken: resetCode,
        }
      });

      console.log('🟢 Код сброса пароля сгенерирован:', resetCode);
      console.log('📧 Код для пользователя', email, ':', resetCode);

      // Возвращаем код в ответе (для разработки)
      ctx.send({
        success: true,
        message: 'Код для сброса пароля: ' + resetCode,
        code: resetCode, // Для разработки
        debug: true
      });

    } catch (error) {
      console.error('🔴 Ошибка отправки кода сброса:', error);

      // Для безопасности всегда возвращаем успех
      ctx.send({
        success: true,
        message: 'Если email зарегистрирован, код будет отправлен'
      });
    }
  },

  async resetPassword(ctx) {
    try {
      const { code, password, passwordConfirmation } = ctx.request.body;

      if (!code || !password || !passwordConfirmation) {
        return ctx.badRequest('Все поля обязательны');
      }

      if (password !== passwordConfirmation) {
        return ctx.badRequest('Пароли не совпадают');
      }

      if (password.length < 6) {
        return ctx.badRequest('Пароль должен содержать минимум 6 символов');
      }

      console.log('🔵 Сброс пароля с кодом:', code);

      // Ищем пользователя по коду
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { resetPasswordToken: code },
      });

      if (!user) {
        return ctx.badRequest('Неверный код или срок его действия истек');
      }

      // Обновляем пароль
      await strapi.entityService.update('plugin::users-permissions.user', user.id, {
        data: {
          password: password,
          resetPasswordToken: null,
        }
      });

      console.log('🟢 Пароль успешно сброшен для пользователя:', user.email);

      ctx.send({
        success: true,
        message: 'Пароль успешно изменен',
      });

    } catch (error) {
      console.error('🔴 Ошибка сброса пароля:', error);
      ctx.badRequest('Ошибка сброса пароля: ' + error.message);
    }
  }
};