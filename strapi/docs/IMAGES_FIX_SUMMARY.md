# Исправление проблемы с отображением изображений работ

## Проблема
Фотографии не отображаются на странице работы (WorkPage) и в карточках работ.

## Примененные исправления

### 1. Обновлены API запросы (`src/http/products.js`)
- Изменен формат `populate` с `populate: '*'` на явное указание полей:
  - `populate[0]=images` - для получения массива изображений
  - `populate[1]=fabrics` - для получения связанных тканей
  - `populate[2]=fabrics.image` - для получения изображений тканей

Это соответствует документации Strapi v4 для множественных медиа-файлов.

### 2. Улучшена обработка данных изображений (`src/store/WorksStore.jsx`)
- Добавлена более детальная проверка расположения данных `images`:
  - `workData.images`
  - `attributes.images`
  - `workData.attributes.images`
- Добавлено расширенное логирование для отладки
- Временно отключен кеш для загрузки свежих данных

### 3. Улучшена функция `buildImageUrl` (`src/utils/apiConfig.js`)
- Добавлена поддержка различных форматов данных Strapi v4:
  - `imageData.data[0].attributes.url`
  - `imageData.attributes.data[0].attributes.url`
  - Вложенные структуры с `data.attributes.url`

### 4. Обновлен компонент WorkPage (`src/pages/WorkPage/WorkPage.jsx`)
- Добавлен fallback: если массив `images` пустой, используется `work.image`
- Добавлено логирование для отладки

## Структура данных Strapi v4 для множественных медиа-файлов

Согласно документации Strapi v4, структура ответа для множественных медиа-файлов:

```json
{
  "images": {
    "data": [
      {
        "id": 12,
        "attributes": {
          "url": "/uploads/image.jpg",
          "name": "image.jpg",
          "alternativeText": null,
          "caption": null,
          "width": 1920,
          "height": 1080,
          "formats": { ... },
          "hash": "...",
          "ext": ".jpg",
          "mime": "image/jpeg",
          "size": 123.45,
          "previewUrl": null,
          "provider": "local",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      }
    ]
  }
}
```

## Следующие шаги для отладки

1. **Проверьте консоль браузера** - должны появиться логи:
   - `📦 Work by ID response` - показывает ответ API
   - `🖼️ Raw images data from work` - показывает данные изображений
   - `🖼️ Processed images array` - показывает обработанные URL изображений
   - `🖼️ WorkPage images debug` - показывает, что видит компонент

2. **Проверьте Network запросы** (F12 → Network):
   - Найдите запрос к `/api/works/{id}`
   - Проверьте, что в ответе есть поле `images` с данными
   - Убедитесь, что запрос использует правильные параметры `populate`

3. **Проверьте Strapi админку**:
   - Работа опубликована (publishedAt не null)
   - В работе загружены фотографии в поле "Фотографии" (images)
   - Фотографии имеют правильные URL

4. **Проверьте права доступа**:
   - В Strapi Settings → Users & Permissions Plugin → Roles → Public
   - Убедитесь, что для `work` включены права `find` и `findOne`

## Возможные причины проблемы

1. **Изображения не загружены в Strapi** - проверьте админку
2. **Работа не опубликована** - проверьте `publishedAt`
3. **Неправильные права доступа** - проверьте Public role permissions
4. **Неправильный формат populate** - теперь используется явное указание полей
5. **Кеш браузера** - очистите кеш или используйте режим инкогнито

## Дополнительная информация

- Документация Strapi v4: https://docs.strapi.io/dev-docs/api/rest/populate-select
- Формат множественных медиа-файлов: https://docs.strapi.io/dev-docs/plugins/upload



