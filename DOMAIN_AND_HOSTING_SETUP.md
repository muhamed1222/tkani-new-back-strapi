# 🌐 Привязка проекта к домену и хостингу

Полное руководство по развертыванию проекта на сервере с привязкой к домену.

## 📋 Содержание

1. [Требования](#требования)
2. [Подготовка сервера](#подготовка-сервера)
3. [Настройка DNS](#настройка-dns)
4. [Установка проекта](#установка-проекта)
5. [Настройка Nginx](#настройка-nginx)
6. [Настройка SSL](#настройка-ssl)
7. [Настройка systemd](#настройка-systemd)
8. [Сборка и деплой фронтенда](#сборка-и-деплой-фронтенда)
9. [Проверка работы](#проверка-работы)
10. [Решение проблем](#решение-проблем)

---

## 🔧 Требования

- Сервер с Ubuntu 20.04+ или Debian 11+
- Домен (например, `yourdomain.ru`)
- Доступ по SSH к серверу
- Права sudo на сервере

---

## 🖥 Подготовка сервера

### 1. Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка необходимых пакетов

```bash
# Nginx
sudo apt install nginx -y

# Python и зависимости
sudo apt install python3 python3-pip python3-venv -y

# Node.js и npm (для Strapi и фронтенда)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Certbot для SSL
sudo apt install certbot python3-certbot-nginx -y

# PostgreSQL (опционально, если не используете SQLite)
sudo apt install postgresql postgresql-contrib -y

# Дополнительные инструменты
sudo apt install git curl wget build-essential -y
```

### 3. Создание пользователя для проекта

```bash
# Создать пользователя www-data (если не существует)
sudo useradd -r -s /bin/bash www-data || true

# Или создать отдельного пользователя
sudo adduser --disabled-password --gecos "" tkani
sudo usermod -aG sudo tkani
```

### 4. Создание директорий

```bash
# Создать директорию для проекта
sudo mkdir -p /var/www/tkani-backend
sudo mkdir -p /var/www/tkani-frontend

# Установить права
sudo chown -R www-data:www-data /var/www/tkani-backend
sudo chown -R www-data:www-data /var/www/tkani-frontend
```

---

## 🌍 Настройка DNS

### Вариант 1: С поддоменами (рекомендуется)

Настройте DNS записи у вашего регистратора домена:

```
Тип    Имя    Значение           TTL
A      @      IP_ВАШЕГО_СЕРВЕРА  3600
A      www    IP_ВАШЕГО_СЕРВЕРА  3600
A      api    IP_ВАШЕГО_СЕРВЕРА  3600
A      cms    IP_ВАШЕГО_СЕРВЕРА  3600
```

**Пример:**
- `yourdomain.ru` → Frontend
- `api.yourdomain.ru` → Backend API
- `cms.yourdomain.ru` → Strapi CMS

### Вариант 2: Без поддоменов

Настройте только основную запись:

```
Тип    Имя    Значение           TTL
A      @      IP_ВАШЕГО_СЕРВЕРА  3600
A      www    IP_ВАШЕГО_СЕРВЕРА  3600
```

**Пример:**
- `yourdomain.ru` → Frontend
- `yourdomain.ru/api` → Backend API
- `yourdomain.ru/cms` → Strapi CMS

### Проверка DNS

```bash
# Проверить DNS записи
dig yourdomain.ru
dig api.yourdomain.ru
dig cms.yourdomain.ru

# Или
nslookup yourdomain.ru
```

**Важно:** Подождите 5-30 минут после настройки DNS для распространения изменений.

---

## 📦 Установка проекта

### 1. Клонирование репозитория

```bash
cd /var/www/tkani-backend
sudo -u www-data git clone https://github.com/yourusername/tkani-new-back-strapi.git .
# Или загрузите проект через scp/sftp
```

### 2. Настройка Backend (Flask)

```bash
cd /var/www/tkani-backend

# Создать виртуальное окружение
sudo -u www-data python3 -m venv venv

# Активировать и установить зависимости
sudo -u www-data venv/bin/pip install --upgrade pip
sudo -u www-data venv/bin/pip install -r requirements.txt

# Установить Gunicorn
sudo -u www-data venv/bin/pip install gunicorn
```

### 3. Настройка переменных окружения

```bash
# Создать .env файл
sudo -u www-data nano /var/www/tkani-backend/.env
```

Добавьте:

```env
FLASK_ENV=production
SECRET_KEY=your-very-secret-key-here-change-this
JWT_SECRET_KEY=your-jwt-secret-key-here-change-this
DATABASE_URL=sqlite:///app.db
# Или для PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost/tkani_db

# Strapi настройки
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-strapi-api-token

# CORS настройки (замените на ваш домен)
CORS_ORIGINS=https://yourdomain.ru,https://www.yourdomain.ru
```

### 4. Инициализация базы данных

```bash
cd /var/www/tkani-backend
sudo -u www-data venv/bin/flask db upgrade
sudo -u www-data venv/bin/python create_admin.py
```

### 5. Настройка Strapi

```bash
cd /var/www/tkani-backend/strapi

# Установить зависимости
sudo -u www-data npm install

# Создать .env файл
sudo -u www-data nano /var/www/tkani-backend/strapi/.env
```

Добавьте в `.env` Strapi:

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys-here
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret

# База данных (SQLite по умолчанию)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Или PostgreSQL:
# DATABASE_CLIENT=postgres
# DATABASE_HOST=127.0.0.1
# DATABASE_PORT=5432
# DATABASE_NAME=strapi_db
# DATABASE_USERNAME=strapi_user
# DATABASE_PASSWORD=strapi_password

# URL для production
URL=http://localhost:1337
```

### 6. Сборка Strapi (опционально, для production)

```bash
cd /var/www/tkani-backend/strapi
sudo -u www-data npm run build
```

---

## 🔧 Настройка Nginx

### Вариант 1: С поддоменами

#### Frontend конфигурация

```bash
# Скопировать конфигурацию
sudo cp /var/www/tkani-backend/nginx-configs/frontend.conf /etc/nginx/sites-available/yourdomain.ru

# Отредактировать
sudo nano /etc/nginx/sites-available/yourdomain.ru
```

Замените:
- `yourdomain.ru` → ваш домен
- `/var/www/yourdomain.ru/dist` → путь к собранному фронтенду

#### API конфигурация

```bash
sudo cp /var/www/tkani-backend/nginx-configs/api.conf /etc/nginx/sites-available/api.yourdomain.ru
sudo nano /etc/nginx/sites-available/api.yourdomain.ru
```

#### CMS конфигурация

```bash
sudo cp /var/www/tkani-backend/nginx-configs/cms.conf /etc/nginx/sites-available/cms.yourdomain.ru
sudo nano /etc/nginx/sites-available/cms.yourdomain.ru
```

#### Активация конфигураций

```bash
# Создать символические ссылки
sudo ln -s /etc/nginx/sites-available/yourdomain.ru /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.yourdomain.ru /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/cms.yourdomain.ru /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

### Вариант 2: Без поддоменов

```bash
# Скопировать конфигурацию
sudo cp /var/www/tkani-backend/nginx-configs/single-domain.conf /etc/nginx/sites-available/yourdomain.ru

# Отредактировать
sudo nano /etc/nginx/sites-available/yourdomain.ru

# Активировать
sudo ln -s /etc/nginx/sites-available/yourdomain.ru /etc/nginx/sites-enabled/

# Проверить и перезапустить
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Настройка SSL (Let's Encrypt)

### Вариант 1: С поддоменами

```bash
# Получить сертификаты для всех доменов
sudo certbot --nginx -d yourdomain.ru -d www.yourdomain.ru
sudo certbot --nginx -d api.yourdomain.ru
sudo certbot --nginx -d cms.yourdomain.ru
```

### Вариант 2: Без поддоменов

```bash
# Получить сертификат для основного домена
sudo certbot --nginx -d yourdomain.ru -d www.yourdomain.ru
```

### Автоматическое обновление

Certbot автоматически настроит обновление сертификатов. Проверить можно:

```bash
sudo certbot renew --dry-run
```

---

## ⚙️ Настройка systemd

### 1. Backend сервис

```bash
# Скопировать файл сервиса
sudo cp /var/www/tkani-backend/systemd-services/tkani-backend.service /etc/systemd/system/

# Отредактировать пути (если нужно)
sudo nano /etc/systemd/system/tkani-backend.service

# Активировать и запустить
sudo systemctl daemon-reload
sudo systemctl enable tkani-backend
sudo systemctl start tkani-backend

# Проверить статус
sudo systemctl status tkani-backend
```

### 2. Strapi сервис

```bash
# Скопировать файл сервиса
sudo cp /var/www/tkani-backend/systemd-services/tkani-strapi.service /etc/systemd/system/

# Отредактировать пути (если нужно)
sudo nano /etc/systemd/system/tkani-strapi.service

# Активировать и запустить
sudo systemctl daemon-reload
sudo systemctl enable tkani-strapi
sudo systemctl start tkani-strapi

# Проверить статус
sudo systemctl status tkani-strapi
```

### Управление сервисами

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

# Логи
sudo journalctl -u tkani-backend -f
sudo journalctl -u tkani-strapi -f
```

---

## 🎨 Сборка и деплой фронтенда

### 1. На локальной машине

```bash
cd /path/to/tkani-new-main

# Установить зависимости (если еще не установлены)
npm install

# Собрать проект для production
npm run build

# Создать архив
tar -czf frontend-dist.tar.gz dist/
```

### 2. Загрузка на сервер

```bash
# Загрузить на сервер
scp frontend-dist.tar.gz user@your-server:/tmp/

# На сервере: распаковать
ssh user@your-server
sudo mkdir -p /var/www/yourdomain.ru
sudo tar -xzf /tmp/frontend-dist.tar.gz -C /var/www/yourdomain.ru/
sudo chown -R www-data:www-data /var/www/yourdomain.ru
```

### 3. Настройка переменных окружения фронтенда

Перед сборкой создайте файл `.env.production` в корне фронтенда:

```env
VITE_API_URL=https://api.yourdomain.ru
# Или для варианта без поддоменов:
# VITE_API_URL=https://yourdomain.ru/api

VITE_STRAPI_URL=https://cms.yourdomain.ru
# Или:
# VITE_STRAPI_URL=https://yourdomain.ru/cms
```

Затем соберите проект:

```bash
npm run build
```

---

## ✅ Проверка работы

### 1. Проверка сервисов

```bash
# Проверить статус всех сервисов
sudo systemctl status tkani-backend
sudo systemctl status tkani-strapi
sudo systemctl status nginx

# Проверить порты
sudo netstat -tulpn | grep -E '5001|1337|80|443'
```

### 2. Проверка сайтов

- Frontend: `https://yourdomain.ru`
- API: `https://api.yourdomain.ru/api/v1/catalog/categories` (или `https://yourdomain.ru/api/v1/catalog/categories`)
- CMS: `https://cms.yourdomain.ru/admin` (или `https://yourdomain.ru/cms/admin`)

### 3. Проверка логов

```bash
# Nginx логи
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Backend логи
sudo journalctl -u tkani-backend -f

# Strapi логи
sudo journalctl -u tkani-strapi -f
```

---

## 🆘 Решение проблем

### Проблема: Сервис не запускается

```bash
# Проверить логи
sudo journalctl -u tkani-backend -n 50
sudo journalctl -u tkani-strapi -n 50

# Проверить права доступа
sudo chown -R www-data:www-data /var/www/tkani-backend

# Проверить виртуальное окружение
ls -la /var/www/tkani-backend/venv
```

### Проблема: Порт занят

```bash
# Найти процесс, использующий порт
sudo lsof -i :5001
sudo lsof -i :1337

# Остановить процесс или изменить порт в конфигурации
```

### Проблема: Nginx ошибка конфигурации

```bash
# Проверить конфигурацию
sudo nginx -t

# Проверить логи
sudo tail -f /var/log/nginx/error.log
```

### Проблема: SSL сертификат не работает

```bash
# Проверить сертификат
sudo certbot certificates

# Обновить вручную
sudo certbot renew

# Проверить DNS записи
dig yourdomain.ru
```

### Проблема: 502 Bad Gateway

1. Проверьте, что backend и Strapi запущены
2. Проверьте порты в конфигурации Nginx
3. Проверьте логи Nginx и сервисов

### Проблема: CORS ошибки

Убедитесь, что в `.env` backend указаны правильные домены:

```env
CORS_ORIGINS=https://yourdomain.ru,https://www.yourdomain.ru
```

---

## 📝 Чеклист развертывания

- [ ] Сервер подготовлен (пакеты установлены)
- [ ] DNS записи настроены и проверены
- [ ] Проект загружен на сервер
- [ ] Backend настроен и запущен
- [ ] Strapi настроен и запущен
- [ ] Nginx конфигурации установлены
- [ ] SSL сертификаты получены
- [ ] Systemd сервисы настроены и запущены
- [ ] Фронтенд собран и загружен
- [ ] Все сервисы работают
- [ ] Сайты доступны по HTTPS

---

## 🔄 Обновление проекта

### Backend

```bash
cd /var/www/tkani-backend
sudo -u www-data git pull
sudo -u www-data venv/bin/pip install -r requirements.txt
sudo -u www-data venv/bin/flask db upgrade
sudo systemctl restart tkani-backend
```

### Strapi

```bash
cd /var/www/tkani-backend/strapi
sudo -u www-data git pull
sudo -u www-data npm install
sudo -u www-data npm run build
sudo systemctl restart tkani-strapi
```

### Frontend

```bash
# На локальной машине
cd /path/to/tkani-new-main
git pull
npm install
npm run build
scp -r dist/* user@server:/var/www/yourdomain.ru/dist/
```

---

## 📚 Дополнительные ресурсы

- [Nginx документация](https://nginx.org/ru/docs/)
- [Let's Encrypt документация](https://letsencrypt.org/docs/)
- [Systemd документация](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [Gunicorn документация](https://docs.gunicorn.org/)

---

## 💡 Полезные команды

```bash
# Перезапуск всех сервисов
sudo systemctl restart nginx tkani-backend tkani-strapi

# Проверка статуса всех сервисов
sudo systemctl status nginx tkani-backend tkani-strapi

# Просмотр логов всех сервисов
sudo journalctl -u tkani-backend -u tkani-strapi -f

# Проверка использования ресурсов
htop
df -h
free -h
```

---

**Готово!** Ваш проект должен быть доступен по указанному домену. 🎉


