# Руководство по предотвращению проблем

## 🔴 Проблема 1: Товары не отображаются в каталоге

### Причины:
- Несоответствие ID категорий между запросами
- Фильтрация по ID вместо slug
- Отсутствие fallback механизмов

### Решения для предотвращения:

#### 1. **Всегда используйте slug вместо ID для идентификации категорий**
```javascript
// ✅ ПРАВИЛЬНО - фильтрация по slug
filteredProducts = products.filter(p => p.category?.slug === categorySlug);

// ❌ НЕПРАВИЛЬНО - фильтрация по ID
filteredProducts = products.filter(p => p.category?.id === categoryId);
```

**Почему:** 
- Slug стабилен и не меняется между запросами
- ID может отличаться в разных запросах Strapi
- Slug более читаемый и предсказуемый

#### 2. **Используйте клиентскую фильтрацию как основной метод**
- Загружайте все товары один раз
- Фильтруйте на клиенте по slug
- Это гарантирует, что товары всегда найдутся

#### 3. **Добавьте валидацию данных**
```javascript
// Проверяйте наличие slug перед фильтрацией
if (!categorySlug) {
  logger.error('Category slug is missing');
  return [];
}

// Проверяйте структуру категории в товарах
if (!product.category?.slug) {
  logger.warn('Product missing category slug:', product.id);
}
```

#### 4. **Используйте стабильные идентификаторы**
- Slug для категорий ✅
- Slug для товаров ✅
- UUID для уникальных записей ✅
- ID только для внутренних операций ⚠️

---

## 🔴 Проблема 2: Бесконечные обновления страницы

### Причины:
- Отсутствие cleanup в useEffect
- Слишком частые интервалы
- Множественные вызовы функций
- Отсутствие проверки на размонтирование компонента

### Решения для предотвращения:

#### 1. **Всегда используйте cleanup в useEffect**
```javascript
// ✅ ПРАВИЛЬНО
useEffect(() => {
  let isMounted = true;
  let intervalId = null;
  
  const fetchData = async () => {
    if (!isMounted) return;
    // ... загрузка данных
  };
  
  fetchData();
  intervalId = setInterval(fetchData, 5000);
  
  return () => {
    isMounted = false;
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}, [dependencies]);

// ❌ НЕПРАВИЛЬНО - нет cleanup
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 2000);
  // Нет return с cleanup!
}, []);
```

#### 2. **Используйте разумные интервалы**
```javascript
// ✅ ПРАВИЛЬНО - не слишком часто
const INTERVAL = 5000; // 5 секунд минимум

// ❌ НЕПРАВИЛЬНО - слишком часто
const INTERVAL = 500; // Каждые 500мс - перегрузка!
```

#### 3. **Проверяйте, смонтирован ли компонент**
```javascript
useEffect(() => {
  let isMounted = true;
  
  const asyncOperation = async () => {
    const data = await fetchData();
    
    // Проверяем перед setState
    if (isMounted) {
      setData(data);
    }
  };
  
  asyncOperation();
  
  return () => {
    isMounted = false;
  };
}, []);
```

#### 4. **Используйте debounce/throttle для частых операций**
```javascript
import { debounce } from 'lodash';

const debouncedFetch = useMemo(
  () => debounce(fetchData, 300),
  []
);

useEffect(() => {
  debouncedFetch();
  return () => debouncedFetch.cancel();
}, []);
```

#### 5. **Мемоизируйте зависимости**
```javascript
// ✅ ПРАВИЛЬНО - стабильные зависимости
useEffect(() => {
  // ...
}, [categorySlug]); // Стабильное значение

// ❌ НЕПРАВИЛЬНО - нестабильные зависимости
useEffect(() => {
  // ...
}, [someObject, someArray]); // Объекты/массивы создаются заново каждый раз
```

---

## 🟡 Проблема 3: Избыточное логирование

### Решения:

#### 1. **Используйте уровни логирования**
```javascript
// Только в development
if (import.meta.env.DEV) {
  logger.log('Debug info');
}

// Только важные логи
logger.warn('Important warning');
logger.error('Error occurred');
```

#### 2. **Группируйте логи**
```javascript
// ✅ ПРАВИЛЬНО - группировка
logger.log('📦 Loading products:', {
  count: products.length,
  category: categorySlug
});

// ❌ НЕПРАВИЛЬНО - лог для каждого элемента
products.forEach(p => logger.log('Product:', p));
```

