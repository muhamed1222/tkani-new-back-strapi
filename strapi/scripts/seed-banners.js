#!/usr/bin/env node
'use strict';

/**
 * Скрипт для создания тестовых баннеров в Strapi
 * Использование: node scripts/seed-banners.js
 */

const { resolve } = require('path');

async function bootstrapStrapi() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({
    appDir: resolve(__dirname, '..'),
  }).load();
  return app;
}

async function seedBanners(strapi) {
  console.log('🎨 Создание баннеров для слайдеров...\n');

  // Баннеры для одежды (3 шт)
  const clothingBanners = [
    {
      image: null, // Будет загружено через админку или нужно указать путь к файлу
      title: JSON.stringify(["ТКАНИ ДЛЯ", "ОДЕЖДЫ"]),
      textPosition: 'left',
      section: 'clothing',
      order: 0
    },
    {
      image: null,
      title: JSON.stringify(["КАЧЕСТВЕННЫЕ", "МАТЕРИАЛЫ"]),
      textPosition: 'left',
      section: 'clothing',
      order: 1
    },
    {
      image: null,
      title: JSON.stringify(["ШИРОКИЙ", "ВЫБОР"]),
      textPosition: 'left',
      section: 'clothing',
      order: 2
    }
  ];

  // Баннеры для дома (4 шт)
  const homeBanners = [
    {
      image: null,
      title: JSON.stringify(["ТКАНИ ДЛЯ", "ДОМА"]),
      textPosition: 'right',
      section: 'home',
      order: 0
    },
    {
      image: null,
      title: JSON.stringify(["УЮТ И", "КОМФОРТ"]),
      textPosition: 'right',
      section: 'home',
      order: 1
    },
    {
      image: null,
      title: JSON.stringify(["ДОМАШНИЙ", "ТЕКСТИЛЬ"]),
      textPosition: 'right',
      section: 'home',
      order: 2
    },
    {
      image: null,
      title: JSON.stringify(["ПРЕМИУМ", "КАЧЕСТВО"]),
      textPosition: 'right',
      section: 'home',
      order: 3
    }
  ];

  let created = 0;
  let skipped = 0;

  // Проверяем существующие баннеры
  const existingBanners = await strapi.entityService.findMany('api::banner.banner', {
    limit: 1000
  });

  const existingBySection = {
    clothing: existingBanners.filter(b => b.section === 'clothing'),
    home: existingBanners.filter(b => b.section === 'home')
  };

  console.log(`Найдено существующих баннеров: ${existingBanners.length}`);
  console.log(`  - Для одежды: ${existingBySection.clothing.length}`);
  console.log(`  - Для дома: ${existingBySection.home.length}\n`);

  // Создаем баннеры для одежды
  console.log('📦 Создание баннеров для одежды...');
  for (const bannerData of clothingBanners) {
    // Проверяем, существует ли уже баннер с таким order в этом разделе
    const exists = existingBySection.clothing.some(b => b.order === bannerData.order);
    
    if (exists) {
      console.log(`⚠ Пропущен баннер для одежды (order: ${bannerData.order}) - уже существует`);
      skipped++;
      continue;
    }

    try {
      await strapi.entityService.create('api::banner.banner', {
        data: {
          ...bannerData,
          publishedAt: new Date(),
        },
      });
      created++;
      console.log(`✓ Создан баннер для одежды: order ${bannerData.order}, title: ${bannerData.title}`);
    } catch (error) {
      console.error(`✗ Ошибка создания баннера для одежды (order: ${bannerData.order}):`, error.message);
    }
  }

  // Создаем баннеры для дома
  console.log('\n📦 Создание баннеров для дома...');
  for (const bannerData of homeBanners) {
    // Проверяем, существует ли уже баннер с таким order в этом разделе
    const exists = existingBySection.home.some(b => b.order === bannerData.order);
    
    if (exists) {
      console.log(`⚠ Пропущен баннер для дома (order: ${bannerData.order}) - уже существует`);
      skipped++;
      continue;
    }

    try {
      await strapi.entityService.create('api::banner.banner', {
        data: {
          ...bannerData,
          publishedAt: new Date(),
        },
      });
      created++;
      console.log(`✓ Создан баннер для дома: order ${bannerData.order}, title: ${bannerData.title}`);
    } catch (error) {
      console.error(`✗ Ошибка создания баннера для дома (order: ${bannerData.order}):`, error.message);
    }
  }

  console.log(`\n=== Результат ===`);
  console.log(`Создано баннеров: ${created}`);
  console.log(`Пропущено баннеров: ${skipped}`);
  console.log(`\n⚠ ВАЖНО: Изображения нужно добавить вручную через Strapi Admin панель!`);
  console.log(`   Перейдите в Content Manager → Banner и загрузите изображения для каждого баннера.`);
}

async function main() {
  let app;
  try {
    app = await bootstrapStrapi();
    await seedBanners(app);
    console.log('\n✅ Готово!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  } finally {
    if (app) {
      await app.destroy();
    }
  }
}

main();
