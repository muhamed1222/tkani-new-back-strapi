'use strict';

const axios = require('axios');

module.exports = ({ strapi }) => ({
  getHeaders() {
    const pluginConfig = strapi.config.get('plugin.delivery');
    const { token, key } = pluginConfig?.providers?.russianPost || {};

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `AccessToken ${token}`;
    }

    if (key) {
      if (key.includes(':') && !key.startsWith('Basic ')) {
        const encoded = Buffer.from(key).toString('base64');
        headers['X-User-Authorization'] = `Basic ${encoded}`;
      } else if (key.startsWith('Basic ')) {
        headers['X-User-Authorization'] = key;
      } else {
        headers['X-User-Authorization'] = `Basic ${key}`;
      }
    }

    return headers;
  },

  getPostalCode(cityName) {
    const cityCodes = {
      'Москва': '101000',
      'Санкт-Петербург': '190000',
      'Нальчик': '360000',
      'Казань': '420000',
      'Новосибирск': '630000',
      'Екатеринбург': '620000',
    };

    for (const [city, code] of Object.entries(cityCodes)) {
      if (city.toLowerCase().includes(cityName.toLowerCase()) || 
          cityName.toLowerCase().includes(city.toLowerCase())) {
        return code;
      }
    }

    return null;
  },

  async calculateCost(weight, dimensions, fromCity, toCity) {
    try {
      const pluginConfig = strapi.config.get('plugin.delivery');
      const { token, apiUrl } = pluginConfig?.providers?.russianPost || {};

      if (!token) {
        strapi.log.warn('Russian Post: Token not configured, using estimated cost');
        return this.calculateEstimatedCost(weight, dimensions, fromCity, toCity);
      }

      const fromIndex = this.getPostalCode(fromCity);
      const toIndex = this.getPostalCode(toCity);

      if (!fromIndex || !toIndex) {
        strapi.log.warn(`Russian Post: Postal codes not found for ${fromCity} or ${toCity}`);
        return this.calculateEstimatedCost(weight, dimensions, fromCity, toCity);
      }

      const payload = {
        object: 27030,
        weight: Math.round(weight * 1000),
        from: fromIndex,
        to: toIndex,
      };

      const response = await axios.post(`${apiUrl}/1.0/tariff`, payload, {
        headers: this.getHeaders(),
        timeout: 10000,
      });

      if (response.status === 200 && response.data) {
        const data = response.data;

        if (data.total) {
          const total = parseFloat(data.total);
          if (total > 1000) {
            return total / 100;
          }
          return total;
        }

        if (data.totalRate) {
          return parseFloat(data.totalRate);
        }

        if (data.rate) {
          return parseFloat(data.rate);
        }
      }

      strapi.log.warn(`Russian Post: API returned status ${response.status}, using estimated cost`);
      return this.calculateEstimatedCost(weight, dimensions, fromCity, toCity);
    } catch (error) {
      strapi.log.error('Russian Post calculateCost error:', error.message);
      return this.calculateEstimatedCost(weight, dimensions, fromCity, toCity);
    }
  },

  calculateEstimatedCost(weight, dimensions, fromCity, toCity) {
    let baseCost = 190.0;

    if (weight > 2) {
      baseCost += (weight - 2) * 30;
    }

    const volume = (dimensions.length || 10) * (dimensions.width || 10) * (dimensions.height || 10) / 1000000;
    if (volume > 0.05) {
      baseCost += volume * 100;
    }

    const majorCities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань'];
    const isFromMajor = majorCities.some(city => fromCity.includes(city));
    const isToMajor = majorCities.some(city => toCity.includes(city));

    if (!isFromMajor && !isToMajor) {
      baseCost += 50;
    }

    return Math.round(baseCost * 100) / 100;
  },
});
