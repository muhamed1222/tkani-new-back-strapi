"""
Сервис для работы с доставкой (СДЭК, Озон, Почта России)
"""
import os
import requests
import json
from typing import Optional, Dict, Any
from flask import current_app

class DeliveryService:
    """Базовый класс для работы с доставкой"""
    
    def calculate_cost(self, weight: float, dimensions: Dict[str, float], 
                     from_city: str, to_city: str, to_address: Optional[str] = None) -> Optional[float]:
        """
        Рассчитать стоимость доставки
        weight: вес в кг
        dimensions: {'length': см, 'width': см, 'height': см}
        from_city: город отправления
        to_city: город назначения
        to_address: адрес доставки (опционально)
        """
        raise NotImplementedError
    
    def create_delivery(self, order_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Создать доставку в системе провайдера"""
        raise NotImplementedError


class CDEKDeliveryService(DeliveryService):
    """Интеграция с СДЭК API"""
    
    def __init__(self):
        self.api_url = os.environ.get('CDEK_API_URL', 'https://api.cdek.ru/v2')
        self.account = os.environ.get('CDEK_ACCOUNT', '')
        self.secure_password = os.environ.get('CDEK_SECURE_PASSWORD', '')
        self.token = None
        self.token_expires = None
    
    def _get_auth_token(self) -> Optional[str]:
        """Получить токен авторизации"""
        try:
            response = requests.post(
                f'{self.api_url}/oauth/token',
                params={
                    'grant_type': 'client_credentials',
                    'client_id': self.account,
                    'client_secret': self.secure_password
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                expires_in = data.get('expires_in', 3600)
                # Сохраняем время истечения (с запасом 60 секунд)
                from datetime import datetime, timedelta
                self.token_expires = datetime.now() + timedelta(seconds=expires_in - 60)
                return self.token
            else:
                current_app.logger.error(f"CDEK auth error: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            current_app.logger.error(f"CDEK auth exception: {str(e)}")
            return None
    
    def _ensure_token(self) -> bool:
        """Убедиться, что токен валиден"""
        from datetime import datetime
        if not self.token or (self.token_expires and datetime.now() >= self.token_expires):
            return self._get_auth_token() is not None
        return True
    
    def calculate_cost(self, weight: float, dimensions: Dict[str, float], 
                      from_city: str, to_city: str, to_address: Optional[str] = None) -> Optional[float]:
        """Рассчитать стоимость доставки СДЭК"""
        if not self._ensure_token():
            return None
        
        try:
            # Получаем код города отправления
            from_code = self._get_city_code(from_city)
            to_code = self._get_city_code(to_city)
            
            if not from_code or not to_code:
                return None
            
            # Расчет стоимости - используем правильный формат для СДЭК API v2
            payload = {
                "type": 1,  # Доставка до двери
                "currency": 1,  # RUB
                "from_location": {
                    "code": from_code
                },
                "to_location": {
                    "code": to_code
                },
                "packages": [{
                    "weight": int(weight * 1000),  # в граммах (целое число)
                    "length": int(dimensions.get('length', 10)),
                    "width": int(dimensions.get('width', 10)),
                    "height": int(dimensions.get('height', 10))
                }]
            }
            
            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            }
            
            # Используем правильный endpoint для расчета тарифов
            response = requests.post(
                f'{self.api_url}/calculator/tarifflist',
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                # Проверяем разные форматы ответа
                if isinstance(data, list) and len(data) > 0:
                    # Если ответ - массив тарифов
                    tariff = data[0]
                    return float(tariff.get('delivery_sum', 0))
                elif isinstance(data, dict):
                    # Если ответ - объект с тарифами
                    if 'tariff_codes' in data:
                        tariffs = data['tariff_codes']
                        if tariffs and len(tariffs) > 0:
                            tariff = tariffs[0]
                            return float(tariff.get('delivery_sum', 0))
                    elif 'total_sum' in data:
                        return float(data.get('total_sum', 0))
            
            current_app.logger.error(f"CDEK calculation error: {response.status_code} - {response.text}")
            return None
            
        except Exception as e:
            current_app.logger.error(f"CDEK calculation exception: {str(e)}")
            return None
    
    def _get_city_code(self, city_name: str) -> Optional[int]:
        """Получить код города СДЭК по названию"""
        if not self._ensure_token():
            return None
        
        try:
            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            }
            
            # Используем правильный endpoint для поиска городов
            response = requests.get(
                f'{self.api_url}/location/cities',
                params={
                    'city': city_name,
                    'country_codes': ['RU']  # Только города России
                },
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                # Проверяем формат ответа
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get('code')
                elif isinstance(data, dict) and 'cities' in data:
                    cities = data.get('cities', [])
                    if cities and len(cities) > 0:
                        return cities[0].get('code')
            
            current_app.logger.warning(f"CDEK: город '{city_name}' не найден")
            return None
        except Exception as e:
            current_app.logger.error(f"CDEK city code exception: {str(e)}")
            return None


class OzonDeliveryService(DeliveryService):
    """Интеграция с Ozon API"""
    
    def __init__(self):
        self.api_url = os.environ.get('OZON_API_URL', 'https://api-seller.ozon.ru')
        self.client_id = os.environ.get('OZON_CLIENT_ID', '')
        self.api_key = os.environ.get('OZON_API_KEY', '')
    
    def _get_headers(self) -> Dict[str, str]:
        """Получить заголовки для запросов к Ozon API"""
        return {
            'Client-Id': self.client_id,
            'Api-Key': self.api_key,
            'Content-Type': 'application/json'
        }
    
    def calculate_cost(self, weight: float, dimensions: Dict[str, float], 
                      from_city: str, to_city: str, to_address: Optional[str] = None) -> Optional[float]:
        """Рассчитать стоимость доставки Ozon"""
        try:
            # Если есть API ключи, пытаемся использовать реальный API
            if self.client_id and self.api_key:
                return self._calculate_via_api(weight, dimensions, from_city, to_city, to_address)
            
            # Иначе используем расчет на основе параметров
            return self._calculate_estimated_cost(weight, dimensions, from_city, to_city)
            
        except Exception as e:
            current_app.logger.error(f"Ozon calculation exception: {str(e)}")
            # Возвращаем расчетную стоимость при ошибке
            return self._calculate_estimated_cost(weight, dimensions, from_city, to_city)
    
    def _calculate_via_api(self, weight: float, dimensions: Dict[str, float],
                          from_city: str, to_city: str, to_address: Optional[str] = None) -> Optional[float]:
        """Расчет через Ozon FBS API (требует настройки)"""
        try:
            # Ozon FBS API требует сложной интеграции с созданием заказов
            # Для упрощения используем расчетную стоимость
            # В production нужно использовать полный Ozon FBS API
            current_app.logger.info("Ozon API: используем расчетную стоимость (полная интеграция требует настройки FBS)")
            return self._calculate_estimated_cost(weight, dimensions, from_city, to_city)
        except Exception as e:
            current_app.logger.error(f"Ozon API calculation error: {str(e)}")
            return None
    
    def _calculate_estimated_cost(self, weight: float, dimensions: Dict[str, float],
                                  from_city: str, to_city: str) -> float:
        """Расчетная стоимость доставки Ozon на основе параметров"""
        # Базовая стоимость для Ozon
        base_cost = 490.0
        
        # Учитываем вес (до 5 кг - базовая, далее +50₽ за кг)
        if weight > 5:
            base_cost += (weight - 5) * 50
        
        # Учитываем объем (если большой объем, добавляем надбавку)
        volume = dimensions.get('length', 10) * dimensions.get('width', 10) * dimensions.get('height', 10) / 1000000  # в м³
        if volume > 0.1:  # Если объем больше 0.1 м³
            base_cost += volume * 200
        
        # Учитываем расстояние (примерно)
        # Для упрощения используем фиксированную надбавку для дальних городов
        major_cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань']
        if to_city not in major_cities and from_city not in major_cities:
            base_cost += 100  # Надбавка для региональной доставки
        
        return round(base_cost, 2)


class RussianPostDeliveryService(DeliveryService):
    """Интеграция с Почта России API"""
    
    def __init__(self):
        self.api_url = os.environ.get('RUSSIAN_POST_API_URL', 'https://otpravka-api.pochta.ru')
        self.token = os.environ.get('RUSSIAN_POST_TOKEN', '')
        self.key = os.environ.get('RUSSIAN_POST_KEY', '')
    
    def _get_headers(self) -> Dict[str, str]:
        """Получить заголовки для запросов к API Почты России"""
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        if self.token:
            # API Почты России использует формат: Authorization: AccessToken {token}
            headers['Authorization'] = f'AccessToken {self.token}'
        if self.key:
            # X-User-Authorization должен содержать base64 от логина:пароля
            # Если key уже в base64 формате, используем его напрямую
            # Если нет - предполагаем, что это логин:пароль и кодируем
            if ':' in self.key and not self.key.startswith('Basic '):
                # Если это логин:пароль, кодируем в base64
                import base64
                encoded = base64.b64encode(self.key.encode()).decode()
                headers['X-User-Authorization'] = f'Basic {encoded}'
            else:
                # Если уже в формате base64 или с префиксом Basic
                if self.key.startswith('Basic '):
                    headers['X-User-Authorization'] = self.key
                else:
                    headers['X-User-Authorization'] = f'Basic {self.key}'
        return headers
    
    def calculate_cost(self, weight: float, dimensions: Dict[str, float], 
                      from_city: str, to_city: str, to_address: Optional[str] = None) -> Optional[float]:
        """Рассчитать стоимость доставки Почта России"""
        try:
            # Если есть токен, пытаемся использовать реальный API
            if self.token:
                return self._calculate_via_api(weight, dimensions, from_city, to_city, to_address)
            
            # Иначе используем расчет на основе параметров
            return self._calculate_estimated_cost(weight, dimensions, from_city, to_city)
            
        except Exception as e:
            # Используем try/except для current_app, так как может вызываться вне контекста Flask
            try:
                current_app.logger.error(f"Russian Post calculation exception: {str(e)}")
            except:
                import logging
                logging.error(f"Russian Post calculation exception: {str(e)}")
            # Возвращаем расчетную стоимость при ошибке
            return self._calculate_estimated_cost(weight, dimensions, from_city, to_city)
    
    def _calculate_via_api(self, weight: float, dimensions: Dict[str, float],
                          from_city: str, to_city: str, to_address: Optional[str] = None) -> Optional[float]:
        """Расчет через API Почты России"""
        try:
            # Получаем почтовые индексы
            from_index = self._get_postal_code(from_city)
            to_index = self._get_postal_code(to_city) if to_city else None
            
            if not from_index or not to_index:
                # Если не удалось получить индексы, используем расчетную стоимость
                try:
                    current_app.logger.warning(f"Не удалось получить почтовые индексы для {from_city} или {to_city}")
                except:
                    import logging
                    logging.warning(f"Не удалось получить почтовые индексы для {from_city} или {to_city}")
                return self._calculate_estimated_cost(weight, dimensions, from_city, to_city)
            
            # API Почты России для расчета стоимости
            # Используем endpoint /1.0/tariff
            payload = {
                "object": 27030,  # Посылка
                "weight": int(weight * 1000),  # в граммах
                "from": from_index,
                "to": to_index
            }
            
            headers = self._get_headers()
            response = requests.post(
                f'{self.api_url}/1.0/tariff',
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                # API может вернуть стоимость в разных форматах
                if isinstance(data, dict):
                    if 'total' in data:
                        # Если стоимость в копейках, конвертируем в рубли
                        total = data['total']
                        if isinstance(total, (int, float)) and total > 1000:
                            return float(total) / 100  # Конвертируем копейки в рубли
                        return float(total)
                    elif 'totalRate' in data:
                        return float(data['totalRate'])
                    elif 'rate' in data:
                        return float(data['rate'])
            
            # Если API не вернул стоимость, используем расчетную
            try:
                current_app.logger.warning(f"Почта России API вернул статус {response.status_code}: {response.text}")
            except:
                import logging
                logging.warning(f"Почта России API вернул статус {response.status_code}: {response.text}")
            return self._calculate_estimated_cost(weight, dimensions, from_city, to_city)
            
        except requests.exceptions.RequestException as e:
            try:
                current_app.logger.error(f"Russian Post API request error: {str(e)}")
            except:
                import logging
                logging.error(f"Russian Post API request error: {str(e)}")
            return self._calculate_estimated_cost(weight, dimensions, from_city, to_city)
        except Exception as e:
            try:
                current_app.logger.error(f"Russian Post API calculation error: {str(e)}")
            except:
                import logging
                logging.error(f"Russian Post API calculation error: {str(e)}")
            return self._calculate_estimated_cost(weight, dimensions, from_city, to_city)
    
    def _get_postal_code(self, city: str) -> Optional[str]:
        """Получить почтовый индекс города (упрощенная версия)"""
        # В реальном проекте нужно использовать API для поиска индекса
        # Пока используем известные индексы крупных городов
        city_codes = {
            'Москва': '101000',
            'Санкт-Петербург': '190000',
            'Нальчик': '360000',
            'Казань': '420000',
            'Новосибирск': '630000',
            'Екатеринбург': '620000'
        }
        
        for city_name, code in city_codes.items():
            if city_name.lower() in city.lower() or city.lower() in city_name.lower():
                return code
        
        return None
    
    def _calculate_estimated_cost(self, weight: float, dimensions: Dict[str, float],
                                  from_city: str, to_city: str) -> float:
        """Расчетная стоимость доставки Почта России на основе параметров"""
        # Базовая стоимость для Почты России (посылка до 2 кг)
        base_cost = 190.0
        
        # Учитываем вес (до 2 кг - базовая, далее +30₽ за кг)
        if weight > 2:
            base_cost += (weight - 2) * 30
        
        # Учитываем объем (если большой объем, добавляем надбавку)
        volume = dimensions.get('length', 10) * dimensions.get('width', 10) * dimensions.get('height', 10) / 1000000  # в м³
        if volume > 0.05:  # Если объем больше 0.05 м³
            base_cost += volume * 100
        
        # Учитываем расстояние (примерно)
        # Для упрощения используем фиксированную надбавку для дальних городов
        major_cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань']
        if to_city not in major_cities and from_city not in major_cities:
            base_cost += 50  # Надбавка для региональной доставки
        
        return round(base_cost, 2)


def get_delivery_service(provider: str) -> Optional[DeliveryService]:
    """Получить сервис доставки по провайдеру"""
    providers = {
        'cdek': CDEKDeliveryService,
        'ozon': OzonDeliveryService,
        'russian_post': RussianPostDeliveryService
    }
    
    service_class = providers.get(provider)
    if service_class:
        return service_class()
    return None


def calculate_delivery_cost(provider: str, weight: float, dimensions: Dict[str, float],
                           from_city: str, to_city: str, to_address: Optional[str] = None) -> Optional[float]:
    """
    Универсальная функция для расчета стоимости доставки
    
    provider: 'pickup', 'cdek', 'ozon', 'russian_post'
    """
    if provider == 'pickup':
        return 0.0
    
    service = get_delivery_service(provider)
    if not service:
        # Возвращаем фиксированные значения по умолчанию
        default_costs = {
            'cdek': 390.0,
            'ozon': 490.0,
            'russian_post': 190.0
        }
        return default_costs.get(provider, 0.0)
    
    cost = service.calculate_cost(weight, dimensions, from_city, to_city, to_address)
    
    # Если расчет не удался, возвращаем значение по умолчанию
    if cost is None:
        default_costs = {
            'cdek': 390.0,
            'ozon': 490.0,
            'russian_post': 190.0
        }
        return default_costs.get(provider, 0.0)
    
    return cost

