#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:1337/api"

echo -e "${YELLOW}=== Тестирование API доставки ===${NC}\n"

# Тест 1: Самовывоз
echo -e "${YELLOW}Тест 1: Самовывоз${NC}"
curl -s -X POST "$API_URL/delivery/calculate" \
  -H "Content-Type: application/json" \
  -d '{"provider":"pickup"}' | jq '.'
echo -e "\n"

# Тест 2: СДЭК
echo -e "${YELLOW}Тест 2: СДЭК (Москва -> Санкт-Петербург)${NC}"
curl -s -X POST "$API_URL/delivery/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "cdek",
    "weight": 2,
    "fromCity": "Москва",
    "toCity": "Санкт-Петербург",
    "dimensions": {"length": 30, "width": 20, "height": 10}
  }' | jq '.'
echo -e "\n"

# Тест 3: Почта России
echo -e "${YELLOW}Тест 3: Почта России (Москва -> Нальчик)${NC}"
curl -s -X POST "$API_URL/delivery/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "russian_post",
    "weight": 1.5,
    "fromCity": "Москва",
    "toCity": "Нальчик",
    "dimensions": {"length": 20, "width": 15, "height": 10}
  }' | jq '.'
echo -e "\n"

# Тест 4: Пункты выдачи СДЭК
echo -e "${YELLOW}Тест 4: Пункты выдачи СДЭК в Москве${NC}"
curl -s "$API_URL/delivery/cdek/points?city=Москва" | jq '.points | length'
echo -e "\n"

echo -e "${GREEN}=== Тестирование завершено ===${NC}"
echo -e "${YELLOW}Примечание: Для работы с реальными API СДЭК и Почта России требуются валидные credentials${NC}"
