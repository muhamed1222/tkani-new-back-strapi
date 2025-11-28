#!/bin/bash

# Скрипт автоматической настройки домена и хостинга
# Использование: sudo ./setup_domain.sh yourdomain.ru

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка аргументов
if [ -z "$1" ]; then
    echo -e "${RED}Ошибка: Укажите домен${NC}"
    echo "Использование: sudo ./setup_domain.sh yourdomain.ru"
    exit 1
fi

DOMAIN=$1
API_DOMAIN="api.$DOMAIN"
CMS_DOMAIN="cms.$DOMAIN"
PROJECT_DIR="/var/www/tkani-backend"
FRONTEND_DIR="/var/www/$DOMAIN"
NGINX_DIR="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo -e "${GREEN}=== Настройка домена $DOMAIN ===${NC}"

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Ошибка: Запустите скрипт с правами sudo${NC}"
    exit 1
fi

# 1. Обновление системы
echo -e "${YELLOW}[1/10] Обновление системы...${NC}"
apt update && apt upgrade -y

# 2. Установка необходимых пакетов
echo -e "${YELLOW}[2/10] Установка пакетов...${NC}"
apt install -y nginx python3 python3-pip python3-venv certbot python3-certbot-nginx git curl wget build-essential

# Установка Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Установка Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# 3. Создание пользователя
echo -e "${YELLOW}[3/10] Настройка пользователя...${NC}"
if ! id "www-data" &>/dev/null; then
    useradd -r -s /bin/bash www-data
fi

# 4. Создание директорий
echo -e "${YELLOW}[4/10] Создание директорий...${NC}"
mkdir -p "$PROJECT_DIR"
mkdir -p "$FRONTEND_DIR"
chown -R www-data:www-data "$PROJECT_DIR"
chown -R www-data:www-data "$FRONTEND_DIR"

# 5. Настройка Nginx конфигураций
echo -e "${YELLOW}[5/10] Настройка Nginx...${NC}"

# Frontend
if [ -f "$PROJECT_DIR/nginx-configs/frontend.conf" ]; then
    cp "$PROJECT_DIR/nginx-configs/frontend.conf" "$NGINX_DIR/$DOMAIN"
    sed -i "s/yourdomain.ru/$DOMAIN/g" "$NGINX_DIR/$DOMAIN"
    sed -i "s|/var/www/yourdomain.ru/dist|$FRONTEND_DIR/dist|g" "$NGINX_DIR/$DOMAIN"
else
    echo -e "${RED}Ошибка: Файл frontend.conf не найден${NC}"
    exit 1
fi

# API
if [ -f "$PROJECT_DIR/nginx-configs/api.conf" ]; then
    cp "$PROJECT_DIR/nginx-configs/api.conf" "$NGINX_DIR/$API_DOMAIN"
    sed -i "s/api.yourdomain.ru/$API_DOMAIN/g" "$NGINX_DIR/$API_DOMAIN"
else
    echo -e "${RED}Ошибка: Файл api.conf не найден${NC}"
    exit 1
fi

# CMS
if [ -f "$PROJECT_DIR/nginx-configs/cms.conf" ]; then
    cp "$PROJECT_DIR/nginx-configs/cms.conf" "$NGINX_DIR/$CMS_DOMAIN"
    sed -i "s/cms.yourdomain.ru/$CMS_DOMAIN/g" "$NGINX_DIR/$CMS_DOMAIN"
else
    echo -e "${RED}Ошибка: Файл cms.conf не найден${NC}"
    exit 1
fi

# Активация конфигураций
ln -sf "$NGINX_DIR/$DOMAIN" "$NGINX_ENABLED/$DOMAIN"
ln -sf "$NGINX_DIR/$API_DOMAIN" "$NGINX_ENABLED/$API_DOMAIN"
ln -sf "$NGINX_DIR/$CMS_DOMAIN" "$NGINX_ENABLED/$CMS_DOMAIN"

