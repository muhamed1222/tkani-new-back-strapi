#!/usr/bin/env python3
"""
Скрипт для миграции данных из Flask БД в Strapi CMS
"""
import os
import sys
import json
import requests
from app import create_app
from models import db, Product, Category, Brand, Work

# Конфигурация Strapi
STRAPI_URL = os.environ.get('STRAPI_URL', 'http://localhost:1337')
STRAPI_API_TOKEN = os.environ.get('STRAPI_API_TOKEN', '')

def get_strapi_token():
    """Получить API токен Strapi"""
    if not STRAPI_API_TOKEN:
        print("⚠️  Переменная STRAPI_API_TOKEN не установлена!")
        print("   Создайте API Token в Strapi: Settings > API Tokens > Create new API Token")
        print("   Экспортируйте: export STRAPI_API_TOKEN='your-token'")
        sys.exit(1)
    return STRAPI_API_TOKEN

def migrate_categories(app):
    """Миграция категорий"""
    print("\n📁 Миграция категорий...")
    token = get_strapi_token()
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    categories_map = {}
    
    with app.app_context():
        categories = Category.query.all()
        
        for category in categories:
            data = {
                'data': {
                    'name': category.name
                }
            }
            
            try:
                response = requests.post(
                    f'{STRAPI_URL}/api/categories',
                    headers=headers,
                    json=data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    categories_map[category.id] = result['data']['id']
                    print(f"  ✅ Категория '{category.name}' создана (ID: {result['data']['id']})")
                else:
                    print(f"  ❌ Ошибка создания категории '{category.name}': {response.text}")
            except Exception as e:
                print(f"  ❌ Ошибка при создании категории '{category.name}': {str(e)}")
    
    return categories_map

def migrate_brands(app):
    """Миграция брендов"""
    print("\n🏷️  Миграция брендов...")
    token = get_strapi_token()
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    brands_map = {}
    
    with app.app_context():
        brands = Brand.query.all()
        
        for brand in brands:
            data = {
                'data': {
                    'name': brand.name,
                    'slug': brand.slug
                }
            }
            
            try:
                response = requests.post(
                    f'{STRAPI_URL}/api/brands',
                    headers=headers,
                    json=data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    brands_map[brand.id] = result['data']['id']
                    print(f"  ✅ Бренд '{brand.name}' создан (ID: {result['data']['id']})")
                else:
                    print(f"  ❌ Ошибка создания бренда '{brand.name}': {response.text}")
            except Exception as e:
                print(f"  ❌ Ошибка при создании бренда '{brand.name}': {str(e)}")
    
    return brands_map

def migrate_products(app, categories_map, brands_map):
    """Миграция товаров"""
    print("\n📦 Миграция товаров...")
    token = get_strapi_token()
    
    with app.app_context():
        products = Product.query.all()
        
        for product in products:
            product_data = {
                'data': {
                    'title': product.title,
                    'description': product.description or '',
                    'price': float(product.price),
                    'stock': product.stock or 0,
                    'rating': float(product.rating) if product.rating else 0,
                    'reviews_count': product.reviews_count or 0,
                }
            }
            
            # Добавляем категорию если есть
            if product.category_id and product.category_id in categories_map:
                product_data['data']['category'] = categories_map[product.category_id]
            
            # Добавляем бренд если есть
            if product.brand_id and product.brand_id in brands_map:
                product_data['data']['brand'] = brands_map[product.brand_id]
            
            # Добавляем спецификации если есть
            if product.specifications:
                try:
                    product_data['data']['specifications'] = json.loads(product.specifications)
                except:
                    pass
            
            # Загрузка изображений будет отдельным шагом
            # Здесь только метаданные
            
            try:
                # Используем multipart/form-data для загрузки с медиа
                # Пока создаем без изображений
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                response = requests.post(
                    f'{STRAPI_URL}/api/products',
                    headers=headers,
                    json=product_data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"  ✅ Товар '{product.title}' создан (ID: {result['data']['id']})")
                else:
                    print(f"  ❌ Ошибка создания товара '{product.title}': {response.text}")
            except Exception as e:
                print(f"  ❌ Ошибка при создании товара '{product.title}': {str(e)}")

def migrate_works(app):
    """Миграция работ"""
    print("\n🎨 Миграция работ...")
    token = get_strapi_token()
    
    with app.app_context():
        works = Work.query.all()
        
        for work in works:
            work_data = {
                'data': {
                    'title': work.title,
                    'link': work.link or '#'
                    # Изображение будет загружено отдельно
                }
            }
            
            try:
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                response = requests.post(
                    f'{STRAPI_URL}/api/works',
                    headers=headers,
                    json=work_data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"  ✅ Работа '{work.title}' создана (ID: {result['data']['id']})")
                else:
                    print(f"  ❌ Ошибка создания работы '{work.title}': {response.text}")
            except Exception as e:
                print(f"  ❌ Ошибка при создании работы '{work.title}': {str(e)}")

def main():
    print("🚀 Начало миграции данных в Strapi...")
    print(f"   Strapi URL: {STRAPI_URL}")
    
    app = create_app()
    
    # Проверяем подключение к Strapi
    try:
        response = requests.get(f'{STRAPI_URL}/api/products')
        if response.status_code == 401:
            print("⚠️  Нужна авторизация в Strapi")
        elif response.status_code != 200:
            print(f"⚠️  Strapi может быть не запущен или недоступен (код: {response.status_code})")
    except Exception as e:
        print(f"❌ Не удается подключиться к Strapi: {str(e)}")
        print("   Убедитесь, что Strapi запущен на http://localhost:1337")
        sys.exit(1)
    
    # Миграция в правильном порядке (сначала зависимости)
    categories_map = migrate_categories(app)
    brands_map = migrate_brands(app)
    migrate_products(app, categories_map, brands_map)
    migrate_works(app)
    
    print("\n✅ Миграция завершена!")
    print("\n📝 Следующие шаги:")
    print("   1. Загрузите изображения через Strapi админ-панель")
    print("   2. Проверьте данные в Strapi")
    print("   3. Настройте права доступа в Strapi")

if __name__ == '__main__':
    main()

