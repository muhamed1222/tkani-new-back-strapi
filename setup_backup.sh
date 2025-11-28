#!/bin/bash
# Настройка автоматического резервного копирования

echo "=========================================="
echo "💾 Настройка автоматического бэкапа БД"
echo "=========================================="
echo ""

# Проверка наличия backup_db.py
if [ ! -f backup_db.py ]; then
    echo "❌ Файл backup_db.py не найден!"
    exit 1
fi

echo "✅ Скрипт backup_db.py найден"
echo ""

# Настройки
PROJECT_DIR=$(pwd)
DEFAULT_BACKUP_DIR="$PROJECT_DIR/backups"

read -p "Директория для бэкапов [$DEFAULT_BACKUP_DIR]: " BACKUP_DIR
BACKUP_DIR=${BACKUP_DIR:-$DEFAULT_BACKUP_DIR}

read -p "Хранить бэкапы (дней) [30]: " RETENTION_DAYS
RETENTION_DAYS=${RETENTION_DAYS:-30}

echo ""
echo "Создание директории для бэкапов..."
mkdir -p "$BACKUP_DIR"
chmod 755 "$BACKUP_DIR"

echo ""
echo "📝 Настройки бэкапа:"
echo "   Директория: $BACKUP_DIR"
echo "   Хранение: $RETENTION_DAYS дней"
echo ""

# Обновляем .env
if [ ! -f .env ]; then
    echo "Создание .env файла..."
    touch .env
fi

# Удаляем старые настройки, если есть
sed -i '' '/^BACKUP_DIR=/d' .env 2>/dev/null || sed -i '/^BACKUP_DIR=/d' .env 2>/dev/null
sed -i '' '/^BACKUP_RETENTION_DAYS=/d' .env 2>/dev/null || sed -i '/^BACKUP_RETENTION_DAYS=/d' .env 2>/dev/null

# Добавляем новые настройки
echo "" >> .env
echo "# Резервное копирование" >> .env
echo "BACKUP_DIR=$BACKUP_DIR" >> .env
echo "BACKUP_RETENTION_DAYS=$RETENTION_DAYS" >> .env

echo "✅ Настройки добавлены в .env"
echo ""

# Создаем systemd timer для автоматического бэкапа
echo "🔧 Создание systemd сервиса и таймера..."
echo ""

SERVICE_FILE="/tmp/tkani-backup.service"
TIMER_FILE="/tmp/tkani-backup.timer"
PROJECT_DIR=$(pwd)

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Tkani Database Backup
After=network.target

[Service]
Type=oneshot
User=$(whoami)
WorkingDirectory=$PROJECT_DIR
Environment="DATABASE_URL=$(grep '^DATABASE_URL=' .env | cut -d'=' -f2-)"
Environment="BACKUP_DIR=$BACKUP_DIR"
Environment="BACKUP_RETENTION_DAYS=$RETENTION_DAYS"
ExecStart=/usr/bin/python3 $PROJECT_DIR/backup_db.py
StandardOutput=append:$BACKUP_DIR/backup.log
StandardError=append:$BACKUP_DIR/backup.log

[Install]
WantedBy=multi-user.target
EOF

cat > "$TIMER_FILE" <<EOF
[Unit]
Description=Run Tkani backup daily
Requires=tkani-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

echo "✅ Файлы systemd созданы:"
echo "   $SERVICE_FILE"
echo "   $TIMER_FILE"
echo ""
echo "📋 Для установки systemd сервиса (требуются права root):"
echo ""
echo "   sudo cp $SERVICE_FILE /etc/systemd/system/tkani-backup.service"
echo "   sudo cp $TIMER_FILE /etc/systemd/system/tkani-backup.timer"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable tkani-backup.timer"
echo "   sudo systemctl start tkani-backup.timer"
echo ""
echo "📋 Альтернатива: Использовать cron"
echo ""
echo "   crontab -e"
echo "   Добавьте строку:"
echo "   0 2 * * * cd $PROJECT_DIR && /usr/bin/python3 backup_db.py >> $BACKUP_DIR/backup.log 2>&1"
echo ""

# Тестовый запуск
echo "🧪 Тестовый запуск бэкапа..."
python3 backup_db.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Тестовый бэкап успешен!"
    echo "   Проверьте директорию: $BACKUP_DIR"
else
    echo ""
    echo "⚠️  Тестовый бэкап завершился с ошибкой"
    echo "   Проверьте настройки DATABASE_URL в .env"
fi

echo ""
echo "✅ Настройка бэкапа завершена!"

