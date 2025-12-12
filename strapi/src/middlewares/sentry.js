'use strict';

const Sentry = require('@sentry/node');

module.exports = (config, { strapi }) => {
  const { dsn, environment } = config;

  if (!dsn) {
    strapi.log.warn('Sentry DSN not provided, Sentry middleware disabled');
    return async (ctx, next) => {
      await next();
    };
  }

  // Инициализация Sentry
  Sentry.init({
    dsn,
    environment: environment || 'development',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    tracesSampleRate: 1.0,
  });

  strapi.log.info('Sentry middleware initialized');

  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      // Логирование ошибки в Sentry
      Sentry.captureException(error, {
        tags: {
          path: ctx.request.path,
          method: ctx.request.method,
        },
        extra: {
          request: {
            url: ctx.request.url,
            headers: ctx.request.headers,
            body: ctx.request.body,
          },
          user: ctx.state?.user,
        },
      });

      // Пробрасываем ошибку дальше
      throw error;
    }
  };
};
