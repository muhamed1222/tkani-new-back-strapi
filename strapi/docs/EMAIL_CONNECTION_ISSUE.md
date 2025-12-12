# Решение проблемы Connection timeout с Yandex Mail SMTP

## Проблема
Соединение с SMTP сервером Yandex не устанавливается, возникает ошибка "Connection timeout".

## Возможные причины

1. **Порты заблокированы файрволом или ISP**
2. **Неправильный SMTP хост**
3. **Проблемы с сетью**
4. **Требуется VPN или прокси**

## Решения

### Решение 1: Проверка доступности портов

Проверьте, доступны ли SMTP порты:

```bash
# Проверка порта 587
telnet smtp.yandex.com 587

# Проверка порта 465
telnet smtp.yandex.com 465
```

Если соединение не устанавливается, порты заблокированы.

### Решение 2: Использование альтернативного SMTP сервиса

Если Yandex Mail не работает из-за блокировки портов, рассмотрите альтернативы:

#### Вариант A: Gmail SMTP (для тестирования)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_EMAIL=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Вариант B: Mail.ru SMTP

```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_EMAIL=your-email@mail.ru
SMTP_PASS=your-password
```

#### Вариант C: SendGrid, Mailgun или другие сервисы

Для продакшена лучше использовать специализированные email сервисы.

### Решение 3: Использование локального SMTP для разработки

Для локальной разработки можно использовать mock SMTP сервер:

```bash
npm install --save-dev maildev
```

Запустите локальный SMTP сервер:
```bash
npx maildev
```

И настройте в `.env`:
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_EMAIL=test@test.com
SMTP_PASS=test
```

### Решение 4: Проверка настроек Yandex

Убедитесь, что:

1. ✅ Используется **пароль приложения**, а не основной пароль
2. ✅ Включена опция "Пароли приложений" в настройках Yandex
3. ✅ Email адрес указан полностью: `centertkani-shop@yandex.ru`
4. ✅ Используется правильный хост: `smtp.yandex.com` (не `.ru`)

### Решение 5: Альтернативные настройки для Yandex

Попробуйте разные комбинации:

**Комбинация 1:**
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_SECURE=false
```

**Комбинация 2:**
```env
SMTP_HOST=smtp.yandex.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

**Комбинация 3:**
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=25
SMTP_SECURE=false
```

### Решение 6: Включение debug режима

Добавьте в `.env`:
```env
SMTP_DEBUG=true
```

Это покажет подробные логи попытки соединения.

## Рекомендации

### Для локальной разработки:
Используйте локальный SMTP сервер (maildev) или тестовый сервис.

### Для продакшена:
Используйте специализированные email сервисы:
- SendGrid
- Mailgun
- Amazon SES
- Yandex 360 (корпоративная почта)

## Быстрая проверка

1. Проверьте доступность портов:
   ```bash
   telnet smtp.yandex.com 587
   ```

2. Если порты недоступны:
   - Используйте VPN
   - Или переключитесь на другой SMTP сервис

3. Включите debug режим:
   ```env
   SMTP_DEBUG=true
   ```

4. Проверьте логи Strapi для подробной информации о соединении

## Альтернатива: Отключение email плагина для разработки

Если email не критичен для разработки, можно временно отключить отправку email и использовать только в продакшене.

---

**Важно:** Если порты 587 и 465 заблокированы вашим ISP или файрволом, единственное решение - использовать VPN или другой SMTP сервис.
