"""
Админ-роуты, интегрированные со Strapi
"""
from flask import Blueprint, request, jsonify
from services.strapi_client import StrapiClient
from routes.utils import admin_required
from errors import NotFoundError, ValidationError

admin_strapi_bp = Blueprint("admin_strapi", __name__)
strapi_client = StrapiClient()

def convert_strapi_product_to_flask(strapi_product: dict) -> dict:
    """Конвертировать продукт из формата Strapi в формат Flask API"""
    # Strapi возвращает данные в формате:
    # { id, attributes: { title, price, ... }, ... }
    attributes = strapi_product.get('attributes', {})
    
    # Обработка медиа (изображений)
    image = None
    if 'image' in attributes and attributes['image']:
        image_data = attributes['image'].get('data', {})
        if image_data and 'attributes' in image_data:
            image_url = image_data['attributes'].get('url')
            if image_url:
                image = f"/uploads{image_url}"  # Путь относительно Strapi
    
    # Обработка связей
    category_id = None
    if 'category' in attributes and attributes['category']:
        category_data = attributes['category'].get('data')
        if category_data:
            category_id = category_data.get('id')
    
    brand_id = None
    if 'brand' in attributes and attributes['brand']:
        brand_data = attributes['brand'].get('data')
        if brand_data:
            brand_id = brand_data.get('id')
    
    return {
        'id': strapi_product.get('id'),
        'title': attributes.get('title', ''),
        'description': attributes.get('description', ''),
        'price': float(attributes.get('price', 0)),
        'stock': int(attributes.get('stock', 0)),
        'image': image,
        'images': attributes.get('images', []),
        'specifications': attributes.get('specifications'),
        'rating': float(attributes.get('rating', 0)),
        'reviews_count': int(attributes.get('reviews_count', 0)),
        'category_id': category_id,
        'brand_id': brand_id,
        'created_at': strapi_product.get('createdAt'),
        'updated_at': strapi_product.get('updatedAt'),
    }

@admin_strapi_bp.route("/products", methods=["GET"])
@admin_required
def list_all_products():
    """Получить список всех товаров из Strapi"""
    try:
        products = strapi_client.get_products(populate=True)
        
        if products is None:
            raise ValidationError("Не удалось получить товары из Strapi")
        
        # Конвертируем в формат Flask API
        flask_products = [convert_strapi_product_to_flask(p) for p in products]
        
        return jsonify({
            "success": True,
            "products": flask_products
        }), 200
    except Exception as e:
        raise ValidationError(f"Ошибка при получении товаров: {str(e)}")

@admin_strapi_bp.route("/products", methods=["POST"])
@admin_required
def create_product():
    """Создать товар в Strapi"""
    try:
        # Получаем данные из formData
        data = {}
        if request.is_json:
            data = request.get_json()
        else:
            form_data = request.form.to_dict()
            data = {
                'title': form_data.get('title'),
                'description': form_data.get('description', ''),
                'price': float(form_data.get('price', 0)),
                'stock': int(form_data.get('stock', 0)),
                'rating': float(form_data.get('rating', 0)) if form_data.get('rating') else None,
                'reviews_count': int(form_data.get('reviews_count', 0)) if form_data.get('reviews_count') else None,
            }
            
            # Добавляем связи
            if form_data.get('category_id'):
                data['category'] = int(form_data.get('category_id'))
            if form_data.get('brand_id'):
                data['brand'] = int(form_data.get('brand_id'))
        
        # Обработка файлов
        files = {}
        if 'image' in request.files:
            files['image'] = request.files['image']
        
        product = strapi_client.create_product(data, files=files if files else None)
        
        if product is None:
            raise ValidationError("Не удалось создать товар в Strapi")
        
        flask_product = convert_strapi_product_to_flask(product)
        
        return jsonify({
            "success": True,
            "message": "Товар успешно создан",
            "product": flask_product
        }), 201
    except Exception as e:
        raise ValidationError(f"Ошибка при создании товара: {str(e)}")

@admin_strapi_bp.route("/products/<int:product_id>", methods=["PUT"])
@admin_required
def update_product(product_id):
    """Обновить товар в Strapi"""
    try:
        product = strapi_client.get_product(product_id)
        if not product:
            raise NotFoundError("Товар не найден")
        
        # Получаем данные для обновления
        data = {}
        if request.is_json:
            data = request.get_json()
        else:
            form_data = request.form.to_dict()
            if 'title' in form_data:
                data['title'] = form_data['title']
            if 'description' in form_data:
                data['description'] = form_data['description']
            if 'price' in form_data:
                data['price'] = float(form_data['price'])
            if 'stock' in form_data:
                data['stock'] = int(form_data['stock'])
            if 'category_id' in form_data:
                data['category'] = int(form_data['category_id']) if form_data['category_id'] else None
            if 'brand_id' in form_data:
                data['brand'] = int(form_data['brand_id']) if form_data['brand_id'] else None
        
        # Обработка файлов
        files = {}
        if 'image' in request.files:
            files['image'] = request.files['image']
        
        updated_product = strapi_client.update_product(product_id, data, files=files if files else None)
        
        if updated_product is None:
            raise ValidationError("Не удалось обновить товар в Strapi")
        
        flask_product = convert_strapi_product_to_flask(updated_product)
        
        return jsonify({
            "success": True,
            "message": "Товар успешно обновлен",
            "product": flask_product
        }), 200
    except (NotFoundError, ValidationError) as e:
        raise
    except Exception as e:
        raise ValidationError(f"Ошибка при обновлении товара: {str(e)}")

@admin_strapi_bp.route("/products/<int:product_id>", methods=["DELETE"])
@admin_required
def delete_product(product_id):
    """Удалить товар из Strapi"""
    try:
        product = strapi_client.get_product(product_id)
        if not product:
            raise NotFoundError("Товар не найден")
        
        success = strapi_client.delete_product(product_id)
        
        if not success:
            raise ValidationError("Не удалось удалить товар из Strapi")
        
        return jsonify({
            "success": True,
            "message": "Товар успешно удален"
        }), 200
    except NotFoundError as e:
        raise
    except Exception as e:
        raise ValidationError(f"Ошибка при удалении товара: {str(e)}")

