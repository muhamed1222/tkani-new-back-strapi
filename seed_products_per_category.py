from random import randint, uniform
from datetime import datetime
from app import create_app
from models import db, Category, Product

"""
Скрипт добавляет по несколько (по умолчанию 3) товаров в каждую существующую категорию,
не удаляя существующие данные. Если в категории уже есть товары, добавит недостающее
количество до заданного минимума.
"""

MIN_PRODUCTS_PER_CATEGORY = 3


def generate_product_payload(category_id: int, index: int) -> Product:
    base_price = round(uniform(199.0, 1999.0), 2)
    stock = randint(5, 50)
    title = f"Товар {index} для категории #{category_id}"
    description = f"Автосгенерированный товар {index} для категории #{category_id}. "\
                  f"Добавлен {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}."

    product = Product(
        title=title,
        description=description,
        price=base_price,
        stock=stock,
        image=None,  # можно указать плейсхолдер, если потребуется
        images=None,
        specifications=None,
        rating=round(uniform(3.5, 5.0), 1),
        reviews_count=randint(0, 120),
        category_id=category_id,
        brand_id=None,
    )
    return product


def seed_products():
    app = create_app()
    with app.app_context():
        categories = Category.query.order_by(Category.id.asc()).all()
        if not categories:
            default_names = [
                "Хлопок",
                "Лён",
                "Шёлк",
                "Шерсть",
                "Синтетика",
            ]
            for name in default_names:
                db.session.add(Category(name=name))
            db.session.commit()
            categories = Category.query.order_by(Category.id.asc()).all()

        total_created = 0
        for category in categories:
            existing_count = Product.query.filter_by(category_id=category.id).count()
            need_to_create = max(0, MIN_PRODUCTS_PER_CATEGORY - existing_count)
            if need_to_create == 0:
                continue

            for i in range(existing_count + 1, existing_count + need_to_create + 1):
                prod = generate_product_payload(category.id, i)
                db.session.add(prod)
                total_created += 1

        if total_created > 0:
            db.session.commit()
        print(f"Готово. Добавлено товаров: {total_created}")


if __name__ == "__main__":
    seed_products()


