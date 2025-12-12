#!/usr/bin/env node
'use strict';

/**
 * Скрипт для обновления существующих категорий с полями section и order
 * Использование: node scripts/update-categories.js
 */

const { resolve } = require('path');

async function bootstrapStrapi() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({
    appDir: resolve(__dirname, '..'),
  }).load();
  return app;
}

async function updateCategories(strapi) {
  // Маппинг категорий с их разделами и порядком
  const categoryMapping = {
    // Для одежды
    'dak': { section: 'clothing', order: 1 },
    'vafelnoe-polotno': { section: 'clothing', order: 2 },
    'len-postelnyj': { section: 'clothing', order: 3 },
    'satin-turiciya': { section: 'clothing', order: 4 },
    'mahra': { section: 'clothing', order: 5 },
    'poplin-turiciya': { section: 'clothing', order: 6 },
    'pike-kosichka': { section: 'clothing', order: 7 },
    'flanel': { section: 'clothing', order: 8 },
    'satin-lyuks': { section: 'clothing', order: 9 },
    
    // Для дома
    'muslin': { section: 'home', order: 1 },
    'shtapel': { section: 'home', order: 2 },
    'kupra': { section: 'home', order: 3 },
    'shelk': { section: 'home', order: 4 },
    'dzhinsa': { section: 'home', order: 5 },
    'tensel': { section: 'home', order: 6 },
    'hlopok': { section: 'home', order: 7 },
    'trikotazh': { section: 'home', order: 8 },
    'len': { section: 'home', order: 9 },
  };

  // Получаем все категории
  const categories = await strapi.entityService.findMany('api::category.category', {
    limit: 1000,
  });

  console.log(`Найдено категорий: ${categories.length}`);

  let updated = 0;
  let created = 0;

  // Обновляем существующие категории
  for (const category of categories) {
    const slug = category.slug;
    const mapping = categoryMapping[slug];

    if (mapping) {
      await strapi.entityService.update('api::category.category', category.id, {
        data: {
          section: mapping.section,
          order: mapping.order,
        },
      });
      updated++;
      console.log(`✓ Обновлена категория: ${category.name} (${slug}) -> section: ${mapping.section}, order: ${mapping.order}`);
    } else {
      // Если категория не найдена в маппинге, устанавливаем значения по умолчанию
      if (!category.section) {
        await strapi.entityService.update('api::category.category', category.id, {
          data: {
            section: 'clothing',
            order: 999,
          },
        });
        updated++;
        console.log(`⚠ Установлены значения по умолчанию для: ${category.name} (${slug})`);
      }
    }
  }

  // Создаем недостающие категории
  // ВАЖНО: Муслин и Тенсель теперь в разделе "Для дома"
  const clothingCategories = [
    { name: 'Дак', slug: 'dak', section: 'clothing', order: 1 },
    { name: 'Вафельное полотно', slug: 'vafelnoe-polotno', section: 'clothing', order: 2 },
    { name: 'Лен постельный', slug: 'len-postelnyj', section: 'clothing', order: 3 },
    { name: 'Сатин Туриция', slug: 'satin-turiciya', section: 'clothing', order: 4 },
    { name: 'Махра', slug: 'mahra', section: 'clothing', order: 5 },
    { name: 'Поплин Туриция', slug: 'poplin-turiciya', section: 'clothing', order: 6 },
    { name: 'Пике косичка', slug: 'pike-kosichka', section: 'clothing', order: 7 },
    { name: 'Фланель', slug: 'flanel', section: 'clothing', order: 8 },
    { name: 'Сатин люкс', slug: 'satin-lyuks', section: 'clothing', order: 9 },
  ];

  const homeCategories = [
    // Категории для дома в правильном порядке
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
  const existingSlugs = new Set(categories.map(c => c.slug));

  for (const cat of allCategories) {
    if (!existingSlugs.has(cat.slug)) {
      try {
        await strapi.entityService.create('api::category.category', {
          data: {
            ...cat,
            publishedAt: new Date(),
          },
        });
        created++;
        console.log(`+ Создана категория: ${cat.name} (${cat.slug}) -> section: ${cat.section}, order: ${cat.order}`);
        existingSlugs.add(cat.slug); // Добавляем в набор, чтобы избежать повторных попыток
      } catch (error) {
        if (error.message && error.message.includes('unique')) {
          console.log(`⚠ Пропущена категория ${cat.name} (${cat.slug}) - уже существует`);
        } else {
          throw error;
        }
      }
    }
  }
  
  // Обновляем Муслин и Тенсель для дома, если они уже существуют
  // Эти категории могут быть в обоих разделах, но в текущей реализации одна категория = один раздел
  // Поэтому оставляем их только в одежде, или создаем отдельные категории для дома с другими slug'ами

  console.log('\n=== Результат ===');
  console.log(`Обновлено категорий: ${updated}`);
  console.log(`Создано категорий: ${created}`);
  console.log('Готово! ✓');
}

(async () => {
  const app = await bootstrapStrapi();
  try {
    await updateCategories(app);
  } catch (err) {
    console.error('Ошибка при обновлении категорий:', err);
    process.exitCode = 1;
  } finally {
    await app.destroy();
  }
})();
