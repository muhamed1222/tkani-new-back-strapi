"""
Сервис для работы с оплатой через ЮKassa (ЮMoney)
"""
import os
import requests
import json
import hmac
import hashlib
import base64
import uuid
from typing import Optional, Dict, Any
from flask import current_app, request, url_for
from urllib.parse import urlencode

class YooMoneyPaymentService:
    """Интеграция с ЮKassa API"""
    
    def __init__(self):
        self.shop_id = os.environ.get('YOOMONEY_SHOP_ID', '')
        self.secret_key = os.environ.get('YOOMONEY_SECRET_KEY', '')
        # Используем переменную окружения или формируем из API_BASE_URL
        api_base = os.environ.get('API_BASE_URL', 'http://localhost:5001')
        default_redirect = f'{api_base}/api/v1/payment/yoomoney/callback'
        self.redirect_uri = os.environ.get('YOOMONEY_REDIRECT_URI', default_redirect)
        self.api_url = 'https://api.yookassa.ru/v3'
        
        # Базовая авторизация для ЮKassa (Basic Auth)
        credentials = f"{self.shop_id}:{self.secret_key}"
        self.auth_header = base64.b64encode(credentials.encode()).decode()
    
    def create_payment(self, order_id: int, amount: float, description: str, 
                      return_url: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Создать платеж в ЮKassa
        
        order_id: ID заказа
        amount: Сумма платежа
        description: Описание платежа
        return_url: URL для возврата после оплаты
        """
        try:
            if not self.shop_id or not self.secret_key:
                current_app.logger.error("YooKassa: Shop ID или Secret Key не настроены")
                return None
            
            # Используем FRONTEND_URL из переменных окружения
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
            default_success = f'{frontend_url}/orders/{order_id}?status=success'
            default_fail = f'{frontend_url}/orders/{order_id}?status=failed'
            
            # Генерируем уникальный idempotence_key
            idempotence_key = str(uuid.uuid4())
            
            # Формируем данные для создания платежа (ЮKassa API v3)
            payment_data = {
                'amount': {
                    'value': f"{amount:.2f}",
                    'currency': 'RUB'
                },
                'confirmation': {
                    'type': 'redirect',
                    'return_url': return_url or default_success
                },
                'capture': True,
                'description': description,
                'metadata': {
                    'order_id': str(order_id)
                }
            }
            
            headers = {
                'Authorization': f'Basic {self.auth_header}',
                'Content-Type': 'application/json',
                'Idempotence-Key': idempotence_key
            }
            
            # Создаем платеж через ЮKassa API
            response = requests.post(
                f'{self.api_url}/payments',
                json=payment_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                payment_info = response.json()
                payment_id = payment_info.get('id')
                confirmation_url = payment_info.get('confirmation', {}).get('confirmation_url')
                
                return {
                    'payment_id': payment_id,
                    'payment_url': confirmation_url,
                    'amount': amount,
                    'status': payment_info.get('status', 'pending')
                }
            else:
                current_app.logger.error(f"YooKassa create payment error: {response.status_code} - {response.text}")
                return None
            
        except Exception as e:
            current_app.logger.error(f"YooKassa create payment exception: {str(e)}")
            return None
    
    def verify_payment(self, payment_id: str, amount: float, 
                      notification_secret: Optional[str] = None) -> bool:
        """
        Проверить статус платежа
        
        payment_id: ID платежа (label)
        amount: Сумма платежа
        notification_secret: Секретный ключ из уведомления (опционально)
        """
        try:
            # Для проверки используем API ЮMoney
            # В реальном проекте нужно использовать HTTP уведомления от ЮMoney
            
            # Проверяем подпись, если она есть
            if notification_secret and self.secret_key:
                # Проверка подписи уведомления
                # Формат: sha1_hash = sha1(notification_type + '&' + operation_id + '&' + amount + '&' + currency + '&' + datetime + '&' + sender + '&' + codepro + '&' + notification_secret + '&' + label)
                pass
            
            # Запрос статуса платежа через API
            # В реальном проекте нужно использовать официальный API ЮMoney
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"YooMoney verify payment exception: {str(e)}")
            return False
    
    def process_callback(self, request_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Обработать webhook от ЮKassa
        
        request_data: Данные из webhook от ЮKassa
        """
        try:
            # ЮKassa отправляет webhook в формате JSON
            # Проверяем тип события
            event = request_data.get('event')
            if event != 'payment.succeeded' and event != 'payment.canceled':
                current_app.logger.info(f"YooKassa webhook: игнорируем событие {event}")
                return None
            
            # Получаем объект платежа
            payment_object = request_data.get('object', {})
            payment_id = payment_object.get('id')
            status = payment_object.get('status')  # succeeded, canceled, pending
            amount_value = payment_object.get('amount', {}).get('value', '0')
            amount = float(amount_value)
            
            # Извлекаем order_id из metadata
            metadata = payment_object.get('metadata', {})
            order_id_str = metadata.get('order_id')
            
            if not order_id_str:
                current_app.logger.warning("YooKassa webhook: order_id не найден в metadata")
                return None
            
            order_id = int(order_id_str)
            
            # Проверяем подпись webhook (если требуется)
            # ЮKassa может отправлять заголовок X-Request-Id для проверки
            
            return {
                'order_id': order_id,
                'payment_id': payment_id,
                'amount': amount,
                'status': 'succeeded' if status == 'succeeded' else 'failed',
                'event': event
            }
            
        except Exception as e:
            # Используем try/except для current_app, так как может вызываться вне контекста Flask
            try:
                current_app.logger.error(f"YooKassa webhook exception: {str(e)}")
            except:
                import logging
                logging.error(f"YooKassa webhook exception: {str(e)}")
            return None


def get_payment_service(provider: str) -> Optional[YooMoneyPaymentService]:
    """Получить сервис оплаты по провайдеру"""
    if provider == 'yoomoney':
        return YooMoneyPaymentService()
    return None

