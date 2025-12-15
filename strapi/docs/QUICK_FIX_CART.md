# 🔧 Быстрое решение проблемы 403 Forbidden для корзины

## Способ 1: Через Admin Panel (САМЫЙ БЫСТРЫЙ)

1. Откройте Strapi Admin: http://localhost:1337/admin
2. Перейдите: **Settings** → **Users & Permissions Plugin** → **Roles**
3. Нажмите на роль **"Public"**
4. Найдите секцию **"Cart"** (или прокрутите вниз)
5. Включите все чекбоксы:
   - ✅ find
   - ✅ findOne  
   - ✅ create
   - ✅ update
6. Нажмите **"Save"** (вверху справа)

## Способ 2: Проверьте, что Strapi перезапущен

После изменения схемы cart (добавление session_id) нужно перезапустить Strapi:

```bash
cd strapi
# Остановите текущий процесс (Ctrl+C)
npm run develop
```

## Что уже сделано в коде:

✅ Добавлено поле `session_id` в схему cart
✅ Поле `user` сделано необязательным
✅ Все контроллеры обновлены для работы с session_id
✅ Маршруты настроены с `auth: false`
✅ CORS настроен для X-Session-Id
✅ Фронтенд обновлен для отправки session_id

## Проверка работы:

1. Откройте сайт в режиме инкогнито
2. Откройте DevTools → Network
3. Попробуйте добавить товар в корзину
4. Проверьте, что:
   - Запрос не возвращает 403
   - В Response Headers есть cookie `cart_session_id`
   - В Request Headers есть `X-Session-Id` (если cookie уже установлен)

