# Исправление прав доступа для загрузки файлов (403 Forbidden)

## Проблема
При попытке загрузить аватар получаем ошибку `403 Forbidden` от `/api/upload`.

## Причина
В Strapi нужно настроить права доступа для upload plugin, чтобы аутентифицированные пользователи могли загружать файлы.

## Решение

### Вариант 1: Настройка через Strapi Admin Panel (Рекомендуется)

1. Войдите в Strapi Admin Panel: `http://localhost:1337/admin`
2. Перейдите в **Settings** → **Users & Permissions plugin** → **Roles**
3. Выберите роль **Authenticated** (или роль, которую использует ваш пользователь)
4. **ВАЖНО:** Найдите раздел **"Media Library"** в списке разрешений (это и есть `plugin::upload`)
   - В списке плагинов вы увидите "Media Library" с подписью "plugin::upload"
   - Это НЕ в разделе API endpoints (там показаны только api::banner, api::cart и т.д.)
   - Это в разделе **Plugins** (плагины)
5. Раскройте раздел **"Media Library"** (нажмите на стрелку ▼)
6. Включите следующие права:
   - ✅ **upload** → **create** (загрузка файлов)
   - ✅ **upload** → **read** (чтение файлов)
   - ✅ **upload** → **update** (обновление файлов)
   - ✅ **upload** → **delete** (удаление файлов) - опционально
7. Нажмите **Save**

### Вариант 2: Настройка через код (для production)

Если нужно настроить права программно, можно создать bootstrap файл:

```javascript
// strapi/src/index.js или отдельный bootstrap файл
module.exports = {
  async bootstrap({ strapi }) {
    // Найти роль Authenticated
    const authenticatedRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (authenticatedRole) {
      // Получить все разрешения для upload
      const uploadPermissions = await strapi
        .query('plugin::users-permissions.permission')
        .findMany({
          where: {
            role: authenticatedRole.id,
            action: { $in: ['upload.create', 'upload.read', 'upload.update'] }
          }
        });

      // Если разрешений нет, создать их
      if (uploadPermissions.length === 0) {
        await strapi
          .query('plugin::users-permissions.permission')
          .createMany({
            data: [
              {
                role: authenticatedRole.id,
                action: 'upload.create',
                enabled: true,
              },
              {
                role: authenticatedRole.id,
                action: 'upload.read',
                enabled: true,
              },
              {
                role: authenticatedRole.id,
                action: 'upload.update',
                enabled: true,
              },
            ],
          });
      }
    }
  },
};
```

### Вариант 3: Проверка через API

Можно проверить текущие права через API:

```bash
# Получить информацию о текущем пользователе
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:1337/api/users/me

# Проверить права роли
curl http://localhost:1337/api/users-permissions/roles
```

## Проверка

После настройки прав:

1. Перезапустите Strapi сервер
2. Попробуйте загрузить аватар снова
3. Проверьте логи в консоли браузера - должно быть `200 OK` вместо `403 Forbidden`

## Дополнительные настройки

### Ограничение размера файла

В `strapi/config/plugins.js` можно настроить максимальный размер файла:

```javascript
module.exports = {
  upload: {
    config: {
      sizeLimit: 5 * 1024 * 1024, // 5MB
    },
  },
};
```

### Ограничение типов файлов

```javascript
module.exports = {
  upload: {
    config: {
      sizeLimit: 5 * 1024 * 1024,
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      },
      // Разрешенные типы файлов
      mimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    },
  },
};
```

## Отладка

Если проблема сохраняется:

1. Проверьте токен авторизации:
   - Откройте DevTools → Network
   - Найдите запрос к `/api/upload`
   - Проверьте заголовок `Authorization: Bearer ...`

2. Проверьте права пользователя:
   - Войдите в Strapi Admin
   - Проверьте роль пользователя
   - Убедитесь, что права на upload включены

3. Проверьте логи Strapi:
   - Посмотрите логи сервера Strapi
   - Ищите ошибки связанные с permissions или upload

