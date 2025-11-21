const path = require('path');

module.exports = ({ env }) => {
  // Используем SQLite для разработки (можно заменить на PostgreSQL для production)
  const client = env('DATABASE_CLIENT', 'sqlite');
  
  if (client === 'sqlite') {
    return {
      connection: {
        client: 'sqlite',
        connection: {
          filename: env('DATABASE_FILENAME', path.join(__dirname, '..', '.tmp', 'data.db')),
        },
        useNullAsDefault: true,
      },
    };
  }
  
  // PostgreSQL конфигурация (для production)
  return {
    connection: {
      client: 'postgres',
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
        },
      },
      debug: false,
    },
  };
};
