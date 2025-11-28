#!/bin/bash
# Настройка cron для автоматического бэкапа

echo "=========================================="
echo "⏰ Настройка cron для автоматического бэкапа"
echo "=========================================="
echo ""

PROJECT_DIR=$(pwd)
BACKUP_DIR="$PROJECT_DIR/backups"
PYTHON_PATH=$(which python3)

# Проверяем наличие backup_db.py
if [ ! -f "$PROJECT_DIR/backup_db.py" ]; then
    echo "❌ Файл backup_db.py не найден!"
    exit 1
fi

echo "📋 Настройки:"
echo "   Проект: $PROJECT_DIR"
echo "   Бэкапы: $BACKUP_DIR"
echo "   Python: $PYTHON_PATH"
echo ""

# Создаем директорию для логов
mkdir -p "$BACKUP_DIR"
LOG_FILE="$BACKUP_DIR/backup.log"

# Cron команда
CRON_CMD="0 2 * * * cd $PROJECT_DIR && $PYTHON_PATH backup_db.py >> $LOG_FILE 2>&1"

echo "📝 Cron команда:"
echo "   $CRON_CMD"
echo ""

read -p "Добавить в crontab? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Проверяем, не добавлена ли уже команда
    if crontab -l 2>/dev/null | grep -q "backup_db.py"; then
        echo "⚠️  Команда бэкапа уже есть в crontab"
        echo "   Текущий crontab:"
        crontab -l 2>/dev/null | grep "backup_db.py"
    else
        # Добавляем в crontab
        (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
        echo "✅ Команда добавлена в crontab!"
        echo ""
        echo "📋 Текущий crontab:"
        crontab -l
    fi
else
    echo "⚠️  Команда не добавлена"
    echo ""
    echo "💡 Добавьте вручную:"
    echo "   crontab -e"
    echo "   Затем добавьте строку:"
    echo "   $CRON_CMD"
fi

echo ""
echo "🧪 Тестовый запуск бэкапа..."
python3 backup_db.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Тестовый бэкап успешен!"
    echo "   Проверьте: $BACKUP_DIR"
else
    echo ""
    echo "⚠️  Тестовый бэкап завершился с ошибкой"
fi

echo ""
echo "✅ Настройка завершена!"

