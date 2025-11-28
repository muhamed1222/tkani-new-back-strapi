# ⚡ Быстрая настройка домена

Краткая инструкция для быстрой привязки проекта к домену.

## 🚀 Быстрый старт

### 1. Подготовка сервера

```bash
# На сервере выполните:
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx python3 python3-pip python3-venv certbot python3-certbot-nginx nodejs git
```

### 2. Загрузка проекта

```bash
# Загрузите проект на сервер в /var/www/tkani-backend
sudo mkdir -p /var/www/tkani-backend
# Используйте git clone или scp для загрузки файлов
```

### 3. Автоматическая настройка

**Вариант A: Полное автоматическое развертывание (рекомендуется)**

```bash
cd /var/www/tkani-backend
sudo chmod +x deploy.sh
sudo ./deploy.sh yourdomain.ru
```

Скрипт автоматически:
- ✅ Проверит все зависимости
- ✅ Сгенерирует .env файлы с безопасными ключами
- ✅ Настроит Nginx конфигурации
- ✅ Настроит и запустит Backend
- ✅ Настроит и запустит Strapi
- ✅ Настроит systemd сервисы

**Вариант B: Пошаговая настройка**

```bash
cd /var/www/tkani-backend
sudo chmod +x setup_domain.sh
sudo ./setup_domain.sh yourdomain.ru
```

Скрипт автоматически:
- ✅ Установит необходимые пакеты
- ✅ Настроит Nginx конфигурации
- ✅ Настроит systemd сервисы
- ✅ Получит SSL сертификаты (если DNS настроен)

### 4. Настройка DNS

У вашего регистратора домена добавьте A-записи:

```
Тип    Имя    Значение           TTL
A      @      IP_ВАШЕГО_СЕРВЕРА  3600
A      www    IP_ВАШЕГО_СЕРВЕРА  3600
A      api    IP_ВАШЕГО_СЕРВЕРА  3600
A      cms    IP_ВАШЕГО_СЕРВЕРА  3600
```

**Важно:** Подождите 5-30 минут после настройки DNS.

### 5. Настройка Backend

**Если использовали deploy.sh - этот шаг уже выполнен!**

```bash
cd /var/www/tkani-backend

# Генерация .env файлов (автоматически с безопасными ключами)
sudo chmod +x generate_env_files.sh
sudo ./generate_env_files.sh yourdomain.ru

# Или создайте .env вручную:
# sudo -u www-data nano .env
# Добавьте:
# FLASK_ENV=production
# SECRET_KEY=your-secret-key
# JWT_SECRET_KEY=your-jwt-secret
# CORS_ORIGINS=https://yourdomain.ru,https://www.yourdomain.ru

# Создать виртуальное окружение
sudo -u www-data python3 -m venv venv
sudo -u www-data venv/bin/pip install -r requirements.txt
sudo -u www-data venv/bin/pip install gunicorn

# Инициализировать БД
sudo -u www-data venv/bin/flask db upgrade
sudo -u www-data venv/bin/python create_admin.py
```

### 6. Настройка Strapi

```bash
cd /var/www/tkani-backend/strapi

# Установить зависимости
sudo -u www-data npm install

# Настроить .env
sudo -u www-data nano .env
# Добавьте необходимые переменные (см. DOMAIN_AND_HOSTING_SETUP.md)
```

### 7. Запуск сервисов

```bash
sudo systemctl start tkani-backend
sudo systemctl start tkani-strapi

# Проверить статус
sudo systemctl status tkani-backend
sudo systemctl status tkani-strapi
```

### 8. Сборка и загрузка фронтенда

На локальной машине:

```bash
cd /path/to/tkani-new-main

# Автоматическая сборка с правильными настройками
chmod +x build_for_production.sh
./build_for_production.sh yourdomain.ru

# Или вручную:
# echo "VITE_API_URL=https://api.yourdomain.ru/api/v1" > .env.production
# echo "VITE_STRAPI_URL=https://cms.yourdomain.ru" >> .env.production
# npm run build

# Загрузить на сервер
scp -r dist/* user@server:/var/www/yourdomain.ru/dist/
```

На сервере:

```bash
sudo mkdir -p /var/www/yourdomain.ru/dist
sudo chown -R www-data:www-data /var/www/yourdomain.ru
```

## ✅ Проверка

- Frontend: https://yourdomain.ru
- API: https://api.yourdomain.ru/api/v1/catalog/categories
- CMS: https://cms.yourdomain.ru/admin

## 📚 Подробная документация

См. [DOMAIN_AND_HOSTING_SETUP.md](./DOMAIN_AND_HOSTING_SETUP.md) для полной инструкции.

## 🆘 Проблемы?

```bash
# Проверить логи
sudo journalctl -u tkani-backend -f
sudo journalctl -u tkani-strapi -f
sudo tail -f /var/log/nginx/error.log

# Проверить статус
sudo systemctl status tkani-backend tkani-strapi nginx
```
