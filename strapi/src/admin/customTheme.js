/**
 * Кастомизация темы Strapi
 * Изменение акцентного цвета с #4945ff на ваш цвет
 * 
 * ИНСТРУКЦИЯ: Замените PRIMARY_COLOR ниже на ваш акцентный цвет в формате HEX
 */

// ⬇️ ЗАМЕНИТЕ ЭТОТ ЦВЕТ НА ВАШ АКЦЕНТНЫЙ ЦВЕТ ⬇️
const PRIMARY_COLOR = '#9B1E1C'; // Например: '#FF6B6B', '#4ECDC4', '#45B7D1', '#FF6B35'

/**
 * Функция для изменения яркости цвета
 */
function adjustBrightness(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export default {
  // Переопределение CSS переменных Strapi
  injectTheme: () => {
    if (typeof document === 'undefined') return;
    
    const style = document.createElement('style');
    style.id = 'strapi-custom-theme';
    style.textContent = `
      :root {
        /* Основной акцентный цвет Strapi */
        --strapi-primary-500: ${PRIMARY_COLOR} !important;
        --strapi-primary-600: ${adjustBrightness(PRIMARY_COLOR, -10)} !important;
        --strapi-primary-700: ${adjustBrightness(PRIMARY_COLOR, -20)} !important;
        --strapi-primary-100: ${adjustBrightness(PRIMARY_COLOR, 80)} !important;
        --strapi-primary-200: ${adjustBrightness(PRIMARY_COLOR, 60)} !important;
        
        /* Цвета для кнопок */
        --strapi-button-primary-500: ${PRIMARY_COLOR} !important;
        --strapi-button-primary-600: ${adjustBrightness(PRIMARY_COLOR, -10)} !important;
        
        /* Цвета для ссылок */
        --strapi-link-500: ${PRIMARY_COLOR} !important;
        
        /* Цвета для фокуса */
        --strapi-focus-500: ${PRIMARY_COLOR} !important;
      }
      
      /* Переопределение цветов для всех элементов с primary */
      [class*="primary"],
      [data-strapi-primary],
      button[class*="primary"],
      a[class*="primary"] {
        background-color: ${PRIMARY_COLOR} !important;
        border-color: ${PRIMARY_COLOR} !important;
        color: ${PRIMARY_COLOR} !important;
      }
      
      /* Специфичные селекторы для Strapi 5 */
      [class*="Button"][class*="primary"],
      [class*="Link"][class*="primary"],
      [class*="Badge"][class*="primary"] {
        background-color: ${PRIMARY_COLOR} !important;
        border-color: ${PRIMARY_COLOR} !important;
      }
    `;
    
    // Удаляем старый стиль, если есть
    const oldStyle = document.getElementById('strapi-custom-theme');
    if (oldStyle) {
      oldStyle.remove();
    }
    
    document.head.appendChild(style);
  }
};