# Проверка конфигурации
if nginx -t; then
    systemctl restart nginx
    echo -e "${GREEN}Nginx настроен успешно${NC}"
else
    echo -e "${RED}Ошибка в конфигурации Nginx${NC}"
    exit 1
fi

# 6. Настройка systemd сервисов
echo -e "${YELLOW}[6/10] Настройка systemd сервисов...${NC}"

# Backend сервис
if [ -f "$PROJECT_DIR/systemd-services/tkani-backend.service" ]; then
    cp "$PROJECT_DIR/systemd-services/tkani-backend.service" /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable tkani-backend
    echo -e "${GREEN}Backend сервис настроен${NC}"
else
    echo -e "${YELLOW}Предупреждение: Файл tkani-backend.service не найден${NC}"
fi

# Strapi сервис
if [ -f "$PROJECT_DIR/systemd-services/tkani-strapi.service" ]; then
    cp "$PROJECT_DIR/systemd-services/tkani-strapi.service" /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable tkani-strapi
    echo -e "${GREEN}Strapi сервис настроен${NC}"
else
    echo -e "${YELLOW}Предупреждение: Файл tkani-strapi.service не найден${NC}"
fi

# 7. Получение SSL сертификатов
echo -e "${YELLOW}[7/10] Получение SSL сертификатов...${NC}"
echo -e "${YELLOW}Убедитесь, что DNS записи настроены перед получением сертификатов!${NC}"
read -p "Продолжить получение SSL сертификатов? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" || echo -e "${YELLOW}Не удалось получить сертификат для $DOMAIN${NC}"
    certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" || echo -e "${YELLOW}Не удалось получить сертификат для $API_DOMAIN${NC}"
    certbot --nginx -d "$CMS_DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" || echo -e "${YELLOW}Не удалось получить сертификат для $CMS_DOMAIN${NC}"
    echo -e "${GREEN}SSL сертификаты настроены${NC}"
else
    echo -e "${YELLOW}Пропущено получение SSL сертификатов${NC}"
    echo -e "${YELLOW}Вы можете получить их позже командой:${NC}"
    echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo "  sudo certbot --nginx -d $API_DOMAIN"
    echo "  sudo certbot --nginx -d $CMS_DOMAIN"
fi

# 8. Информация о следующих шагах
echo -e "${GREEN}=== Настройка завершена ===${NC}"
echo ""
echo -e "${YELLOW}Следующие шаги:${NC}"
echo "1. Убедитесь, что проект загружен в $PROJECT_DIR"
echo "2. Настройте .env файлы для backend и Strapi"
echo "3. Установите зависимости:"
echo "   cd $PROJECT_DIR && sudo -u www-data python3 -m venv venv"
echo "   sudo -u www-data venv/bin/pip install -r requirements.txt"
echo "   sudo -u www-data venv/bin/pip install gunicorn"
echo "4. Настройте Strapi:"
echo "   cd $PROJECT_DIR/strapi && sudo -u www-data npm install"
echo "5. Соберите и загрузите фронтенд в $FRONTEND_DIR/dist"
echo "6. Запустите сервисы:"
echo "   sudo systemctl start tkani-backend"
echo "   sudo systemctl start tkani-strapi"
echo ""
echo -e "${GREEN}Проверьте DNS записи:${NC}"
echo "  A  @    -> IP_ВАШЕГО_СЕРВЕРА"
echo "  A  www  -> IP_ВАШЕГО_СЕРВЕРА"
echo "  A  api  -> IP_ВАШЕГО_СЕРВЕРА"
echo "  A  cms  -> IP_ВАШЕГО_СЕРВЕРА"
echo ""
echo -e "${GREEN}После настройки проекта сайты будут доступны:${NC}"
echo "  Frontend: https://$DOMAIN"
echo "  API: https://$API_DOMAIN"
echo "  CMS: https://$CMS_DOMAIN/admin"


