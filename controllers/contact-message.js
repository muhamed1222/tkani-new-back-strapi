'use strict';
module.exports = {
  async send(ctx) {
    try {
      const { name, phone, message } = ctx.request.body;
      if (!name || !phone || !message) {
        return ctx.badRequest('Заполните все поля');
      }
      try {
        const entry = await strapi.entityService.create('api::contact-message.contact-message', {
          data: {
            name,
            phone,
            message,
            read: false,
            publishedAt: new Date()
          }
        });
      } catch (dbError) {
        console.warn('Ошибка БД:', dbError.message);
      }
      try {
        await strapi.plugins['email'].services.email.send({
          to: 'centertkani-shop@yandex.com',
          from: 'centertkani-shop@yandex.com',
          subject: `Новое сообщение от ${name}`,
          text: `
НОВОЕ СООБЩЕНИЕ С САЙТА CENTER TKANI

Имя: ${name}
Телефон: ${phone}

Сообщение:
${message}

Отправлено: ${new Date().toLocaleString('ru-RU')}
          `,
          html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Новое сообщение</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; }
        .header { background-color: #9B1E1C; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .field { margin-bottom: 15px; }
        .field-label { font-weight: bold; color: #666; margin-bottom: 5px; }
        .field-value { background-color: white; padding: 10px; border-radius: 4px; border-left: 3px solid #9B1E1C; }
        .message-box { background-color: white; padding: 15px; border-radius: 4px; border: 1px solid #ddd; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Новое сообщение с сайта CENTER TKANI</h1>
    </div>
    
    <div class="content">
        <div class="field">
            <div class="field-label">Имя:</div>
            <div class="field-value">${name}</div>
        </div>
        
        <div class="field">
            <div class="field-label">Телефон:</div>
            <div class="field-value">${phone}</div>
        </div>
        
        <div class="field">
            <div class="field-label">Сообщение:</div>
            <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
        </div>
    </div>
    
    <div class="footer">
        <p>Отправлено: ${new Date().toLocaleString('ru-RU')}</p>
        <p>Сайт: cms.centertkani.ru</p>
    </div>
</body>
</html>
          `
        });
      } catch (emailError) {
        console.error('Ошибка отправки:', emailError);
      }

      ctx.send({
        success: true,
        message: 'Сообщение отправлено!'
      });

    } catch (error) {
      console.error('Ошибка:', error);
      ctx.send({
        success: false,
        message: 'Ошибка сервера'
      }, 500);
    }
  }
};