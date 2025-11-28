"""
Роуты для работы с доставкой
"""
from flask import Blueprint, request, jsonify
from services.delivery_service import calculate_delivery_cost
from errors import ValidationError

delivery_bp = Blueprint("delivery", __name__)

@delivery_bp.route("/calculate", methods=["POST"])
def calculate_delivery():
    """
    Рассчитать стоимость доставки
    ---
    tags:
      - delivery
    parameters:
      - name: provider
        in: body
        type: string
        required: true
        enum: [pickup, cdek, ozon, russian_post]
      - name: weight
        in: body
        type: number
        required: true
      - name: dimensions
        in: body
        type: object
        required: true
      - name: from_city
        in: body
        type: string
        required: true
      - name: to_city
        in: body
        type: string
        required: true
      - name: to_address
        in: body
        type: string
    responses:
      200:
        description: Стоимость доставки рассчитана
      400:
        description: Ошибка валидации
    """
    try:
        data = request.get_json() or {}
        
        provider = data.get("provider")
        weight = float(data.get("weight", 1.0))
        dimensions = data.get("dimensions", {"length": 30, "width": 20, "height": 10})
        from_city = data.get("from_city", "Нальчик")
        to_city = data.get("to_city", "Нальчик")
        to_address = data.get("to_address")
        
        if not provider:
            raise ValidationError("Провайдер доставки не указан")
        
        valid_providers = ["pickup", "cdek", "ozon", "russian_post"]
        if provider not in valid_providers:
            raise ValidationError(f"Недопустимый провайдер. Допустимые: {', '.join(valid_providers)}")
        
        cost = calculate_delivery_cost(
            provider=provider,
            weight=weight,
            dimensions=dimensions,
            from_city=from_city,
            to_city=to_city,
            to_address=to_address
        )
        
        return jsonify({
            "success": True,
            "provider": provider,
            "cost": cost,
            "currency": "RUB"
        }), 200
        
    except (ValidationError, ValueError) as e:
        raise ValidationError(f"Ошибка расчета доставки: {str(e)}")
    except Exception as e:
        raise ValidationError(f"Ошибка при расчете доставки: {str(e)}")

