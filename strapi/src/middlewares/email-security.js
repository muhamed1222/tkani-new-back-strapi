'use strict';

/**
 * Middleware для защиты email функциональности
 * Защищает от уязвимостей nodemailer:
 * - Email может быть отправлен на непреднамеренный домен
 * - DoS через рекурсивные вызовы в addressparser
 */
module.exports = (config, { strapi }) => {
  // Rate limiting для email отправки
  const emailRateLimit = new Map();
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 минута
  const MAX_EMAILS_PER_WINDOW = 5; // Максимум 5 email в минуту с одного IP

  /**
   * Валидирует email адрес
   */
  const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // Базовая проверка формата
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Проверка на опасные символы, которые могут использоваться для обхода валидации
    const dangerousPatterns = [
      /@.*@/, // Множественные @
      /\.\./, // Двойные точки
      /^\./, // Начинается с точки
      /\.$/, // Заканчивается точкой
      /@\./, // @ перед точкой
      /\.@/, // Точка перед @
      /\s/, // Пробелы
      /[<>]/, // Угловые скобки
      /["']/, // Кавычки (могут использоваться для обхода)
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(email)) {
        return false;
      }
    }

    // Проверка длины
    if (email.length > 254) {
      return false;
    }

    // Извлекаем домен
    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }

    const domain = parts[1].toLowerCase();

    // Проверка домена на валидность
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return false;
    }

    // Блокируем подозрительные домены
    const suspiciousDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '[::1]',
    ];

    if (suspiciousDomains.includes(domain)) {
      return false;
    }

    return true;
  };

  /**
   * Проверяет rate limit для email отправки
   */
  const checkRateLimit = (ip) => {
    const now = Date.now();
    const userLimit = emailRateLimit.get(ip);

    if (!userLimit) {
      emailRateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      return true;
    }

    // Сброс счетчика, если окно истекло
    if (now > userLimit.resetAt) {
      emailRateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      return true;
    }

    // Проверка лимита
    if (userLimit.count >= MAX_EMAILS_PER_WINDOW) {
      return false;
    }

    // Увеличиваем счетчик
    userLimit.count++;
    return true;
  };

  return async (ctx, next) => {
    // Проверяем только запросы, связанные с отправкой email
    const isEmailRequest =
      ctx.path.includes('/email') ||
      ctx.path.includes('/forgot-password') ||
      ctx.path.includes('/reset-password') ||
      ctx.path.includes('/registration') ||
      ctx.method === 'POST' && ctx.request.body?.email;

    if (isEmailRequest) {
      const clientIp =
        ctx.request.ip ||
        ctx.request.headers['x-forwarded-for']?.split(',')[0] ||
        ctx.request.connection?.remoteAddress ||
        'unknown';

      // Проверка rate limit
      if (!checkRateLimit(clientIp)) {
        strapi.log.warn(`Email rate limit exceeded for IP: ${clientIp}`);
        return ctx.tooManyRequests(
          'Превышен лимит запросов. Пожалуйста, попробуйте позже.'
        );
      }

      // Валидация email адресов в теле запроса
      const email = ctx.request.body?.email || ctx.request.body?.to;

      if (email) {
        // Обрабатываем как строку, так и массив
        const emails = Array.isArray(email) ? email : [email];

        for (const emailAddr of emails) {
          if (!isValidEmail(emailAddr)) {
            strapi.log.warn(`Blocked invalid email address: ${emailAddr} from IP: ${clientIp}`);
            return ctx.badRequest('Недопустимый формат email адреса');
          }
        }
      }
    }

    await next();
  };
};
