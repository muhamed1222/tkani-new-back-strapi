"""
Роуты для работы с оплатой
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Order
from services.payment_service import get_payment_service
from errors import NotFoundError, ValidationError
import json

payment_bp = Blueprint("payment", __name__)

@payment_bp.route("/yoomoney/callback", methods=["POST"])
def yoomoney_callback():
    """
    Обработка webhook от ЮKassa
    ---
    tags:
      - payment
    """
    try:
        # ЮKassa отправляет webhook только через POST в формате JSON
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "message": "Неверный формат данных"}), 400
        
        payment_service = get_payment_service("yoomoney")
        if not payment_service:
            raise ValidationError("Сервис оплаты не настроен")
        
        callback_data = payment_service.process_callback(data)
        
        if not callback_data:
            return jsonify({"success": False, "message": "Неверные данные webhook"}), 400
        
        order_id = callback_data.get("order_id")
        payment_status = callback_data.get("status")
        payment_id = callback_data.get("payment_id")
        
        # Обновляем заказ
        order = Order.query.get(order_id)
        if not order:
            current_app.logger.warning(f"YooKassa webhook: заказ {order_id} не найден")
            # Возвращаем 200, чтобы ЮKassa не повторял запрос
            return jsonify({"success": False, "message": "Заказ не найден"}), 200
        
        order.payment_status = payment_status
        order.payment_id = payment_id
        
        # Обновляем статус заказа в зависимости от статуса оплаты
        if payment_status == "succeeded":
            order.status = "paid"
        elif payment_status == "failed":
            order.status = "created"  # Оставляем заказ в статусе created
        
        # Сохраняем данные платежа
        payment_data = json.loads(order.payment_data) if order.payment_data else {}
        payment_data.update(callback_data)
        order.payment_data = json.dumps(payment_data)
        
        db.session.commit()
        
        # ЮKassa ожидает ответ 200 OK
        return jsonify({
            "success": True,
            "order_id": order_id,
            "payment_status": payment_status
        }), 200
        
    except (ValidationError, NotFoundError) as e:
        db.session.rollback()
        # Возвращаем 200, чтобы ЮKassa не повторял запрос при ошибках валидации
        return jsonify({"success": False, "message": str(e)}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"YooKassa webhook error: {str(e)}")
        # Возвращаем 200, чтобы ЮKassa не повторял запрос
        return jsonify({"success": False, "message": "Ошибка обработки webhook"}), 200

@payment_bp.route("/yoomoney/status/<int:order_id>", methods=["GET"])
@jwt_required()
def yoomoney_status(order_id):
    """
    Проверить статус оплаты заказа
    ---
    tags:
      - payment
    """
    try:
        user_id = get_jwt_identity()
        
        order = Order.query.filter_by(id=order_id, user_id=user_id).first()
        if not order:
            raise NotFoundError("Заказ не найден")
        
        return jsonify({
            "success": True,
            "order_id": order_id,
            "payment_status": order.payment_status,
            "payment_method": order.payment_method,
            "payment_id": order.payment_id
        }), 200
        
    except (ValidationError, NotFoundError) as e:
        raise
    except Exception as e:
        raise ValidationError(f"Ошибка проверки статуса: {str(e)}")

