'use strict';

/**
 * Middleware для защиты development сервера
 * Защищает от уязвимости CVE-2025-22871 (esbuild development server)
 * Блокирует запросы с неразрешенных источников в development режиме
 */
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Применяем только в development режиме
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

    if (!isDevelopment) {
      // В production режиме пропускаем без проверок
      return await next();
    }

    // Разрешенные источники для development сервера
    const allowedOrigins = [
      'http://localhost:1337',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      'http://127.0.0.1:1337',
      'http://127.0.0.1:5173',
    ];

    // Проверяем Origin заголовок
    const origin = ctx.get('origin') || ctx.get('referer') || '';

    if (origin) {
      try {
        const originUrl = new URL(origin);
        const originHost = `${originUrl.protocol}//${originUrl.host}`;

        const isAllowed = allowedOrigins.some((allowed) => {
          return originHost === allowed || originHost.startsWith(allowed);
        });

        if (!isAllowed) {
          strapi.log.warn(
            `Blocked request from unauthorized origin in development: ${originHost}`
          );
          return ctx.forbidden('Доступ запрещен: неразрешенный источник в development режиме');
        }
      } catch (error) {
        // Если не удалось распарсить Origin, блокируем на всякий случай
        strapi.log.warn(`Blocked request with invalid origin: ${origin}`);
        return ctx.forbidden('Доступ запрещен: невалидный источник');
      }
    }

    // Устанавливаем строгие CORS заголовки для development
    ctx.set('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
    ctx.set('Access-Control-Allow-Credentials', 'true');
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    ctx.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Origin, Accept, X-Requested-With'
    );

    // Блокируем preflight запросы от неразрешенных источников
    if (ctx.method === 'OPTIONS') {
      const origin = ctx.get('origin');
      if (origin) {
        try {
          const originUrl = new URL(origin);
          const originHost = `${originUrl.protocol}//${originUrl.host}`;
          const isAllowed = allowedOrigins.some((allowed) => {
            return originHost === allowed || originHost.startsWith(allowed);
          });

          if (!isAllowed) {
            return ctx.forbidden('Доступ запрещен');
          }
        } catch (error) {
          return ctx.forbidden('Доступ запрещен');
        }
      }
    }

    await next();
  };
};
