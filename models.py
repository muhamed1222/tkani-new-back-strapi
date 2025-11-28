from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(120), nullable=False, index=True)
    last_name = db.Column(db.String(120), nullable=False, index=True)
    email = db.Column(db.String(200), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(200), nullable=False)
    avatar = db.Column(db.String(300))  # путь к файлу в static/avatars
    role = db.Column(db.String(20), default="user", index=True)  # user, admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    orders = db.relationship("Order", backref="user", lazy=True)
    
    __table_args__ = (
        db.CheckConstraint("length(email) >= 5", name="check_email_length"),
        db.CheckConstraint("length(first_name) >= 1", name="check_first_name_length"),
        db.CheckConstraint("length(last_name) >= 1", name="check_last_name_length"),
        db.CheckConstraint("role IN ('user', 'admin')", name="check_role"),
    )
    
    __table_args__ = (
        db.Index('idx_user_email', 'email'),
        db.Index('idx_user_role', 'role'),
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False, index=True)
    products = db.relationship("Product", backref="category", lazy=True)
    
    __table_args__ = (
        db.Index('idx_category_name', 'name'),
    )

class Brand(db.Model):
    """Бренды товаров"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False, index=True)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    products = db.relationship("Product", backref="brand", lazy=True)
    
    __table_args__ = (
        db.Index('idx_brand_name', 'name'),
        db.Index('idx_brand_slug', 'slug'),
    )

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False, index=True)
    stock = db.Column(db.Integer, default=0, index=True)
    image = db.Column(db.String(300))  # путь или URL (основное изображение)
    images = db.Column(db.Text)  # JSON массив дополнительных изображений
    specifications = db.Column(db.Text)  # JSON объект с характеристиками
    rating = db.Column(db.Float, default=0.0)  # средний рейтинг
    reviews_count = db.Column(db.Integer, default=0)  # количество отзывов
    category_id = db.Column(db.Integer, db.ForeignKey("category.id"), nullable=True, index=True)
    brand_id = db.Column(db.Integer, db.ForeignKey("brand.id"), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.Index('idx_product_title', 'title'),
        db.Index('idx_product_price', 'price'),
        db.Index('idx_product_category', 'category_id'),
        db.Index('idx_product_brand', 'brand_id'),
        db.Index('idx_product_stock', 'stock'),
    )

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    total = db.Column(db.Float, nullable=False)
    items = db.relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")
    status = db.Column(db.String(50), default="created", index=True)  # created, paid, shipped, cancelled
    history = db.relationship("OrderHistory", backref="order", lazy=True, cascade="all, delete-orphan")
    
    # Доставка
    delivery_method = db.Column(db.String(50), nullable=True, index=True)  # pickup, cdek, ozon, russian_post
    delivery_address = db.Column(db.Text, nullable=True)  # Адрес доставки
    delivery_cost = db.Column(db.Float, default=0.0)  # Стоимость доставки
    delivery_provider_data = db.Column(db.Text)  # JSON с данными от провайдера доставки (трек-номер, пункт выдачи и т.д.)
    
    # Оплата
    payment_method = db.Column(db.String(50), nullable=True, index=True)  # card, cash, invoice, yoomoney
    payment_id = db.Column(db.String(200), nullable=True, index=True)  # ID платежа в системе оплаты
    payment_status = db.Column(db.String(50), default="pending", index=True)  # pending, processing, succeeded, failed, cancelled
    payment_data = db.Column(db.Text)  # JSON с данными платежа
    
    __table_args__ = (
        db.CheckConstraint("total >= 0", name="check_order_total_positive"),
        db.CheckConstraint("delivery_cost >= 0", name="check_delivery_cost_positive"),
        db.CheckConstraint("status IN ('created', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')", name="check_order_status"),
        db.CheckConstraint("payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')", name="check_payment_status"),
    )
    
    __table_args__ = (
        db.Index('idx_order_user', 'user_id'),
        db.Index('idx_order_status', 'status'),
        db.Index('idx_order_created', 'created_at'),
        db.Index('idx_order_delivery', 'delivery_method'),
        db.Index('idx_order_payment', 'payment_method'),
        db.Index('idx_order_payment_status', 'payment_status'),
    )

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)  # price at time of order
    product = db.relationship("Product")
    
    __table_args__ = (
        db.CheckConstraint("quantity > 0", name="check_quantity_positive"),
        db.CheckConstraint("price >= 0", name="check_price_positive"),
    )
    
    __table_args__ = (
        db.Index('idx_orderitem_order', 'order_id'),
        db.Index('idx_orderitem_product', 'product_id'),
    )

class OrderHistory(db.Model):
    """История изменений заказа"""
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False, index=True)
    status = db.Column(db.String(50), nullable=False)
    changed_by = db.Column(db.String(200))  # user_id или 'system'
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    __table_args__ = (
        db.Index('idx_orderhistory_order', 'order_id'),
        db.Index('idx_orderhistory_created', 'created_at'),
    )

class Work(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False, index=True)
    image = db.Column(db.String(500), nullable=False)
    link = db.Column(db.String(500), default='#')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.Index('idx_work_created', 'created_at'),
    )

class PasswordResetCode(db.Model):
    """Коды восстановления пароля"""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), nullable=False, index=True)
    code = db.Column(db.String(6), nullable=False)  # 6-значный код
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    used = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    __table_args__ = (
        db.Index('idx_resetcode_email', 'email'),
        db.Index('idx_resetcode_expires', 'expires_at'),
        db.Index('idx_resetcode_used', 'used'),
    )