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
  // Категории для одежды
  const clothingCategories = [
    { name: 'Дак', slug: 'dak', section: 'clothing', order: 1 },
    { name: 'Вафельное полотно', slug: 'vafelnoe-polotno', section: 'clothing', order: 2 },
    { name: 'Лен постельный', slug: 'len-postelnyj', section: 'clothing', order: 3 },
    { name: 'Сатин Туриция', slug: 'satin-turiciya', section: 'clothing', order: 4 },
    { name: 'Махра', slug: 'mahra', section: 'clothing', order: 5 },
    { name: 'Муслин', slug: 'muslin', section: 'clothing', order: 6 },
    { name: 'Тенсель', slug: 'tensel', section: 'clothing', order: 7 },
    { name: 'Поплин Туриция', slug: 'poplin-turiciya', section: 'clothing', order: 8 },
    { name: 'Пике косичка', slug: 'pike-kosichka', section: 'clothing', order: 9 },
    { name: 'Фланель', slug: 'flanel', section: 'clothing', order: 10 },
    { name: 'Сатин люкс', slug: 'satin-lyuks', section: 'clothing', order: 11 },
  ];

  // Категории для дома
  const homeCategories = [
    { name: 'Муслин', slug: 'muslin', section: 'home', order: 1 },
    { name: 'Штапель', slug: 'shtapel', section: 'home', order: 2 },
    { name: 'Купра', slug: 'kupra', section: 'home', order: 3 },
    { name: 'Шелк', slug: 'shelk', section: 'home', order: 4 },
    { name: 'Джинса', slug: 'dzhinsa', section: 'home', order: 5 },
    { name: 'Тенсель', slug: 'tensel', section: 'home', order: 6 },
    { name: 'Хлопок', slug: 'hlopok', section: 'home', order: 7 },
    { name: 'Трикотаж', slug: 'trikotazh', section: 'home', order: 8 },
    { name: 'Лен', slug: 'len', section: 'home', order: 9 },
  ];

  const allCategories = [...clothingCategories, ...homeCategories];

  for (const c of allCategories) {
    await upsertByUnique(
      strapi, 
      'api::category.category', 
      { slug: c.slug }, 
      { 
        ...c, 
        publishedAt: new Date() 
      }
    );
  }
  
  console.log(`Seeded categories: ${allCategories.length} (${clothingCategories.length} clothing, ${homeCategories.length} home)`);
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


