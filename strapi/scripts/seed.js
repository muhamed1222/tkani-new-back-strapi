#!/usr/bin/env node
'use strict';

const { resolve } = require('path');

async function bootstrapStrapi() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({
    appDir: resolve(__dirname, '..'),
  }).load();
  return app;
}

async function upsertByUnique(strapi, uid, where, data) {
  const existing = await strapi.entityService.findMany(uid, { filters: where, limit: 1 });
  if (existing && existing.length) {
    const id = existing[0].id;
    return strapi.entityService.update(uid, id, { data });
  }
  return strapi.entityService.create(uid, { data });
}

async function seedCategories(strapi) {
  const categories = [
    { name: 'Дак' },
    { name: 'Вафельное полотно' },
    { name: 'Лен постельный' },
    { name: 'Сатин Туриция' },
    { name: 'Махра' },
    { name: 'Муслин' },
    { name: 'Тенсель' },
    { name: 'Поплин Туриция' },
    { name: 'Пике косичка' },
    { name: 'Фланель' },
    { name: 'Сатин люкс' },
    { name: 'Штапель' },
    { name: 'Купра' },
    { name: 'Шелк' },
    { name: 'Джинса' },
    { name: 'Хлопок' },
    { name: 'Трикотаж' },
    { name: 'Лен' },
  ];
  for (const c of categories) {
    await upsertByUnique(strapi, 'api::category.category', { name: c.name }, { ...c, publishedAt: new Date() });
  }
  console.log(`Seeded categories: ${categories.length}`);
}

async function seedBrands(strapi) {
  const brands = [
    { name: 'Default', slug: 'default' },
    { name: 'Premium', slug: 'premium' },
  ];
  for (const b of brands) {
    await upsertByUnique(strapi, 'api::brand.brand', { slug: b.slug }, { ...b, publishedAt: new Date() });
  }
  console.log(`Seeded brands: ${brands.length}`);
}

async function seedProducts(strapi) {
  // Get any category/brand
  const [category] = await strapi.entityService.findMany('api::category.category', { limit: 1 });
  const [brand] = await strapi.entityService.findMany('api::brand.brand', { limit: 1 });
  const products = [
    {
      title: 'Ткань хлопок «Классик»',
      description: 'Мягкая хлопковая ткань для постельного белья.',
      price: 800,
      stock: 120,
      specifications: { width: '150см', density: '120гр' },
      rating: 4.5,
    },
    {
      title: 'Муслин «Комфорт»',
      description: 'Двухслойный муслин, приятный к телу.',
      price: 950,
      stock: 60,
      specifications: { width: '140см', layers: 2 },
      rating: 4.7,
    },
  ];
  for (const p of products) {
    await upsertByUnique(
      strapi,
      'api::product.product',
      { title: p.title },
      {
        ...p,
        category: category?.id || null,
        brand: brand?.id || null,
        publishedAt: new Date(),
      }
    );
  }
  console.log(`Seeded products: ${products.length}`);
}

(async () => {
  const app = await bootstrapStrapi();
  try {
    await seedCategories(app);
    await seedBrands(app);
    await seedProducts(app);
    console.log('Seeding completed ✔');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await app.destroy();
  }
})();


