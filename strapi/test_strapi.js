#!/usr/bin/env node

console.log('Начало теста Strapi...');
console.log('Node version:', process.version);
console.log('CWD:', process.cwd());

try {
  console.log('Загрузка Strapi...');
  const strapi = require('@strapi/strapi');
  console.log('Strapi загружен успешно');
  
  console.log('Создание экземпляра Strapi...');
  const app = strapi({
    distDir: './dist',
    autoReload: true,
    serveAdminPanel: true,
  });
  
  console.log('Экземпляр создан');
  
  app.load().then(() => {
    console.log('Strapi загружен');
    return app.start();
  }).then(() => {
    console.log('Strapi запущен');
  }).catch((err) => {
    console.error('Ошибка при запуске:', err);
    process.exit(1);
  });
  
} catch (err) {
  console.error('Ошибка:', err);
  process.exit(1);
}

