# 🚀 Быстрая настройка PostgreSQL и Sentry

## 📋 Быстрый старт

### 1. PostgreSQL

#### Автоматическая настройка (рекомендуется):

```bash
./setup_postgresql.sh
```

Скрипт запросит:
- Имя базы данных
- Имя пользователя
- Пароль
- Хост и порт

#### Ручная настройка:

1. Создайте базу данных:
```bash
sudo -u postgres psql
```

2. Выполните SQL:
```sql
CREATE DATABASE tkani_db;
CREATE USER tkani_user WITH PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE tkani_db TO tkani_user;
\c tkani_db
GRANT ALL ON SCHEMA public TO tkani_user;
\q
```

3. Добавьте в `.env`:
```env
DATABASE_URL=postgresql://tkani_user:ваш_пароль@localhost:5432/tkani_db
```

4. Примените миграции:
```bash
flask db upgrade
```

**Подробная инструкция:** см. `POSTGRESQL_SETUP.md`

---

### 2. Sentry (опционально)

#### Быстрая настройка:

1. Зарегистрируйтесь на https://sentry.io
2. Создайте проект (Python → Flask)
3. Скопируйте DSN
4. Добавьте в `.env`:
```env
SENTRY_DSN=https://ваш-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

5. Перезапустите приложение

**Подробная инструкция:** см. `SENTRY_SETUP.md`

---

## ✅ Проверка

### PostgreSQL:

```bash
python3 -c "
from app import create_app
app = create_app('production')
from models import db
with app.app_context():
    db.engine.connect()
    print('✅ PostgreSQL подключен!')
"
```

### Sentry:

1. Создайте тестовый endpoint (временно):
```python
@app.route('/test-sentry')
def test_sentry():
    raise Exception("Тест Sentry")
```

2. Откройте в браузере: `http://localhost:5001/test-sentry`
3. Проверьте Sentry Dashboard - ошибка должна появиться

**Важно:** Удалите тестовый endpoint после проверки!

---

## 📚 Дополнительная документация

- `POSTGRESQL_SETUP.md` - подробная настройка PostgreSQL
- `SENTRY_SETUP.md` - подробная настройка Sentry
- `PRODUCTION_SETUP.md` - общая настройка production

---

## 🆘 Проблемы?

### PostgreSQL не подключается:
- Проверьте пароль в `.env`
- Проверьте права пользователя
- Проверьте настройки `pg_hba.conf`

### Sentry не работает:
- Проверьте правильность DSN
- Проверьте логи приложения
- Убедитесь, что Sentry SDK установлен

---

**Готово!** 🎉

