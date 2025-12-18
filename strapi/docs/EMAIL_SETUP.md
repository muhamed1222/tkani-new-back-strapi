# Настройка Email плагина

## Проблема

При попытке отправить тестовый email возникает ошибка:
```
Missing credentials for "PLAIN"
```

## Причина

В файле `.env` отсутствуют переменные `SMTP_EMAIL` и `SMTP_PASS`, которые необходимы для аутентификации в SMTP сервере.

## Решение

### 1. Добавьте переменные в `.env` файл:

```bash
# Email Plugin (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_EMAIL=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_DEFAULT_FROM=noreply@centr-tkani.ru
EMAIL_DEFAULT_REPLY_TO=support@centr-tkani.ru
```

### 2. Для Gmail:

Если используете Gmail, вам нужно:

1. **Включить двухфакторную аутентификацию** в вашем Google аккаунте
2. **Создать пароль приложения**:
   - Перейдите в [Google Account Security](https://myaccount.google.com/security)
   - Включите 2-Step Verification
   - Создайте App Password для "Mail"
   - Используйте этот пароль в `SMTP_PASS`

### 3. Для других SMTP серверов:

**Yandex Mail:**
```bash
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_EMAIL=your-email@yandex.ru
SMTP_PASS=your-password
```

**Mail.ru:**
```bash
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_EMAIL=your-email@mail.ru
SMTP_PASS=your-password
```

**Настраиваемый SMTP:**
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_EMAIL=your-email@domain.com
SMTP_PASS=your-password
```

### 4. Перезапустите Strapi:

После добавления переменных в `.env`:
```bash
npm run develop
```

## Проверка

После настройки:
1. Откройте админ-панель Strapi
2. Перейдите в **Settings** → **Email**
3. Нажмите **Send test email**
4. Введите email адрес для теста
5. Проверьте, что письмо отправлено успешно

## Важно

- **Не коммитьте `.env` файл** в git (он уже в `.gitignore`)
- Используйте **App Password** для Gmail, а не обычный пароль
- Для продакшена используйте отдельные SMTP настройки

## Текущая конфигурация

Email плагин настроен в `config/plugins.js` и будет работать только если переменные `SMTP_EMAIL` и `SMTP_PASS` установлены в `.env`.

Если переменные не установлены, плагин не будет пытаться аутентифицироваться (auth будет undefined), что предотвратит ошибку при запуске, но email отправка не будет работать.
