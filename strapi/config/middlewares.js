module.exports = ({ env }) => [
  'strapi::errors',
  {
    name: 'global::sentry',
    config: {
      dsn: env('SENTRY_DSN'),
      environment: env('NODE_ENV', 'development'),
    },
    resolve: './src/middlewares/sentry',
  },
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174', 
        'http://localhost:5175',
        'http://localhost:5001',
        'https://centertkani.ru',
        'https://www.centertkani.ru',
        'https://api.centertkani.ru',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
