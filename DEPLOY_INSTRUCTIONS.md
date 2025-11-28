# Инструкции по развертыванию на сервере

## Домен: centertkani.ru

## Шаги развертывания:

### 1. Подключитесь к серверу по SSH:
```bash
ssh user@your-server-ip
```

### 2. Загрузите проект на сервер:
```bash
# На сервере
sudo mkdir -p /var/www/tkani-backend
# С локальной машины
scp -r . user@server:/var/www/tkani-backend/
```

### 3. На сервере запустите:
```bash
cd /var/www/tkani-backend
sudo chmod +x deploy.sh
sudo ./deploy.sh centertkani.ru
```

### 4. Настройте DNS записи:
```
A  @    -> IP_ВАШЕГО_СЕРВЕРА
A  www  -> IP_ВАШЕГО_СЕРВЕРА
A  api  -> IP_ВАШЕГО_СЕРВЕРА
A  cms  -> IP_ВАШЕГО_СЕРВЕРА
```

### 5. Получите SSL сертификаты:
```bash
sudo certbot --nginx -d centertkani.ru -d www.centertkani.ru
sudo certbot --nginx -d api.centertkani.ru
sudo certbot --nginx -d cms.centertkani.ru
```

### 6. Соберите и загрузите фронтенд:
```bash
# На локальной машине
cd ../tkani-new-main
./build_for_production.sh centertkani.ru
scp -r dist/* user@server:/var/www/centertkani.ru/dist/
```

## Готово! 🎉
