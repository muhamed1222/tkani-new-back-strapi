'use strict';

const axios = require('axios');

module.exports = ({ strapi }) => ({
  token: null,
  tokenExpires: null,

  async getAuthToken() {
    try {
      const pluginConfig = strapi.config.get('plugin.delivery');
      const { account, securePassword, apiUrl } = pluginConfig?.providers?.cdek || {};

      if (!account || !securePassword) {
        throw new Error('CDEK credentials not configured');
      }

      const response = await axios.post(`${apiUrl}/oauth/token`, null, {
        params: {
          grant_type: 'client_credentials',
          client_id: account,
          client_secret: securePassword,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data) {
        this.token = response.data.access_token;
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpires = new Date(Date.now() + (expiresIn - 60) * 1000);
        return this.token;
      }

      throw new Error(`CDEK auth failed: ${response.status}`);
    } catch (error) {
      strapi.log.error('CDEK auth error:', error.message);
      throw error;
    }
  },

  async ensureToken() {
    if (!this.token || (this.tokenExpires && new Date() >= this.tokenExpires)) {
      await this.getAuthToken();
    }
  },

  async getCityCode(cityName) {
    try {
      await this.ensureToken();
      const pluginConfig = strapi.config.get('plugin.delivery');
      const { apiUrl } = pluginConfig?.providers?.cdek || {};

      const response = await axios.get(`${apiUrl}/location/cities`, {
        params: {
          city: cityName,
          country_codes: 'RU',
        },
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data[0].code;
        }
        if (data.cities && Array.isArray(data.cities) && data.cities.length > 0) {
          return data.cities[0].code;
        }
      }

      strapi.log.warn(`CDEK: City '${cityName}' not found`);
      return null;
    } catch (error) {
      strapi.log.error('CDEK getCityCode error:', error.message);
      return null;
    }
  },

  async calculateCost(weight, dimensions, fromCity, toCity) {
    try {
      await this.ensureToken();
      const pluginConfig = strapi.config.get('plugin.delivery');
      const { apiUrl } = pluginConfig?.providers?.cdek || {};

      const fromCode = await this.getCityCode(fromCity);
      const toCode = await this.getCityCode(toCity);

      if (!fromCode || !toCode) {
        strapi.log.warn('CDEK: Could not get city codes, using estimated cost');
        return this.calculateEstimatedCost(weight, dimensions);
      }

      const payload = {
        type: 1,
        currency: 1,
        from_location: {
          code: fromCode,
        },
        to_location: {
          code: toCode,
        },
        packages: [
          {
            weight: Math.round(weight * 1000),
            length: Math.round(dimensions.length || 10),
            width: Math.round(dimensions.width || 10),
            height: Math.round(dimensions.height || 10),
          },
        ],
      };

      const response = await axios.post(`${apiUrl}/calculator/tarifflist`, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        
        if (Array.isArray(data) && data.length > 0) {
          return parseFloat(data[0].delivery_sum || 0);
        }
        
        if (data.tariff_codes && Array.isArray(data.tariff_codes) && data.tariff_codes.length > 0) {
          return parseFloat(data.tariff_codes[0].delivery_sum || 0);
        }
        
        if (data.total_sum) {
          return parseFloat(data.total_sum);
        }
      }

      strapi.log.warn('CDEK: API response invalid, using estimated cost');
      return this.calculateEstimatedCost(weight, dimensions);
    } catch (error) {
      strapi.log.error('CDEK calculateCost error:', error.message);
      return this.calculateEstimatedCost(weight, dimensions);
    }
  },

  calculateEstimatedCost(weight, dimensions) {
    let baseCost = 300.0;
    
    if (weight > 5) {
      baseCost += (weight - 5) * 40;
    }
    
    const volume = (dimensions.length || 10) * (dimensions.width || 10) * (dimensions.height || 10) / 1000000;
    if (volume > 0.1) {
      baseCost += volume * 150;
    }
    
    return Math.round(baseCost * 100) / 100;
  },

  async getDeliveryPoints(cityName) {
    try {
      await this.ensureToken();
      const pluginConfig = strapi.config.get('plugin.delivery');
      const { apiUrl } = pluginConfig?.providers?.cdek || {};

      const cityCode = await this.getCityCode(cityName);
      if (!cityCode) {
        return [];
      }

      const response = await axios.get(`${apiUrl}/deliverypoints`, {
        params: {
          city_code: cityCode,
          type: 'PVZ',
        },
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }

      return [];
    } catch (error) {
      strapi.log.error('CDEK getDeliveryPoints error:', error.message);
      return [];
    }
  },
});
