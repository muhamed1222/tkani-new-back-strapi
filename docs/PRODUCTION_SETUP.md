# 🚀 Настройка для Production

## ✅ Выполненные улучшения

### 1. PostgreSQL Connection Pooling
- ✅ Настроен connection pooling для PostgreSQL
- ✅ Автоматическая проверка соединений (pool_pre_ping)
- ✅ Настраиваемые параметры через переменные окружения

### 2. Логирование
- ✅ Настроено логирование в файл с ротацией
- ✅ Уровни логирования настраиваются через LOG_LEVEL
- ✅ Автоматическая ротация логов (10MB, 10 файлов)

### 3. Мониторинг ошибок (Sentry)
- ✅ Интеграция с Sentry для отслеживания ошибок
- ✅ Автоматический трейсинг запросов (10%)
- ✅ Защита персональных данных

### 4. Резервное копирование
- ✅ Скрипт `backup_db.py` для автоматического бэкапа
- ✅ Поддержка SQLite и PostgreSQL
- ✅ Автоматическая очистка старых бэкапов

### 5. Оптимизация запросов
- ✅ Eager loading для заказов (joinedload)
- ✅ Оптимизированы запросы с отношениями

---

## 📋 Переменные окружения для Production

Добавьте в `.env`:

```env
# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/tkani_db

# Connection Pooling (опционально)
DB_POOL_SIZE=20
DB_POOL_RECYCLE=3600
DB_MAX_OVERFLOW=40

# Логирование
LOG_LEVEL=WARNING
LOG_FILE=/var/log/tkani/app.log

# Мониторинг (Sentry)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# Резервное копирование
BACKUP_DIR=/var/backups/tkani
BACKUP_RETENTION_DAYS=30
```

---

## 🔧 Установка зависимостей

```bash
pip install -r requirements.txt
```

Новые зависимости:
- `psycopg2-binary` - драйвер PostgreSQL
- `yookassa` - SDK для ЮKassa
- `sentry-sdk[flask]` - мониторинг ошибок

---

## 💾 Настройка резервного копирования

### Автоматический бэкап (cron)

Добавьте в crontab:

```bash
# Бэкап каждый день в 2:00
0 2 * * * cd /path/to/project && /usr/bin/python3 backup_db.py >> /var/log/tkani/backup.log 2>&1
```

Или используйте systemd timer (рекомендуется):

Создайте `/etc/systemd/system/tkani-backup.service`:
```ini
[Unit]
Description=Tkani Database Backup
After=network.target

[Service]
Type=oneshot
User=www-data
WorkingDirectory=/path/to/project
Environment="DATABASE_URL=postgresql://..."
Environment="BACKUP_DIR=/var/backups/tkani"
ExecStart=/usr/bin/python3 /path/to/project/backup_db.py
```

И `/etc/systemd/system/tkani-backup.timer`:
```ini
[Unit]
Description=Run Tkani backup daily
Requires=tkani-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Активируйте:
```bash
sudo systemctl enable tkani-backup.timer
sudo systemctl start tkani-backup.timer
```

---

## 📊 Мониторинг

### Sentry

1. Создайте проект на https://sentry.io
2. Получите DSN
3. Добавьте в `.env`: `SENTRY_DSN=your-dsn`

Sentry будет автоматически отслеживать:
- Ошибки приложения
- Производительность запросов
- SQL запросы

### Логи

Логи сохраняются в файл, указанный в `LOG_FILE`:
```bash
tail -f /var/log/tkani/app.log
```

---

## 🔍 Проверка настроек

### Проверка PostgreSQL

```bash
# Проверка соединения
python3 -c "from app import create_app; app = create_app('production'); from models import db; db.engine.connect()"
```

### Проверка бэкапа

```bash
python3 backup_db.py
```

### Проверка Sentry

Создайте тестовую ошибку в коде и проверьте, что она появилась в Sentry.

---

## ⚠️ Важные замечания

1. **PostgreSQL обязателен для production**
   - SQLite не поддерживает concurrent запросы
   - Используйте PostgreSQL для production

2. **Секретные ключи**
   - Убедитесь, что все ключи изменены
   - Не коммитьте `.env` в git

3. **Резервное копирование**
   - Настройте автоматический бэкап
   - Проверяйте бэкапы регулярно
   - Храните бэкапы в безопасном месте

4. **Мониторинг**
   - Настройте алерты в Sentry
   - Мониторьте логи регулярно
   - Настройте уведомления о критических ошибках

---

## 📈 Следующие шаги

1. ✅ Настроить PostgreSQL
2. ✅ Настроить резервное копирование
3. ✅ Настроить Sentry
4. ⚠️ Настроить мониторинг производительности
5. ⚠️ Настроить CDN для статических файлов
6. ⚠️ Настроить Redis для кэширования (опционально)

---

**Готово!** Проект оптимизирован для production. 🚀

