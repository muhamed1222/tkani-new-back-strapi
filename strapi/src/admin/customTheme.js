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
      
      /* ============================================
         АДАПТИВНЫЕ СТИЛИ ДЛЯ ПЛАНШЕТНОЙ ВЕРСИИ
         ============================================ */
      
      /* Планшеты (768px - 1024px) */
      @media screen and (min-width: 768px) and (max-width: 1024px) {
        /* Боковое меню - уменьшаем ширину */
        [class*="Sidebar"],
        [class*="sidebar"],
        nav[class*="Sidebar"] {
          width: 200px !important;
          min-width: 200px !important;
        }
        
        /* Основной контент - увеличиваем отступ */
        [class*="Main"],
        [class*="main-content"],
        main[class*="Main"] {
          margin-left: 200px !important;
          padding: 16px !important;
        }
        
        /* Заголовки - уменьшаем размер */
        h1, [class*="Title"][class*="h1"] {
          font-size: 24px !important;
          line-height: 32px !important;
        }
        
        h2, [class*="Title"][class*="h2"] {
          font-size: 20px !important;
          line-height: 28px !important;
        }
        
        h3, [class*="Title"][class*="h3"] {
          font-size: 18px !important;
          line-height: 24px !important;
        }
        
        /* Таблицы - адаптивная ширина */
        [class*="Table"],
        table {
          font-size: 14px !important;
        }
        
        [class*="Table"] th,
        [class*="Table"] td {
          padding: 8px 12px !important;
        }
        
        /* Карточки - уменьшаем отступы */
        [class*="Card"],
        [class*="card"] {
          padding: 16px !important;
          margin-bottom: 16px !important;
        }
        
        /* Формы - оптимизация для планшетов */
        [class*="Form"],
        form {
          max-width: 100% !important;
        }
        
        [class*="Input"],
        [class*="input"],
        input[type="text"],
        input[type="email"],
        input[type="password"],
        textarea,
        select {
          font-size: 14px !important;
          padding: 10px 12px !important;
        }
        
        /* Кнопки - удобный размер для тач-интерфейса */
        [class*="Button"],
        button {
          min-height: 40px !important;
          padding: 10px 16px !important;
          font-size: 14px !important;
        }
        
        /* Модальные окна - адаптивная ширина */
        [class*="Modal"],
        [class*="Dialog"],
        [role="dialog"] {
          max-width: 90% !important;
          margin: 20px auto !important;
        }
        
        /* Навигация - компактная версия */
        [class*="Nav"],
        [class*="Navigation"],
        nav {
          padding: 8px 12px !important;
        }
        
        /* Списки - оптимизация */
        [class*="List"],
        ul, ol {
          padding-left: 20px !important;
        }
        
        /* Иконки - немного уменьшаем */
        [class*="Icon"],
        svg {
          width: 18px !important;
          height: 18px !important;
        }
        
        /* Тултипы и подсказки */
        [class*="Tooltip"],
        [class*="tooltip"] {
          font-size: 12px !important;
        }
        
        /* Поиск - адаптивная ширина */
        [class*="Search"],
        [class*="search"],
        input[type="search"] {
          max-width: 300px !important;
        }
        
        /* Фильтры - вертикальное расположение */
        [class*="Filter"],
        [class*="filter"] {
          flex-direction: column !important;
          gap: 12px !important;
        }
        
        /* Сетки - 2 колонки вместо 3-4 */
        [class*="Grid"][class*="three"],
        [class*="Grid"][class*="four"] {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }
      
      /* Планшеты в портретной ориентации (768px - 900px) */
      @media screen and (min-width: 768px) and (max-width: 900px) {
        /* Боковое меню - еще компактнее */
        [class*="Sidebar"],
        [class*="sidebar"],
        nav[class*="Sidebar"] {
          width: 180px !important;
          min-width: 180px !important;
        }
        
        [class*="Main"],
        [class*="main-content"],
        main[class*="Main"] {
          margin-left: 180px !important;
        }
        
        /* Карточки - одна колонка */
        [class*="Grid"] {
          grid-template-columns: 1fr !important;
        }
        
        /* Таблицы - горизонтальная прокрутка */
        [class*="Table"] {
          overflow-x: auto !important;
          display: block !important;
        }
      }
      
      /* Планшеты в альбомной ориентации (900px - 1024px) */
      @media screen and (min-width: 900px) and (max-width: 1024px) {
        /* Оптимальное использование пространства */
        [class*="Container"],
        [class*="container"] {
          max-width: 100% !important;
          padding: 0 16px !important;
        }
        
        /* Сетки - 2-3 колонки */
        [class*="Grid"][class*="four"] {
          grid-template-columns: repeat(3, 1fr) !important;
        }
      }
      
      /* Улучшения для тач-интерфейса на планшетах */
      @media screen and (min-width: 768px) and (max-width: 1024px) and (hover: none) {
        /* Увеличиваем области клика */
        [class*="Button"],
        button,
        [class*="Link"],
        a,
        [role="button"] {
          min-height: 44px !important;
          min-width: 44px !important;
        }
        
        /* Улучшаем видимость фокуса */
        [class*="Button"]:focus,
        button:focus,
        [class*="Input"]:focus,
        input:focus {
          outline: 2px solid ${PRIMARY_COLOR} !important;
          outline-offset: 2px !important;
        }
        
        /* Убираем hover эффекты, заменяем на active */
        [class*="Button"]:hover,
        button:hover {
          transform: none !important;
        }
        
        [class*="Button"]:active,
        button:active {
          opacity: 0.8 !important;
          transform: scale(0.98) !important;
        }
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

