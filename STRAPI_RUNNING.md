# ✅ Strapi запущен!

## 🌐 Адрес:

**Админ-панель:** http://localhost:1337/admin  
**API:** http://localhost:1337/api

## 📋 Следующие шаги:

1. **Откройте в браузере:** http://localhost:1337/admin
2. **Создайте администраторский аккаунт:**
   - Имя
   - Email
   - Пароль (минимум 8 символов)
3. **Создайте API Token:**
   - Settings ⚙️ > API Tokens
   - Create new API Token
   - Name: `Flask Integration`
   - Token type: `Full access`
   - Скопируйте токен
4. **Обновите `.env` в корне проекта:**
   ```
   STRAPI_API_TOKEN=ваш_токен_здесь
   ```

## 🛠 Управление:

### Проверка статуса:
```bash
lsof -ti:1337 && echo "Strapi работает" || echo "Strapi не запущен"
```

### Просмотр логов:
```bash
tail -f /tmp/strapi-startup.log
```

### Остановка:
```bash
kill $(lsof -ti:1337)
```

### Перезапуск:
```bash
cd strapi
npm run develop
```

## 📚 Content Types:

- **Product** - Товары
- **Category** - Категории  
- **Brand** - Бренды
- **Work** - Работы/Портфолио

Все готово к работе! 🎉

