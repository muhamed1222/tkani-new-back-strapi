#!/usr/bin/env python3
"""
Скрипт для резервного копирования базы данных
Поддерживает SQLite и PostgreSQL
"""
import os
import sys
import subprocess
import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Настройки
BACKUP_DIR = os.environ.get('BACKUP_DIR', './backups')
RETENTION_DAYS = int(os.environ.get('BACKUP_RETENTION_DAYS', 30))  # Хранить 30 дней
DATABASE_URL = os.environ.get('DATABASE_URL', '')

def ensure_backup_dir():
    """Создать директорию для бэкапов"""
    Path(BACKUP_DIR).mkdir(parents=True, exist_ok=True)
    return BACKUP_DIR

def backup_sqlite(db_path, backup_dir):
    """Резервное копирование SQLite"""
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"app_db_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)
    
    try:
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ SQLite backup created: {backup_path}")
        return backup_path
    except Exception as e:
        print(f"❌ Error backing up SQLite: {str(e)}")
        return None

def backup_postgresql(db_url, backup_dir):
    """Резервное копирование PostgreSQL"""
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"postgres_db_{timestamp}.sql"
    backup_path = os.path.join(backup_dir, backup_filename)
    
    try:
        # Извлекаем параметры из DATABASE_URL
        # Формат: postgresql://user:password@host:port/database
        from urllib.parse import urlparse
        parsed = urlparse(db_url)
        
        db_name = parsed.path[1:]  # Убираем первый /
        db_user = parsed.username
        db_password = parsed.password
        db_host = parsed.hostname
        db_port = parsed.port or 5432
        
        # Используем pg_dump для создания бэкапа
        env = os.environ.copy()
        env['PGPASSWORD'] = db_password
        
        cmd = [
            'pg_dump',
            '-h', db_host,
            '-p', str(db_port),
            '-U', db_user,
            '-d', db_name,
            '-F', 'c',  # Custom format (сжатый)
            '-f', backup_path
        ]
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ PostgreSQL backup created: {backup_path}")
            return backup_path
        else:
            print(f"❌ Error backing up PostgreSQL: {result.stderr}")
            return None
            
    except FileNotFoundError:
        print("❌ pg_dump not found. Install PostgreSQL client tools.")
        return None
    except Exception as e:
        print(f"❌ Error backing up PostgreSQL: {str(e)}")
        return None

def cleanup_old_backups(backup_dir, retention_days):
    """Удалить старые бэкапы"""
    try:
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=retention_days)
        deleted_count = 0
        
        for file_path in Path(backup_dir).glob('*'):
            if file_path.is_file():
                file_mtime = datetime.datetime.fromtimestamp(file_path.stat().st_mtime)
                if file_mtime < cutoff_date:
                    file_path.unlink()
                    deleted_count += 1
                    print(f"🗑️  Deleted old backup: {file_path.name}")
        
        if deleted_count > 0:
            print(f"✅ Cleaned up {deleted_count} old backup(s)")
        else:
            print("ℹ️  No old backups to clean up")
            
    except Exception as e:
        print(f"⚠️  Error cleaning up old backups: {str(e)}")

def main():
    """Главная функция"""
    print("=" * 60)
    print("💾 Database Backup Script")
    print("=" * 60)
    print()
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL not set in environment")
        sys.exit(1)
    
    backup_dir = ensure_backup_dir()
    print(f"📁 Backup directory: {backup_dir}")
    print()
    
    # Определяем тип БД и создаем бэкап
    if 'sqlite' in DATABASE_URL:
        # SQLite
        db_path = DATABASE_URL.replace('sqlite:///', '')
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            sys.exit(1)
        
        backup_path = backup_sqlite(db_path, backup_dir)
    elif 'postgresql' in DATABASE_URL:
        # PostgreSQL
        backup_path = backup_postgresql(DATABASE_URL, backup_dir)
    else:
        print(f"❌ Unsupported database type in DATABASE_URL: {DATABASE_URL}")
        sys.exit(1)
    
    if backup_path:
        # Получаем размер файла
        file_size = os.path.getsize(backup_path)
        size_mb = file_size / (1024 * 1024)
        print(f"📊 Backup size: {size_mb:.2f} MB")
        print()
        
        # Очистка старых бэкапов
        cleanup_old_backups(backup_dir, RETENTION_DAYS)
        print()
        print("✅ Backup completed successfully!")
    else:
        print()
        print("❌ Backup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()

