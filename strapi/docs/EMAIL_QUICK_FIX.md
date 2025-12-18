# Быстрое решение проблемы Connection timeout

## Проблема
Соединение с SMTP сервером Yandex не устанавливается.

## Быстрое решение

### Шаг 1: Тестирование соединения

Запустите скрипт для проверки всех возможных конфигураций:

```bash
node test-smtp-connection.js
```

Скрипт проверит все возможные комбинации настроек и покажет, какая работает.

### Шаг 2: Если соединение не устанавливается

#### Вариант A: Используйте локальный SMTP для разработки

Установите maildev:
```bash
npm install --save-dev maildev
```

Запустите локальный SMTP сервер:
```bash
npx maildev
```

Измените `.env`:
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_EMAIL=test@test.com
SMTP_PASS=test
EMAIL_DEFAULT_FROM=test@test.com
EMAIL_DEFAULT_REPLY_TO=test@test.com
```

Теперь все письма будут попадать в maildev интерфейс (http://localhost:1080), а не отправляться реально.

#### Вариант B: Используйте Gmail для тестирования

Измените `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_EMAIL=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Вариант C: Используйте Mail.ru

Измените `.env`:
```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_EMAIL=your-email@mail.ru
SMTP_PASS=your-password
```

### Шаг 3: Для продакшена

Для продакшена используйте специализированные сервисы:
- SendGrid
- Mailgun
- Amazon SES
- Yandex 360 (корпоративная почта)

## Рекомендация

**Для локальной разработки:** Используйте maildev - это самый простой способ протестировать отправку email без настройки реального SMTP.

**Для продакшена:** Настройте реальный SMTP сервер (Yandex, Gmail, или специализированный сервис).

---

## Если порты заблокированы

Если порты 587/465 заблокированы вашим ISP или файрволом:

1. Используйте VPN
2. Или используйте локальный SMTP (maildev) для разработки
3. Или используйте другой SMTP сервис
