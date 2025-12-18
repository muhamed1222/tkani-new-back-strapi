# Отладка 401 ошибки на /api/profile

## Проблема
Токен передается (`hasAuth: true`), но Strapi возвращает 401 Unauthorized для `PUT /api/profile`.

## Что проверить

### 1. Логи Strapi сервера
**Самый важный шаг!** Откройте терминал, где запущен Strapi, и посмотрите логи при попытке загрузить аватар.

**Если видите:**
```
🔄 Обновление профиля - начало
🔐 User state: ...
```
→ Контроллер вызывается, но `ctx.state.user` пустой. Проблема в JWT middleware.

**Если НЕ видите эти логи:**
→ Запрос не доходит до контроллера. Проблема в роутинге или JWT middleware на уровне Strapi.

### 2. Проверка в Network tab браузера
1. Откройте DevTools → Network
2. Найдите запрос `PUT /api/profile`
3. Откройте вкладку **Headers**
4. В **Request Headers** проверьте:
   ```
   Authorization: Bearer eyJhbGciOiJIUz...
   ```
   
   Если заголовка нет → проблема на клиенте
   Если заголовок есть → проблема на сервере (Strapi)

### 3. Проверка конфигурации роута
Я изменил конфигурацию с:
```javascript
auth: {
  strategies: ['jwt'],
  scope: ['authenticated']
}
```

На:
```javascript
auth: true
```

**После изменения:**
1. Перезапустите Strapi сервер
2. Попробуйте загрузить аватар снова

### 4. Альтернативное решение
Если `auth: true` не работает, попробуйте явно указать middleware:

```javascript
config: {
  policies: [],
  middlewares: [],
  auth: {
    scope: ['authenticated']
  }
}
```

Или вообще убрать `auth` из config и проверять в контроллере:

```javascript
config: {
  policies: [],
  middlewares: []
}
```

А в контроллере добавить проверку:
```javascript
if (!ctx.state.user) {
  return ctx.unauthorized('Not authenticated');
}
```

### 5. Проверка прав в Strapi Admin
Хотя для кастомных роутов это обычно не требуется, проверьте:
- Settings → Roles → Authenticated
- Найдите раздел **Profile** (api::profile)
- Убедитесь, что право **update** включено

## Следующие шаги
1. Проверьте логи Strapi (самое важное!)
2. Проверьте Network tab (заголовок Authorization)
3. Перезапустите Strapi после изменения конфигурации
4. Попробуйте загрузить аватар снова
