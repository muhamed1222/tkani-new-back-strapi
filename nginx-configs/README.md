# Конфигурации Nginx

Этот каталог содержит готовые шаблоны конфигураций Nginx для вашего проекта.

## 📋 Использование

### Вариант 1: С поддоменами (рекомендуется)

Используйте отдельные конфигурации для каждого поддомена:

1. **Frontend**: `frontend.conf` → `yourdomain.ru`
2. **API**: `api.conf` → `api.yourdomain.ru`
3. **CMS**: `cms.conf` → `cms.yourdomain.ru`

**Установка:**
```bash
# Скопируйте и отредактируйте конфигурации
sudo cp frontend.conf /etc/nginx/sites-available/yourdomain.ru
sudo cp api.conf /etc/nginx/sites-available/api.yourdomain.ru
sudo cp cms.conf /etc/nginx/sites-available/cms.yourdomain.ru

# Замените yourdomain.ru на ваш домен в каждом файле
sudo nano /etc/nginx/sites-available/yourdomain.ru
sudo nano /etc/nginx/sites-available/api.yourdomain.ru
sudo nano /etc/nginx/sites-available/cms.yourdomain.ru

# Активируйте конфигурации
sudo ln -s /etc/nginx/sites-available/yourdomain.ru /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.yourdomain.ru /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/cms.yourdomain.ru /etc/nginx/sites-enabled/

# Проверьте и перезапустите
sudo nginx -t
sudo systemctl restart nginx
```

### Вариант 2: Без поддоменов

Используйте одну конфигурацию для всего:

1. **Все сервисы**: `single-domain.conf` → `yourdomain.ru`

**Установка:**
```bash
# Скопируйте и отредактируйте конфигурацию
sudo cp single-domain.conf /etc/nginx/sites-available/yourdomain.ru

# Замените yourdomain.ru на ваш домен
sudo nano /etc/nginx/sites-available/yourdomain.ru

# Активируйте конфигурацию
sudo ln -s /etc/nginx/sites-available/yourdomain.ru /etc/nginx/sites-enabled/

# Проверьте и перезапустите
sudo nginx -t
sudo systemctl restart nginx
```

## 🔧 Что нужно изменить

В каждом файле замените:
- `yourdomain.ru` → ваш домен
- `/var/www/yourdomain.ru/dist` → путь к собранному фронтенду
- Проверьте пути к SSL сертификатам

## 📝 Перед использованием

1. Убедитесь, что SSL сертификаты установлены (Let's Encrypt)
2. Убедитесь, что все сервисы запущены:
   - Backend на порту 5001
   - Strapi на порту 1337
   - Frontend собран в `dist/`
3. Проверьте права доступа к файлам

## 🆘 Решение проблем

**Ошибка конфигурации:**
```bash
sudo nginx -t
```

**Проверка логов:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Проверка портов:**
```bash
sudo netstat -tulpn | grep -E '5001|1337|80|443'
```

## 📚 Дополнительная информация

См. полное руководство по привязке к домену: `../DOMAIN_AND_HOSTING_SETUP.md`
См. быструю инструкцию: `../QUICK_DOMAIN_SETUP.md`

