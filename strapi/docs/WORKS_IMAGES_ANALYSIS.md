# Анализ проблемы с загрузкой изображений работ из Strapi

## Проблема
Фотографии работ не отображаются на фронтенде, показывается только плейсхолдер `/placeholder-product.svg`.

## Проведенный анализ

### 1. Структура данных в Strapi
- ✅ Поле `images` существует в схеме `work` (multiple: true, required: true)
- ✅ Схема корректна: `"type": "media", "multiple": true`

### 2. API запросы
**Было:**
```javascript
'populate[images]': '*',
'populate[fabrics]': '*',
```

**Стало (как в продуктах, где работает):**
```javascript
'populate': '*',
```

**Вывод:** Используется тот же синтаксис populate, что и для продуктов, где изображения работают.

### 3. Обработка данных в WorksStore

**Проблемы, которые были найдены:**
1. ❌ Извлечение данных: использовалось только `attributes.images`, не проверялся `workData.images`
2. ❌ Обработка изображений: не использовался метод `_getStrapiImageUrl`, как в TkanStore
3. ❌ Сложная логика обработки разных форматов

**Исправления:**
1. ✅ Изменено на `workData.images || attributes.images` (как в TkanStore)
2. ✅ Добавлен метод `_getStrapiImageUrl` (идентичный TkanStore)
3. ✅ Упрощена логика `_processImageArray` для соответствия TkanStore

### 4. Компонент WorkCard
- ✅ Использует `useMemo` для вычисления `imageSrc`
- ✅ Использует `buildImageUrl` для обработки изображений
- ✅ Правильно обрабатывает массив `images` и поле `image`
- ✅ Плейсхолдер настроен правильно

### 5. Сравнение с работающим кодом (TkanStore)

| Аспект | TkanStore (работает) | WorksStore (было) | WorksStore (стало) |
|--------|---------------------|-------------------|-------------------|
| Populate | `'populate': '*'` | `'populate[images]': '*'` | `'populate': '*'` ✅ |
| Извлечение images | `workData.images \|\| attributes.images` | `attributes.images \|\| workData.images` | `workData.images \|\| attributes.images` ✅ |
| Метод обработки | `_getStrapiImageUrl(img)` | Прямой вызов `buildImageUrl` | `_getStrapiImageUrl(img)` ✅ |
| Фильтрация | `.filter(url => url !== '/placeholder-product.jpg')` | `.filter(url => url !== '/placeholder-product.svg')` | `.filter(url => url !== '/placeholder-product.svg')` ✅ |

## Внесенные изменения

### 1. API запросы (`src/http/products.js`)
```javascript
// Было:
'populate[images]': '*',
'populate[fabrics]': '*',

// Стало:
'populate': '*',
```

### 2. WorksStore (`src/store/WorksStore.jsx`)
- Добавлен метод `_getStrapiImageUrl` (идентичный TkanStore)
- Упрощена логика `_processImageArray`
- Исправлено извлечение данных: `workData.images || attributes.images`

### 3. WorkCard (`src/components/workcard/WorkCard.jsx`)
- Использует `useMemo` для оптимизации
- Правильно обрабатывает массив `images`
- Плейсхолдер настроен

## Возможные причины проблемы

1. **Strapi не перезапущен** после изменений схемы
   - Решение: Перезапустить Strapi сервер

2. **Данные не опубликованы**
   - Решение: Проверить, что работы имеют `publishedAt`

3. **Изображения не загружены в Strapi**
   - Решение: Проверить в админке Strapi, что в работах есть фотографии

4. **Неправильный формат данных от API**
   - Решение: Проверить логи в консоли браузера

## Рекомендации для отладки

1. Откройте консоль браузера (F12)
2. Проверьте логи:
   - `🖼️ Raw images data from work` - покажет, какие данные приходят
   - `🖼️ Processing work image array` - покажет процесс обработки
   - `🖼️ Built image URL` - покажет построенные URL

3. Проверьте сетевые запросы:
   - DevTools → Network → найдите запрос к `/api/works`
   - Проверьте ответ - должно быть поле `images` с данными

4. Проверьте в Strapi админке:
   - Работы опубликованы?
   - Есть ли фотографии в поле "Фотографии"?
   - Правильно ли заполнены данные?

## Следующие шаги

1. ✅ Исправлен синтаксис populate
2. ✅ Исправлена обработка данных
3. ✅ Добавлены методы как в TkanStore
4. ⏳ Перезапустить Strapi
5. ⏳ Проверить логи в консоли браузера
6. ⏳ Проверить данные в Strapi админке



