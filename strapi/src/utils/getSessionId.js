/**
 * Утилита для работы с session_id для неавторизованных пользователей
 * Используется для идентификации корзины неавторизованных пользователей
 */

/**
 * Генерирует уникальный session_id
 * @returns {string} Уникальный session ID
 */
function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random}`;
}

/**
 * Получает session_id из заголовков запроса или cookie
 * Если session_id нет, генерирует новый
 * @param {Object} ctx - Koa context
 * @returns {string} Session ID
 */
function getSessionId(ctx) {
  // Пытаемся получить из заголовка
  let sessionId = ctx.request.headers['x-session-id'];
  
  // Если нет в заголовке, пытаемся получить из cookie
  if (!sessionId && ctx.cookies) {
    sessionId = ctx.cookies.get('cart_session_id');
  }
  
  // Если все еще нет, генерируем новый
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  
  return sessionId;
}

/**
 * Устанавливает session_id в cookie
 * @param {Object} ctx - Koa context
 * @param {string} sessionId - Session ID для установки
 */
function setSessionIdCookie(ctx, sessionId) {
  if (ctx.cookies) {
    // Устанавливаем cookie на 30 дней
    ctx.cookies.set('cart_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      path: '/',
    });
  }
}

module.exports = {
  generateSessionId,
  getSessionId,
  setSessionIdCookie,
};

