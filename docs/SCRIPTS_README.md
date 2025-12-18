# 📜 Скрипты автоматизации

Этот документ описывает все доступные скрипты для автоматизации развертывания проекта.

## 🚀 Основные скрипты

### 1. `deploy.sh` - Полное автоматическое развертывание

**Назначение:** Полностью автоматизирует процесс развертывания проекта на сервере.

**Использование:**
```bash
sudo ./deploy.sh yourdomain.ru
```

**Что делает:**
- ✅ Проверяет все зависимости
- ✅ Генерирует .env файлы с безопасными ключами
- ✅ Настраивает Nginx конфигурации
- ✅ Настраивает и запускает Backend
- ✅ Настраивает и запускает Strapi
- ✅ Настраивает systemd сервисы
- ✅ Запускает все сервисы

**Когда использовать:** При первом развертывании проекта на новом сервере.

---

### 2. `setup_domain.sh` - Настройка домена и Nginx

**Назначение:** Настраивает Nginx конфигурации и systemd сервисы для работы с доменом.

**Использование:**
```bash
sudo ./setup_domain.sh yourdomain.ru
```

**Что делает:**
- ✅ Устанавливает необходимые пакеты
- ✅ Настраивает Nginx конфигурации для всех поддоменов
- ✅ Настраивает systemd сервисы
- ✅ Получает SSL сертификаты (если DNS настроен)

**Когда использовать:** Когда нужно только настроить веб-сервер, без настройки приложений.

---

### 3. `generate_env_files.sh` - Генерация .env файлов

**Назначение:** Автоматически генерирует .env файлы для backend, Strapi и фронтенда с безопасными ключами.

**Использование:**
```bash
./generate_env_files.sh yourdomain.ru
```

**Что делает:**
- ✅ Генерирует безопасные секретные ключи
- ✅ Создает backend/.env с правильными настройками
- ✅ Создает strapi/.env с правильными настройками
- ✅ Создает frontend/.env.production.example

**Когда использовать:** Когда нужно создать или обновить .env файлы.

**Важно:** После первого запуска Strapi создайте API Token в админ-панели и добавьте его в backend/.env

---

## 🎨 Скрипты для фронтенда

### 4. `build_for_production.sh` (в tkani-new-main)

**Назначение:** Собирает фронтенд для production с правильными настройками API.

**Использование:**
```bash
cd /path/to/tkani-new-main
./build_for_production.sh yourdomain.ru
```

**Что делает:**
- ✅ Создает .env.production с правильными URL
- ✅ Устанавливает зависимости (если нужно)
- ✅ Собирает проект для production
- ✅ Показывает инструкции по загрузке на сервер

**Когда использовать:** Перед каждым обновлением фронтенда на production.

---

## 📋 Порядок использования

### Первое развертывание

1. **На сервере:**
   ```bash
   cd /var/www/tkani-backend
   sudo ./deploy.sh yourdomain.ru
   ```

2. **Настройте DNS записи** у регистратора домена

3. **Получите SSL сертификаты:**
   ```bash
   sudo certbot --nginx -d yourdomain.ru -d www.yourdomain.ru
   sudo certbot --nginx -d api.yourdomain.ru
   sudo certbot --nginx -d cms.yourdomain.ru
   ```

4. **На локальной машине - соберите фронтенд:**
   ```bash
   cd /path/to/tkani-new-main
   ./build_for_production.sh yourdomain.ru
   scp -r dist/* user@server:/var/www/yourdomain.ru/dist/
   ```

### Обновление проекта

1. **Обновить Backend:**
   ```bash
   cd /var/www/tkani-backend
   sudo -u www-data git pull
   sudo -u www-data venv/bin/pip install -r requirements.txt
   sudo systemctl restart tkani-backend
   ```

2. **Обновить Strapi:**
   ```bash
   cd /var/www/tkani-backend/strapi
   sudo -u www-data git pull
   sudo -u www-data npm install
   sudo systemctl restart tkani-strapi
   ```

3. **Обновить Frontend:**
   ```bash
   cd /path/to/tkani-new-main
   ./build_for_production.sh yourdomain.ru
   scp -r dist/* user@server:/var/www/yourdomain.ru/dist/
   ```

---

## 🔧 Дополнительные утилиты

### Проверка статуса

```bash
# Статус всех сервисов
sudo systemctl status tkani-backend tkani-strapi nginx

# Логи в реальном времени
sudo journalctl -u tkani-backend -f
sudo journalctl -u tkani-strapi -f
```

### Перезапуск сервисов

```bash
sudo systemctl restart tkani-backend tkani-strapi nginx
```

### Проверка конфигурации Nginx

```bash
sudo nginx -t
```

---

## ⚠️ Важные замечания

1. **Все скрипты должны запускаться с правами sudo** (кроме generate_env_files.sh)

2. **Перед получением SSL сертификатов** убедитесь, что DNS записи настроены и работают

3. **Не коммитьте .env файлы** в git - они содержат секретные ключи

4. **Сохраните .env файлы** в безопасном месте - они понадобятся для восстановления

5. **После первого запуска Strapi** создайте API Token в админ-панели и добавьте его в backend/.env

---

## 🆘 Решение проблем

### Скрипт не запускается

```bash
# Проверьте права на выполнение
chmod +x script_name.sh

# Проверьте синтаксис
bash -n script_name.sh
```

### Ошибки при выполнении

```bash
# Запустите с отладкой
bash -x script_name.sh yourdomain.ru
```

### Проблемы с правами

```bash
# Убедитесь, что используете sudo
sudo ./script_name.sh yourdomain.ru
```

---

## 📚 Связанная документация

- [DOMAIN_AND_HOSTING_SETUP.md](./DOMAIN_AND_HOSTING_SETUP.md) - Полное руководство
- [QUICK_DOMAIN_SETUP.md](./QUICK_DOMAIN_SETUP.md) - Быстрая инструкция
- [nginx-configs/README.md](./nginx-configs/README.md) - Конфигурации Nginx
- [systemd-services/README.md](./systemd-services/README.md) - Systemd сервисы


