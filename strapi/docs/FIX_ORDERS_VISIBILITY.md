# Исправление: Orders не отображается в админке

## Причина
После изменения схемы content types в Strapi v5 нужно **перезапустить сервер**, чтобы изменения вступили в силу.

## Решение

### Шаг 1: Остановите Strapi
В терминале, где запущен Strapi, нажмите `Ctrl+C`

### Шаг 2: Очистите кэш (опционально, но рекомендуется)
```bash
cd /Users/kelemetovmuhamed/Desktop/ct-2025/tkani-new-back-strapi/strapi
rm -rf .cache
rm -rf build
```

### Шаг 3: Запустите Strapi снова
```bash
npm run develop
```

### Шаг 4: Дождитесь полной загрузки
Должно появиться:
```
✅ Order lifecycle hooks registered
✔ Loading Strapi
✔ Strapi started successfully
```

### Шаг 5: Обновите админ-панель
1. Откройте http://localhost:1337/admin
2. Нажмите `F5` или `Cmd+R` для обновления страницы
3. Перейдите в **Content Manager**
4. В левом меню должна появиться коллекция **"Заказы"**

---

## Проверка структуры

Убедитесь, что файлы существуют:

```bash
# Проверка схемы Order
ls -la src/api/order/content-types/order/schema.json

# Проверка компонента order-item
ls -la src/components/order/order-item.json
```

Оба файла должны существовать.

---

## Если все еще не работает

### Проверка логов на ошибки:
```bash
npm run develop 2>&1 | grep -i "error\|warn" | head -20
```

### Проверка синтаксиса JSON:
```bash
# Проверка схемы
cat src/api/order/content-types/order/schema.json | python3 -m json.tool > /dev/null && echo "✅ Schema JSON valid" || echo "❌ Schema JSON invalid"

# Проверка компонента
cat src/components/order/order-item.json | python3 -m json.tool > /dev/null && echo "✅ Component JSON valid" || echo "❌ Component JSON invalid"
```

---

## Альтернативное решение

Если проблема сохраняется, попробуйте:

1. **Удалить и пересоздать через Content-Type Builder:**
   - Откройте админку
   - Settings → Content-Type Builder
   - Создайте коллекцию Order вручную
   - Импортируйте поля из schema.json

2. **Проверьте права доступа:**
   - Settings → Users & Permissions → Roles
   - Убедитесь, что для вашей роли есть доступ к Orders

---

## Быстрая проверка

После перезапуска проверьте в консоли браузера (F12):
- Нет ли ошибок JavaScript
- Загружается ли коллекция Orders через API

Проверьте через API:
```bash
curl http://localhost:1337/api/orders
```

Если API работает, но не отображается в админке - проблема в админ-панели, попробуйте очистить кэш браузера.
