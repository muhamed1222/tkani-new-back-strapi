#!/bin/bash

# Полный скрипт развертывания проекта
# Использование: ./deploy.sh yourdomain.ru

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Ошибка: Укажите домен${NC}"
    echo "Использование: ./deploy.sh yourdomain.ru"
    exit 1
fi

DOMAIN=$1
API_DOMAIN="api.$DOMAIN"
CMS_DOMAIN="cms.$DOMAIN"
PROJECT_DIR="/var/www/tkani-backend"
FRONTEND_DIR="/var/www/$DOMAIN"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Развертывание проекта Tkani          ║${NC}"
echo -e "${BLUE}║  Домен: $DOMAIN${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Ошибка: Запустите скрипт с правами sudo${NC}"
    exit 1
fi

# Функция для проверки команды
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Ошибка: $1 не установлен${NC}"
        return 1
    fi
    return 0
}

# Шаг 1: Проверка зависимостей
echo -e "${YELLOW}[Шаг 1/8] Проверка зависимостей...${NC}"
check_command nginx || exit 1
check_command python3 || exit 1
check_command node || exit 1
check_command certbot || exit 1
echo -e "${GREEN}✓ Все зависимости установлены${NC}"

# Шаг 2: Генерация .env файлов
echo -e "${YELLOW}[Шаг 2/8] Генерация .env файлов...${NC}"
if [ -f "generate_env_files.sh" ]; then
    chmod +x generate_env_files.sh
    ./generate_env_files.sh "$DOMAIN"
    echo -e "${GREEN}✓ .env файлы созданы${NC}"
else
    echo -e "${YELLOW}⚠ Скрипт generate_env_files.sh не найден, пропускаем${NC}"
fi

# Шаг 3: Настройка Nginx
echo -e "${YELLOW}[Шаг 3/8] Настройка Nginx...${NC}"
if [ -f "setup_domain.sh" ]; then
    chmod +x setup_domain.sh
    # Запускаем только настройку Nginx (без SSL, так как DNS может быть еще не настроен)
    echo -e "${YELLOW}Настройка Nginx конфигураций...${NC}"
    ./setup_domain.sh "$DOMAIN" 2>&1 | grep -v "SSL" || true
    echo -e "${GREEN}✓ Nginx настроен${NC}"
else
    echo -e "${YELLOW}⚠ Скрипт setup_domain.sh не найден${NC}"
fi

# Шаг 4: Настройка Backend
echo -e "${YELLOW}[Шаг 4/8] Настройка Backend...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    
    # Виртуальное окружение
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}Создание виртуального окружения...${NC}"
        sudo -u www-data python3 -m venv venv
    fi
    
    # Установка зависимостей
    echo -e "${YELLOW}Установка зависимостей...${NC}"
    sudo -u www-data venv/bin/pip install --upgrade pip -q
    sudo -u www-data venv/bin/pip install -r requirements.txt -q
    sudo -u www-data venv/bin/pip install gunicorn -q
    
    # Инициализация БД
    if [ ! -f "app.db" ]; then
        echo -e "${YELLOW}Инициализация базы данных...${NC}"
        sudo -u www-data venv/bin/flask db upgrade
        sudo -u www-data venv/bin/python create_admin.py || echo -e "${YELLOW}⚠ Администратор уже создан${NC}"
    fi
    
    echo -e "${GREEN}✓ Backend настроен${NC}"
else
    echo -e "${YELLOW}⚠ Директория $PROJECT_DIR не найдена${NC}"
fi

# Шаг 5: Настройка Strapi
echo -e "${YELLOW}[Шаг 5/8] Настройка Strapi...${NC}"
if [ -d "$PROJECT_DIR/strapi" ]; then
    cd "$PROJECT_DIR/strapi"
    
    # Установка зависимостей
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Установка зависимостей Strapi...${NC}"
        sudo -u www-data npm install --silent
    fi
    
    echo -e "${GREEN}✓ Strapi настроен${NC}"
else
    echo -e "${YELLOW}⚠ Директория Strapi не найдена${NC}"
fi

# Шаг 6: Настройка systemd сервисов
echo -e "${YELLOW}[Шаг 6/8] Настройка systemd сервисов...${NC}"
if [ -f "$PROJECT_DIR/systemd-services/tkani-backend.service" ]; then
    cp "$PROJECT_DIR/systemd-services/tkani-backend.service" /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable tkani-backend
    echo -e "${GREEN}✓ Backend сервис настроен${NC}"
fi

if [ -f "$PROJECT_DIR/systemd-services/tkani-strapi.service" ]; then
    cp "$PROJECT_DIR/systemd-services/tkani-strapi.service" /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable tkani-strapi
    echo -e "${GREEN}✓ Strapi сервис настроен${NC}"
fi

# Шаг 7: Запуск сервисов
echo -e "${YELLOW}[Шаг 7/8] Запуск сервисов...${NC}"
systemctl restart tkani-backend 2>/dev/null || echo -e "${YELLOW}⚠ Backend сервис не запущен (возможно, не настроен)${NC}"
systemctl restart tkani-strapi 2>/dev/null || echo -e "${YELLOW}⚠ Strapi сервис не запущен (возможно, не настроен)${NC}"
systemctl restart nginx
echo -e "${GREEN}✓ Сервисы запущены${NC}"

# Шаг 8: Информация о следующих шагах
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Развертывание завершено!             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Следующие шаги:${NC}"
echo ""
echo -e "${GREEN}1. Настройте DNS записи:${NC}"
echo "   A  @    -> IP_ВАШЕГО_СЕРВЕРА"
echo "   A  www  -> IP_ВАШЕГО_СЕРВЕРА"
echo "   A  api  -> IP_ВАШЕГО_СЕРВЕРА"
echo "   A  cms  -> IP_ВАШЕГО_СЕРВЕРА"
echo ""
echo -e "${GREEN}2. После настройки DNS получите SSL сертификаты:${NC}"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "   sudo certbot --nginx -d $API_DOMAIN"
echo "   sudo certbot --nginx -d $CMS_DOMAIN"
echo ""
echo -e "${GREEN}3. Соберите и загрузите фронтенд:${NC}"
echo "   cd /path/to/tkani-new-main"
echo "   ./build_for_production.sh $DOMAIN"
echo "   scp -r dist/* user@server:$FRONTEND_DIR/dist/"
echo ""
echo -e "${GREEN}4. Проверьте статус сервисов:${NC}"
echo "   sudo systemctl status tkani-backend"
echo "   sudo systemctl status tkani-strapi"
echo "   sudo systemctl status nginx"
echo ""
echo -e "${GREEN}5. Проверьте логи при необходимости:${NC}"
echo "   sudo journalctl -u tkani-backend -f"
echo "   sudo journalctl -u tkani-strapi -f"
echo ""
echo -e "${BLUE}После выполнения всех шагов сайты будут доступны:${NC}"
echo "   Frontend: https://$DOMAIN"
echo "   API: https://$API_DOMAIN"
echo "   CMS: https://$CMS_DOMAIN/admin"
echo ""


