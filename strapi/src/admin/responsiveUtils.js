/**
 * Утилиты для адаптивного дизайна админ-панели Strapi
 * Поддержка планшетной и мобильной версий
 */

/**
 * Определяет, является ли устройство планшетом
 * @returns {boolean}
 */
export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 768 && width <= 1024;
};

/**
 * Определяет, является ли устройство мобильным
 * @returns {boolean}
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Определяет, является ли устройство десктопом
 * @returns {boolean}
 */
export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > 1024;
};

/**
 * Определяет ориентацию устройства
 * @returns {'portrait' | 'landscape'}
 */
export const getOrientation = () => {
  if (typeof window === 'undefined') return 'landscape';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

/**
 * Проверяет, поддерживает ли устройство тач-интерфейс
 * @returns {boolean}
 */
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Получает текущий breakpoint
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
export const getBreakpoint = () => {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
};

/**
 * Хук для отслеживания изменений размера окна
 * @param {Function} callback - Функция обратного вызова
 * @returns {Function} Функция для отписки
 */
export const onResize = (callback) => {
  if (typeof window === 'undefined') return () => {};
  
  let ticking = false;
  const handleResize = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        callback({
          width: window.innerWidth,
          height: window.innerHeight,
          breakpoint: getBreakpoint(),
          orientation: getOrientation(),
          isTablet: isTablet(),
          isMobile: isMobile(),
          isDesktop: isDesktop(),
          isTouch: isTouchDevice(),
        });
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('resize', handleResize);
  handleResize(); // Вызываем сразу для получения начальных значений
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
};

/**
 * Получает оптимальное количество колонок для сетки в зависимости от breakpoint
 * @param {Object} options - Опции
 * @param {number} options.mobile - Колонки для мобильных (по умолчанию 1)
 * @param {number} options.tablet - Колонки для планшетов (по умолчанию 2)
 * @param {number} options.desktop - Колонки для десктопов (по умолчанию 3)
 * @returns {number}
 */
export const getGridColumns = ({ mobile = 1, tablet = 2, desktop = 3 } = {}) => {
  const breakpoint = getBreakpoint();
  switch (breakpoint) {
    case 'mobile':
      return mobile;
    case 'tablet':
      return tablet;
    case 'desktop':
      return desktop;
    default:
      return desktop;
  }
};

/**
 * Получает оптимальный размер шрифта в зависимости от breakpoint
 * @param {Object} sizes - Размеры для разных breakpoints
 * @param {string|number} sizes.mobile - Размер для мобильных
 * @param {string|number} sizes.tablet - Размер для планшетов
 * @param {string|number} sizes.desktop - Размер для десктопов
 * @returns {string|number}
 */
export const getResponsiveFontSize = ({ mobile, tablet, desktop }) => {
  const breakpoint = getBreakpoint();
  switch (breakpoint) {
    case 'mobile':
      return mobile;
    case 'tablet':
      return tablet;
    case 'desktop':
      return desktop;
    default:
      return desktop;
  }
};

/**
 * Получает оптимальный padding в зависимости от breakpoint
 * @param {Object} paddings - Отступы для разных breakpoints
 * @param {string|number} paddings.mobile - Отступ для мобильных
 * @param {string|number} paddings.tablet - Отступ для планшетов
 * @param {string|number} paddings.desktop - Отступ для десктопов
 * @returns {string|number}
 */
export const getResponsivePadding = ({ mobile = '12px', tablet = '16px', desktop = '24px' } = {}) => {
  const breakpoint = getBreakpoint();
  switch (breakpoint) {
    case 'mobile':
      return mobile;
    case 'tablet':
      return tablet;
    case 'desktop':
      return desktop;
    default:
      return desktop;
  }
};

export default {
  isTablet,
  isMobile,
  isDesktop,
  getOrientation,
  isTouchDevice,
  getBreakpoint,
  onResize,
  getGridColumns,
  getResponsiveFontSize,
  getResponsivePadding,
};

