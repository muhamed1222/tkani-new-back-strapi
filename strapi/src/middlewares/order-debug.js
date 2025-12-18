module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Только для запросов к order API
    if (ctx.request.url.includes('/api/orders') || ctx.request.url.includes('/content-manager/collection-types/api::order.order')) {
      console.log('🔍 ORDER DEBUG MIDDLEWARE');
      console.log('URL:', ctx.request.url);
      console.log('Method:', ctx.request.method);
      console.log('Body:', JSON.stringify(ctx.request.body, null, 2));
      console.log('Query:', ctx.query);
      console.log('---');
    }
    await next();
  };
};