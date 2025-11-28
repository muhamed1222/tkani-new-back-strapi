"""add delivery and payment fields to order

Revision ID: add_delivery_payment
Revises: 
Create Date: 2024-01-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_delivery_payment'
down_revision = '18c87ddace32'  # Зависит от предыдущей миграции
branch_labels = None
depends_on = None


def upgrade():
    # Добавляем поля для доставки
    op.add_column('order', sa.Column('delivery_method', sa.String(length=50), nullable=True))
    op.add_column('order', sa.Column('delivery_address', sa.Text(), nullable=True))
    op.add_column('order', sa.Column('delivery_cost', sa.Float(), nullable=True, server_default='0.0'))
    op.add_column('order', sa.Column('delivery_provider_data', sa.Text(), nullable=True))
    
    # Добавляем поля для оплаты
    op.add_column('order', sa.Column('payment_method', sa.String(length=50), nullable=True))
    op.add_column('order', sa.Column('payment_id', sa.String(length=200), nullable=True))
    op.add_column('order', sa.Column('payment_status', sa.String(length=50), nullable=True, server_default='pending'))
    op.add_column('order', sa.Column('payment_data', sa.Text(), nullable=True))
    
    # Создаем индексы
    op.create_index('idx_order_delivery', 'order', ['delivery_method'])
    op.create_index('idx_order_payment', 'order', ['payment_method'])
    op.create_index('idx_order_payment_status', 'order', ['payment_status'])


def downgrade():
    # Удаляем индексы
    op.drop_index('idx_order_payment_status', table_name='order')
    op.drop_index('idx_order_payment', table_name='order')
    op.drop_index('idx_order_delivery', table_name='order')
    
    # Удаляем поля
    op.drop_column('order', 'payment_data')
    op.drop_column('order', 'payment_status')
    op.drop_column('order', 'payment_id')
    op.drop_column('order', 'payment_method')
    op.drop_column('order', 'delivery_provider_data')
    op.drop_column('order', 'delivery_cost')
    op.drop_column('order', 'delivery_address')
    op.drop_column('order', 'delivery_method')

