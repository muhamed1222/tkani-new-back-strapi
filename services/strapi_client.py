"""
Клиент для работы с Strapi API
"""
import os
import requests
from typing import Optional, Dict, Any, List
from flask import current_app

class StrapiClient:
    """Клиент для взаимодействия с Strapi CMS"""
    
    def __init__(self):
        self.base_url = os.environ.get('STRAPI_URL', 'http://localhost:1337')
        self.api_token = os.environ.get('STRAPI_API_TOKEN', '')
        self.timeout = 30
    
    def _get_headers(self) -> Dict[str, str]:
        """Получить заголовки для запросов"""
        headers = {
            'Content-Type': 'application/json'
        }
        if self.api_token:
            headers['Authorization'] = f'Bearer {self.api_token}'
        return headers
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Выполнить запрос к Strapi API"""
        url = f"{self.base_url}/api{endpoint}"
        headers = self._get_headers()
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                timeout=self.timeout,
                **kwargs
            )
            
            if response.status_code >= 400:
                current_app.logger.error(
                    f"Strapi API error: {response.status_code} - {response.text}"
                )
                return None
            
            return response.json() if response.content else None
            
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"Strapi API request failed: {str(e)}")
            return None
    
    # Products
    def get_products(self, filters: Optional[Dict] = None, populate: bool = True) -> Optional[List[Dict]]:
        """Получить список товаров"""
        endpoint = '/products'
        params = {}
        if populate:
            params['populate'] = '*'
        if filters:
            params.update(filters)
        
        result = self._make_request('GET', endpoint, params=params)
        return result.get('data', []) if result else None
    
    def get_product(self, product_id: int, populate: bool = True) -> Optional[Dict]:
        """Получить товар по ID"""
        endpoint = f'/products/{product_id}'
        params = {'populate': '*'} if populate else {}
        
        result = self._make_request('GET', endpoint, params=params)
        return result.get('data') if result else None
    
    def create_product(self, data: Dict[str, Any], files: Optional[Dict] = None) -> Optional[Dict]:
        """Создать товар"""
        endpoint = '/products'
        
        if files:
            # Используем multipart/form-data для загрузки файлов
            headers = {}
            if self.api_token:
                headers['Authorization'] = f'Bearer {self.api_token}'
            
            # Подготовка данных для FormData
            form_data = {}
            for key, value in data.items():
                if isinstance(value, (dict, list)):
                    form_data[f'data[{key}]'] = str(value) if isinstance(value, dict) else value
                else:
                    form_data[f'data[{key}]'] = value
            
            # Добавляем файлы
            files_data = {}
            for key, file in files.items():
                files_data[f'files.{key}'] = file
            
            url = f"{self.base_url}/api{endpoint}"
            try:
                response = requests.post(
                    url,
                    headers=headers,
                    data=form_data,
                    files=files_data,
                    timeout=self.timeout
                )
                
                if response.status_code >= 400:
                    current_app.logger.error(
                        f"Strapi API error: {response.status_code} - {response.text}"
                    )
                    return None
                
                return response.json().get('data') if response.content else None
            except requests.exceptions.RequestException as e:
                current_app.logger.error(f"Strapi API request failed: {str(e)}")
                return None
        else:
            payload = {'data': data}
            result = self._make_request('POST', endpoint, json=payload)
            return result.get('data') if result else None
    
    def update_product(self, product_id: int, data: Dict[str, Any], files: Optional[Dict] = None) -> Optional[Dict]:
        """Обновить товар"""
        endpoint = f'/products/{product_id}'
        
        if files:
            # Используем multipart/form-data для загрузки файлов
            headers = {}
            if self.api_token:
                headers['Authorization'] = f'Bearer {self.api_token}'
            
            form_data = {}
            for key, value in data.items():
                if isinstance(value, (dict, list)):
                    form_data[f'data[{key}]'] = str(value) if isinstance(value, dict) else value
                else:
                    form_data[f'data[{key}]'] = value
            
            files_data = {}
            for key, file in files.items():
                files_data[f'files.{key}'] = file
            
            url = f"{self.base_url}/api{endpoint}"
            try:
                response = requests.put(
                    url,
                    headers=headers,
                    data=form_data,
                    files=files_data,
                    timeout=self.timeout
                )
                
                if response.status_code >= 400:
                    current_app.logger.error(f"Strapi API error: {response.status_code}")
                    return None
                
                return response.json().get('data') if response.content else None
            except requests.exceptions.RequestException as e:
                current_app.logger.error(f"Strapi API request failed: {str(e)}")
                return None
        else:
            payload = {'data': data}
            result = self._make_request('PUT', endpoint, json=payload)
            return result.get('data') if result else None
    
    def delete_product(self, product_id: int) -> bool:
        """Удалить товар"""
        endpoint = f'/products/{product_id}'
        result = self._make_request('DELETE', endpoint)
        return result is not None
    
    # Categories
    def get_categories(self) -> Optional[List[Dict]]:
        """Получить список категорий"""
        endpoint = '/categories'
        result = self._make_request('GET', endpoint)
        return result.get('data', []) if result else None
    
    # Brands
    def get_brands(self) -> Optional[List[Dict]]:
        """Получить список брендов"""
        endpoint = '/brands'
        result = self._make_request('GET', endpoint)
        return result.get('data', []) if result else None
    
    # Works
    def get_works(self, filters: Optional[Dict] = None) -> Optional[List[Dict]]:
        """Получить список работ"""
        endpoint = '/works'
        params = filters or {}
        result = self._make_request('GET', endpoint, params=params)
        return result.get('data', []) if result else None

