# Исправление: Безопасность .env.sample

## Проблема
В файле `.env.sample` были указаны **реальные учетные данные** (email и пароль), что небезопасно для публичного репозитория.

## Исправление
Все реальные данные заменены на примеры (placeholders):

### Было:
```env
SMTP_EMAIL=centertkani-shop@yandex.ru
SMTP_PASS=ifjvlxwfkmzsfnnk
EMAIL_DEFAULT_FROM=centertkani-shop@yandex.ru
EMAIL_DEFAULT_REPLY_TO=centertkani-shop@yandex.ru
```

### Стало:
```env
SMTP_EMAIL=your-email@yandex.ru
SMTP_PASS=your-app-password
EMAIL_DEFAULT_FROM=your-email@yandex.ru
EMAIL_DEFAULT_REPLY_TO=your-email@yandex.ru
```

## Важно

1. **`.env.sample`** - это шаблон с примерами, который можно безопасно коммитить в Git
2. **`.env`** - реальный файл с настоящими данными, который должен быть в `.gitignore`
3. При клонировании проекта:
   ```bash
   cp .env.sample .env
   # Затем отредактируйте .env и укажите реальные данные
   ```

## Настройка для Yandex Mail

Для использования Yandex Mail в `.env` укажите:

```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_EMAIL=ваш-email@yandex.ru
SMTP_PASS=ваш-пароль-приложения
EMAIL_DEFAULT_FROM=ваш-email@yandex.ru
EMAIL_DEFAULT_REPLY_TO=ваш-email@yandex.ru
```

### Как получить пароль приложения для Yandex:

1. Перейдите в [Настройки безопасности Yandex](https://id.yandex.ru/security)
2. Включите "Пароли приложений"
3. Создайте новый пароль для "Почта"
4. Используйте этот пароль в `SMTP_PASS`

---

✅ **Исправлено:** Все реальные данные удалены из `.env.sample`
