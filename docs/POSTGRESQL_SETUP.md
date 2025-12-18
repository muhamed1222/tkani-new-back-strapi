# 🐘 Настройка PostgreSQL для Production

## 📋 Требования

- PostgreSQL 12+ установлен на сервере
- Доступ к серверу с правами администратора
- Python пакет `psycopg2-binary` установлен (уже в requirements.txt)

---

## 🔧 Шаг 1: Установка PostgreSQL (если не установлен)

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### CentOS/RHEL:
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### macOS (Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

---

## 🔧 Шаг 2: Создание базы данных и пользователя

### 2.1. Подключение к PostgreSQL

```bash
sudo -u postgres psql
```

Или если используете другого пользователя:
```bash
psql -U postgres
```

### 2.2. Создание базы данных

```sql
-- Создаем базу данных
CREATE DATABASE tkani_db;

-- Создаем пользователя
CREATE USER tkani_user WITH PASSWORD 'ВАШ_НАДЕЖНЫЙ_ПАРОЛЬ';

-- Даем права на базу данных
GRANT ALL PRIVILEGES ON DATABASE tkani_db TO tkani_user;

-- Для PostgreSQL 15+ нужно также дать права на схему
\c tkani_db
GRANT ALL ON SCHEMA public TO tkani_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tkani_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tkani_user;

-- Выход
\q
```

### 2.3. Проверка подключения

```bash
psql -U tkani_user -d tkani_db -h localhost
```

Если подключение успешно, вы увидите приглашение `tkani_db=>`

---

## 🔧 Шаг 3: Настройка .env файла

Добавьте в `.env`:

```env
# PostgreSQL
DATABASE_URL=postgresql://tkani_user:ВАШ_ПАРОЛЬ@localhost:5432/tkani_db

# Connection Pooling (опционально, но рекомендуется)
DB_POOL_SIZE=20
DB_POOL_RECYCLE=3600
DB_MAX_OVERFLOW=40
```

**Важно:** Замените `ВАШ_ПАРОЛЬ` на реальный пароль!

---

## 🔧 Шаг 4: Миграция данных из SQLite в PostgreSQL

### 4.1. Экспорт данных из SQLite

```bash
# Создаем SQL дамп
sqlite3 app.db .dump > sqlite_dump.sql
```

### 4.2. Импорт в PostgreSQL (требует ручной правки)

**Внимание:** SQLite и PostgreSQL имеют разные синтаксисы. Рекомендуется использовать миграции Flask.

### 4.3. Использование Flask-Migrate (рекомендуется)

```bash
# 1. Создаем миграции (если еще не созданы)
flask db init

# 2. Создаем миграцию для существующей БД
flask db migrate -m "Initial migration"

# 3. Применяем миграции к PostgreSQL
export DATABASE_URL=postgresql://tkani_user:пароль@localhost:5432/tkani_db
flask db upgrade
```

---

## 🔧 Шаг 5: Настройка безопасности

### 5.1. Настройка pg_hba.conf

Найдите файл `pg_hba.conf`:
```bash
sudo find / -name pg_hba.conf 2>/dev/null
```

Обычно находится в:
- Ubuntu/Debian: `/etc/postgresql/*/main/pg_hba.conf`
- CentOS/RHEL: `/var/lib/pgsql/data/pg_hba.conf`
- macOS: `/usr/local/var/postgres/pg_hba.conf`

Добавьте строку для локальных подключений:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   tkani_db        tkani_user                               md5
host    tkani_db        tkani_user      127.0.0.1/32            md5
```

Перезапустите PostgreSQL:
```bash
sudo systemctl restart postgresql
# или
brew services restart postgresql
```

### 5.2. Настройка postgresql.conf (опционально)

Для production рекомендуется:
```conf
# Максимальное количество соединений
max_connections = 100

# Общая память для работы
shared_buffers = 256MB
effective_cache_size = 1GB

# Логирование
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_statement = 'mod'
```

---

## 🔧 Шаг 6: Проверка подключения

### 6.1. Тест из Python

```bash
python3 -c "
from app import create_app
app = create_app('production')
from models import db
with app.app_context():
    db.engine.connect()
    print('✅ Подключение к PostgreSQL успешно!')
"
```

### 6.2. Проверка через psql

```bash
psql -U tkani_user -d tkani_db -h localhost -c "SELECT version();"
```

---

## 🔧 Шаг 7: Настройка резервного копирования

Скрипт `backup_db.py` уже поддерживает PostgreSQL. Убедитесь, что `pg_dump` доступен:

```bash
which pg_dump
```

Если не найден, установите:
```bash
# Ubuntu/Debian
sudo apt install postgresql-client

# CentOS/RHEL
sudo yum install postgresql
```

---

## ⚠️ Важные замечания

1. **Пароли:** Используйте надежные пароли для production
2. **Бэкапы:** Настройте автоматическое резервное копирование
3. **Мониторинг:** Мониторьте использование ресурсов БД
4. **Обновления:** Регулярно обновляйте PostgreSQL

---

## 🆘 Решение проблем

### Ошибка: "password authentication failed"

Проверьте:
- Правильность пароля в `.env`
- Настройки `pg_hba.conf`
- Права пользователя

### Ошибка: "database does not exist"

Убедитесь, что база данных создана:
```sql
\l  -- список баз данных
```

### Ошибка: "permission denied"

Проверьте права пользователя:
```sql
\du  -- список пользователей
```

---

## ✅ Готово!

PostgreSQL настроен и готов к использованию. Теперь можно переключаться с SQLite на PostgreSQL в production.