---

## 📋 Чек-лист перед коммитом

### Для фильтрации данных:
- [ ] Используется slug вместо ID для идентификации
- [ ] Есть fallback при отсутствии данных
- [ ] Проверяется структура данных перед использованием
- [ ] Есть обработка ошибок

### Для useEffect и интервалов:
- [ ] Есть cleanup функция в useEffect
- [ ] Используется флаг isMounted
- [ ] Интервалы очищаются при размонтировании
- [ ] Зависимости стабильны (не объекты/массивы)
- [ ] Интервалы не слишком частые (минимум 1-2 секунды)

### Для производительности:
- [ ] Нет избыточного логирования
- [ ] Используется мемоизация где нужно
- [ ] Debounce/throttle для частых операций
- [ ] Нет лишних перерисовок компонентов

### Для обработки данных:
- [ ] Проверяется наличие данных перед использованием
- [ ] Есть валидация типов данных
- [ ] Обрабатываются edge cases (пустые массивы, null, undefined)
- [ ] Есть понятные сообщения об ошибках

---

## 🛠️ Рекомендации по архитектуре

### 1. **Создайте единый хук для загрузки данных**
```javascript
// hooks/useDataLoader.js
export const useDataLoader = (fetchFn, dependencies, options = {}) => {
  const { interval = null, immediate = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;
    
    const load = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const result = await fetchFn();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    if (immediate) {
      load();
    }
    
    if (interval) {
      intervalId = setInterval(load, interval);
    }
    
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, dependencies);
  
  return { data, loading, error };
};
```

### 2. **Используйте константы для интервалов**
```javascript
// constants/timing.js
export const INTERVALS = {
  CART_UPDATE: 5000, // 5 секунд
  PRODUCTS_UPDATE: 10000, // 10 секунд
  CATEGORIES_UPDATE: 60000, // 1 минута
};
```

### 3. **Создайте утилиту для фильтрации по slug**
```javascript
// utils/filterBySlug.js
export const filterBySlug = (items, slugField, targetSlug) => {
  if (!targetSlug) return items;
  return items.filter(item => {
    const slug = item[slugField]?.slug || item[slugField];
    return slug === targetSlug;
  });
};

// Использование:
const filteredProducts = filterBySlug(products, 'category', categorySlug);
```

### 4. **Используйте React.memo для оптимизации**
```javascript
const ProductCard = React.memo(({ product }) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id;
});
```

---

## 🧪 Тестирование

### Рекомендуется добавить тесты для:

1. **Фильтрации товаров по slug**
```javascript
test('should filter products by category slug', () => {
  const products = [
    { id: 1, category: { slug: 'dak' } },
    { id: 2, category: { slug: 'len' } }
  ];
  const result = filterBySlug(products, 'category', 'dak');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe(1);
});
```

2. **Cleanup в useEffect**
```javascript
test('should cleanup interval on unmount', () => {
  const { unmount } = render(<ComponentWithInterval />);
  const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
  unmount();
  expect(clearIntervalSpy).toHaveBeenCalled();
});
```

---

## 📊 Мониторинг

### Добавьте метрики для отслеживания:

1. **Количество запросов к API**
2. **Время загрузки данных**
3. **Количество перерисовок компонентов**
4. **Частота обновлений**

### Используйте React DevTools Profiler
- Проверяйте компоненты на лишние рендеры
- Оптимизируйте медленные компоненты
- Отслеживайте производительность

---

## ✅ Итоговые рекомендации

1. **Всегда используйте slug для идентификации** вместо ID
2. **Всегда добавляйте cleanup** в useEffect с интервалами
3. **Используйте флаг isMounted** для проверки состояния компонента
4. **Установите разумные интервалы** (минимум 1-2 секунды)
5. **Мемоизируйте зависимости** useEffect
6. **Группируйте логи** и используйте уровни
7. **Добавьте валидацию данных** перед использованием
8. **Создайте переиспользуемые хуки** для общих паттернов
9. **Тестируйте критичные части** кода
10. **Мониторьте производительность** в production

Следуя этим рекомендациям, вы избежите большинства подобных проблем в будущем.

