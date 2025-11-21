// src/extensions/users-permissions/controllers/auth.js
'use strict';

module.exports = {
  async register(ctx) {
    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    const settings = await pluginStore.get({
      key: 'advanced',
    });

    if (!settings.allow_register) {
      return ctx.badRequest(
        null,
        ctx.request.admin ? [{ messages: [{ id: 'Auth.advanced.allow_register' }] }] : 'Register action is currently disabled.'
      );
    }

    const params = {
      ...ctx.request.body,
      // ✅ РАЗРЕШАЕМ КАСТОМНЫЕ ПОЛЯ
      firstName: ctx.request.body.firstName,
      lastName: ctx.request.body.lastName,
      phone: ctx.request.body.phone,
      provider: 'local',
    };

    // Password is required.
    if (!params.password) {
      return ctx.badRequest(
        null,
        ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.password.provide' }] }] : 'Please provide your password.'
      );
    }

    // Email is required.
    if (!params.email) {
      return ctx.badRequest(
        null,
        ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.email.provide' }] }] : 'Please provide your email.'
      );
    }

    // Username is required.
    if (!params.username) {
      return ctx.badRequest(
        null,
        ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.username.provide' }] }] : 'Please provide your username.'
      );
    }

    // First name, last name, phone are required (добавляем валидацию)
    if (!params.firstName) {
      return ctx.badRequest(null, 'Please provide your first name.');
    }

    if (!params.lastName) {
      return ctx.badRequest(null, 'Please provide your last name.');
    }

    if (!params.phone) {
      return ctx.badRequest(null, 'Please provide your phone number.');
    }

    const role = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: settings.default_role } });

    if (!role) {
      return ctx.badRequest(
        null,
        ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.role.notFound' }] }] : 'Impossible to find the default role.'
      );
    }

    // Check if the provided email is valid or not.
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(params.email)) {
      return ctx.badRequest(
        null,
        ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.email.format' }] }] : 'Please provide valid email address.'
      );
    }

    params.role = role.id;
    params.email = params.email.toLowerCase();

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: params.email },
    });

    if (user && user.provider === params.provider) {
      return ctx.badRequest(
        null,
        ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.email.taken' }] }] : 'Email is already taken.'
      );
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      return ctx.badRequest(
        null,
        ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.email.taken' }] }] : 'Email is already taken.'
      );
    }

    try {
      if (!settings.email_confirmation) {
        params.confirmed = true;
      }

      const user = await strapi
        .service('plugin::users-permissions.user')
        .add(params);

      const sanitizedUser = await strapi
        .service('plugin::users-permissions.user')
        .sanitizeUser(user);

      if (settings.email_confirmation) {
        try {
          await strapi
            .service('plugin::users-permissions.user')
            .sendConfirmationEmail(sanitizedUser);
        } catch (err) {
          return ctx.badRequest(null, err);
        }

        return ctx.send({ user: sanitizedUser });
      }

      const jwt = strapi.service('plugin::users-permissions.jwt').issue({
        id: user.id,
      });

      return ctx.send({
        jwt,
        user: sanitizedUser,
      });
    } catch (err) {
      if (err.message.includes('username')) {
        return ctx.badRequest(
          null,
          ctx.request.admin ? [{ messages: [{ id: 'Auth.form.error.username.taken' }] }] : 'Username is already taken.'
        );
      }
      strapi.log.error(err);
      return ctx.badRequest(null, err.message);
    }
  },
};