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

      // Всегда возвращаем успех для безопасности
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

      try {
        // Отправляем письмо с кодом
        await strapi.plugins['email'].services.email.send({
          to: email,
          from: 'centertkani-shop@yandex.com',
          subject: 'Код для сброса пароля',
          text: `
            Запрос на сброс пароля
        
        Ваш код для сброса пароля: ${resetCode}
        
        Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
        
        С уважением,
        Команда centertkani-shop
          `,
          html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Запрос на сброс пароля</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 18px; margin-bottom: 10px;">Ваш код для сброса пароля:</p>
            <div style="background-color: #fff; padding: 15px; border: 2px dashed #333; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
              ${resetCode}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Введите этот код на странице сброса пароля.
            Код действителен в течение 1 часа.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            Если вы не запрашивали сброс пароля, проигнорируйте это письмо.<br>
            С уважением,<br>
            Команда centertkani-shop
          </p>
        </div>
          `,
        });

        console.log('📧 Письмо с кодом отправлено на:', email);
      } catch (emailError) {
        console.error('🔴 Ошибка отправки письма:', emailError);
        // Продолжаем выполнение, т.к. код уже сгенерирован
      }

      // В продакшене убираем code из ответа
      ctx.send({
        success: true,
        message: 'Если email зарегистрирован, код будет отправлен на почту',
        debug: process.env.NODE_ENV === 'development',
        ...(process.env.NODE_ENV === 'development' && { code: resetCode })
      });

    } catch (error) {
      console.error('🔴 Ошибка отправки кода сброса:', error);

      // Для безопасности всегда возвращаем успех
      ctx.send({
        success: true,
        message: 'Если email зарегистрирован, код будет отправлен на почту'
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

      // Отправляем уведомление об успешном сбросе пароля
      try {
        await strapi.plugins['email'].services.email.send({
          to: user.email,
          from: 'centertkani-shop@yandex.com',
          subject: 'Пароль успешно изменен',
          text: `
            Ваш пароль был успешно изменен.
        
        Если это были не вы, немедленно свяжитесь с поддержкой.
        
        С уважением,
        Команда centertkani-shop
          `,
          html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Пароль успешно изменен</h2>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 16px; margin-bottom: 10px;">
              Пароль для вашего аккаунта был успешно изменен.
            </p>
            <p style="font-size: 14px; color: #666;">
              Если это были не вы, немедленно свяжитесь с поддержкой.
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            С уважением,<br>
            Команда centertkani-shop
          </p>
        </div>
          `,
        });

        console.log('📧 Уведомление об изменении пароля отправлено');
      } catch (emailError) {
        console.error('🔴 Ошибка отправки уведомления:', emailError);
      }

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