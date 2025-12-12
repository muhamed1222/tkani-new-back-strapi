'use strict';

module.exports = ({ strapi }) => ({
  async calculate(ctx) {
    try {
      const { provider, weight, dimensions, fromCity, toCity } = ctx.request.body;

      if (!provider) {
        return ctx.badRequest('Provider is required (cdek, russian_post, or pickup)');
      }

      if (provider === 'pickup') {
        return ctx.send({
          success: true,
          provider: 'pickup',
          cost: 0,
        });
      }

      if (!weight || !fromCity || !toCity) {
        return ctx.badRequest('Weight, fromCity, and toCity are required');
      }

      const dim = dimensions || { length: 10, width: 10, height: 10 };

      let cost = 0;

      if (provider === 'cdek') {
        const cdekService = strapi.plugin('delivery').service('cdek');
        cost = await cdekService.calculateCost(weight, dim, fromCity, toCity);
      } else if (provider === 'russian_post') {
        const russianPostService = strapi.plugin('delivery').service('russian-post');
        cost = await russianPostService.calculateCost(weight, dim, fromCity, toCity);
      } else {
        return ctx.badRequest('Invalid provider. Use: cdek, russian_post, or pickup');
      }

      return ctx.send({
        success: true,
        provider,
        cost,
        currency: 'RUB',
      });
    } catch (error) {
      strapi.log.error('Delivery calculate error:', error);
      return ctx.badRequest('Error calculating delivery cost: ' + error.message);
    }
  },

  async getPoints(ctx) {
    try {
      const { city } = ctx.query;

      if (!city) {
        return ctx.badRequest('City parameter is required');
      }

      const cdekService = strapi.plugin('delivery').service('cdek');
      const points = await cdekService.getDeliveryPoints(city);

      return ctx.send({
        success: true,
        points,
      });
    } catch (error) {
      strapi.log.error('Get delivery points error:', error);
      return ctx.badRequest('Error getting delivery points: ' + error.message);
    }
  },
});
