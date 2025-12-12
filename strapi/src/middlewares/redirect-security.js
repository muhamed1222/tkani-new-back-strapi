'use strict';

/**
 * Middleware для защиты от Open Redirect уязвимостей
 * Защищает от манипуляций с Referrer header и небезопасных редиректов
 */
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Список разрешенных доменов для редиректов
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      'centertkani.ru',
      'www.centertkani.ru',
      'api.centertkani.ru',
      'cms.centertkani.ru',
    ];

    /**
     * Проверяет, является ли URL безопасным для редиректа
     */
    const isSafeRedirect = (url) => {
      if (!url) return false;

      try {
        // Если это относительный URL, он безопасен
        if (url.startsWith('/')) {
          return true;
        }

        // Парсим URL
        const urlObj = new URL(url, 'http://localhost');
        const hostname = urlObj.hostname;

        // Проверяем, что домен в списке разрешенных
        return allowedDomains.some((domain) => {
          return hostname === domain || hostname.endsWith(`.${domain}`);
        });
      } catch (error) {
        // Если не удалось распарсить URL, считаем небезопасным
        return false;
      }
    };

    // Переопределяем ctx.redirect для дополнительной защиты
    const originalRedirect = ctx.redirect.bind(ctx);
    ctx.redirect = (url, alt) => {
      if (!isSafeRedirect(url)) {
        strapi.log.warn(`Blocked unsafe redirect attempt to: ${url}`);
        // Перенаправляем на безопасный URL (главную страницу)
        return originalRedirect(alt || '/');
      }
      return originalRedirect(url, alt);
    };

    // Очищаем Referrer header, если он указывает на внешний домен
    const referer = ctx.get('referer') || ctx.get('referrer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const isInternal = allowedDomains.some((domain) => {
          return (
            refererUrl.hostname === domain ||
            refererUrl.hostname.endsWith(`.${domain}`)
          );
        });

        if (!isInternal) {
          // Удаляем небезопасный Referrer header
          ctx.remove('referer');
          ctx.remove('referrer');
        }
      } catch (error) {
        // Если не удалось распарсить, удаляем на всякий случай
        ctx.remove('referer');
        ctx.remove('referrer');
      }
    }

    await next();
  };
};
