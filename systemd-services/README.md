# Systemd сервисы

Готовые конфигурации systemd для автоматического запуска приложений.

## 📋 Установка

### 1. Backend сервис

```bash
# Скопируйте файл
sudo cp tkani-backend.service /etc/systemd/system/

# Отредактируйте пути (если нужно)
sudo nano /etc/systemd/system/tkani-backend.service

# Обновите пути в файле:
# - WorkingDirectory=/var/www/tkani-backend
# - ExecStart=/var/www/tkani-backend/venv/bin/gunicorn

# Активируйте и запустите
sudo systemctl daemon-reload
sudo systemctl enable tkani-backend
sudo systemctl start tkani-backend

# Проверьте статус
sudo systemctl status tkani-backend
```

### 2. Strapi сервис

```bash
# Скопируйте файл
sudo cp tkani-strapi.service /etc/systemd/system/

# Отредактируйте пути (если нужно)
sudo nano /etc/systemd/system/tkani-strapi.service

# Обновите пути в файле:
# - WorkingDirectory=/var/www/tkani-backend/strapi

# Активируйте и запустите
sudo systemctl daemon-reload
sudo systemctl enable tkani-strapi
sudo systemctl start tkani-strapi

# Проверьте статус
sudo systemctl status tkani-strapi
```

## 🔧 Управление сервисами

```bash
# Запуск
sudo systemctl start tkani-backend
sudo systemctl start tkani-strapi

# Остановка
sudo systemctl stop tkani-backend
sudo systemctl stop tkani-strapi

# Перезапуск
sudo systemctl restart tkani-backend
sudo systemctl restart tkani-strapi

# Статус
sudo systemctl status tkani-backend
sudo systemctl status tkani-strapi

# Логи
sudo journalctl -u tkani-backend -f
sudo journalctl -u tkani-strapi -f

# Последние 50 строк логов
sudo journalctl -u tkani-backend -n 50
sudo journalctl -u tkani-strapi -n 50
```

## ⚙️ Настройка

### Изменение пользователя

Если вы хотите использовать другого пользователя (не www-data):

1. Создайте пользователя:
```bash
sudo adduser --disabled-password --gecos "" tkani
```

2. Измените в файлах сервисов:
```ini
User=tkani
Group=tkani
```

3. Установите права:
```bash
sudo chown -R tkani:tkani /var/www/tkani-backend
```

### Изменение количества воркеров (Gunicorn)

В файле `tkani-backend.service` измените:
```ini
ExecStart=/var/www/tkani-backend/venv/bin/gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

Где `-w 4` - количество воркеров (рекомендуется: количество CPU * 2 + 1)

### Изменение портов

Если вы используете другие порты, обновите:
- Backend: измените `-b 0.0.0.0:5001` в `tkani-backend.service`
- Strapi: измените `PORT=1337` в `tkani-strapi.service`

И не забудьте обновить конфигурации Nginx!

## 🆘 Решение проблем

### Сервис не запускается

1. Проверьте логи:
```bash
sudo journalctl -u tkani-backend -n 50
```

2. Проверьте права доступа:
```bash
sudo chown -R www-data:www-data /var/www/tkani-backend
```

3. Проверьте, что виртуальное окружение существует:
```bash
ls -la /var/www/tkani-backend/venv
```

### Порт уже занят

```bash
# Проверьте, что использует порт
sudo netstat -tulpn | grep 5001
sudo netstat -tulpn | grep 1337

# Остановите процесс или измените порт
```

### Сервис падает

1. Проверьте логи на ошибки
2. Убедитесь, что все зависимости установлены
3. Проверьте `.env` файл
4. Увеличьте таймауты в конфигурации

## 📚 Дополнительная информация

См. полное руководство по привязке к домену: `../DOMAIN_AND_HOSTING_SETUP.md`
См. быструю инструкцию: `../QUICK_DOMAIN_SETUP.md`

