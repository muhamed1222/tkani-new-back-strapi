"""
Скрипт для добавления тестовых брендов

⚠️ УСТАРЕЛО: Бренды теперь управляются через Strapi CMS.
Используйте Strapi админ-панель: http://localhost:1337/admin
или скрипт миграции: python3 migrate_to_strapi.py
"""
from app import create_app
from models import db, Brand

app = create_app()

with app.app_context():
    brands_data = [
        {'name': 'Египет', 'slug': 'egypt'},
        {'name': 'Азия', 'slug': 'asia'},
        {'name': 'Турция', 'slug': 'turkey'},
        {'name': 'Россия', 'slug': 'russia'},
        {'name': 'Италия', 'slug': 'italy'},
    ]
    
    existing_count = Brand.query.count()
    print(f"⚠️  ВНИМАНИЕ: Этот скрипт устарел!")
    print(f"   Бренды теперь управляются через Strapi CMS.")
    print(f"   Используйте Strapi админ-панель: http://localhost:1337/admin")
    print(f"\nТекущее количество брендов в Flask БД: {existing_count}")
    
    response = input("\nПродолжить добавление в Flask БД? (y/n): ")
    if response.lower() != 'y':
        print("Отменено.")
        exit(0)
    
    added_count = 0
    for brand_data in brands_data:
        existing = Brand.query.filter_by(slug=brand_data['slug']).first()
        if not existing:
            brand = Brand(**brand_data)
            db.session.add(brand)
            added_count += 1
    
    db.session.commit()
    print(f"✅ Добавлено новых брендов: {added_count}")
    print(f"✅ Всего брендов в базе: {Brand.query.count()}")
