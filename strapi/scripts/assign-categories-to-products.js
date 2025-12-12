#!/usr/bin/env node
'use strict';

/**
 * Скрипт для привязки товаров к категориям в Strapi
 * Проверяет товары без категорий и привязывает их на основе названия или артикула
 * Использование: node scripts/assign-categories-to-products.js
 */

const { resolve } = require('path');

async function bootstrapStrapi() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({
    appDir: resolve(__dirname, '..'),
  }).load();
  return app;
}

async function assignCategories(strapi) {
  console.log('🔄 Проверка и привязка товаров к категориям...\n');

  // Получаем все категории
  const categories = await strapi.entityService.findMany('api::category.category', {
    limit: 1000
  });

  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
    categoryMap[cat.name?.toLowerCase()] = cat.id;
  });

  console.log(`📂 Найдено категорий: ${categories.length}`);
  categories.forEach(cat => {
    console.log(`   - ${cat.name} (slug: ${cat.slug}, id: ${cat.id}, section: ${cat.section})`);
  });
  console.log('');

  // Получаем все товары
  const products = await strapi.entityService.findMany('api::product.product', {
    populate: {
      category: {
        fields: ['id', 'name', 'slug']
      }
    },
    limit: 1000
  });

  console.log(`📦 Найдено товаров: ${products.length}\n`);

  // Анализируем товары без категорий
  const productsWithoutCategory = products.filter(p => !p.category);
  const productsWithCategory = products.filter(p => p.category);

  console.log(`✅ Товары с категорией: ${productsWithCategory.length}`);
  console.log(`❌ Товары БЕЗ категории: ${productsWithoutCategory.length}\n`);

  if (productsWithoutCategory.length > 0) {
    console.log('📋 Товары без категории:');
    productsWithoutCategory.forEach(p => {
      console.log(`   - ID: ${p.id}, Название: ${p.title}, Артикул: ${p.article || 'нет'}`);
    });
    console.log('');

    // Маппинг названий/артикулов к категориям (можно расширить)
    const categoryMapping = {
      // По артикулу
      'DAK': 'dak',
      'VAF': 'vafelnoe-polotno',
      'LEN': 'len-postelnyj',
      'SAT': 'satin-turiciya',
      'MAH': 'mahra',
      'MUS': 'muslin',
      'TEN': 'tensel',
      'POP': 'poplin-turiciya',
      'PIK': 'pike-kosichka',
      'FLA': 'flanel',
      'SLU': 'satin-lyuks',
      'SHT': 'shtapel',
      'KUP': 'kupra',
      'SHE': 'shelk',
      'DZH': 'dzhinsa',
      // По ключевым словам в названии
      'дак': 'dak',
      'вафел': 'vafelnoe-polotno',
      'лен': 'len-postelnyj',
      'сатин': 'satin-turiciya',
      'махр': 'mahra',
      'муслин': 'muslin',
      'тенсел': 'tensel',
      'поплин': 'poplin-turiciya',
      'пике': 'pike-kosichka',
      'флан': 'flanel',
      'штапел': 'shtapel',
      'купр': 'kupra',
      'шелк': 'shelk',
      'джинс': 'dzhinsa',
    };

    let assigned = 0;
    let skipped = 0;

    for (const product of productsWithoutCategory) {
      let categorySlug = null;
      let categoryId = null;

      // Пробуем найти категорию по артикулу
      if (product.article) {
        const articlePrefix = product.article.split('-')[0].toUpperCase();
        if (categoryMapping[articlePrefix]) {
          categorySlug = categoryMapping[articlePrefix];
          categoryId = categoryMap[categorySlug];
        }
      }

      // Если не нашли по артикулу, пробуем по названию
      if (!categoryId && product.title) {
        const titleLower = product.title.toLowerCase();
        for (const [key, slug] of Object.entries(categoryMapping)) {
          if (titleLower.includes(key.toLowerCase())) {
            categorySlug = slug;
            categoryId = categoryMap[categorySlug];
            break;
          }
        }
      }

      if (categoryId) {
        try {
          await strapi.entityService.update('api::product.product', product.id, {
            data: {
              category: categoryId
            }
          });
          const category = categories.find(c => c.id === categoryId);
          console.log(`✅ Товар "${product.title}" привязан к категории "${category?.name}" (${categorySlug})`);
          assigned++;
        } catch (error) {
          console.error(`❌ Ошибка привязки товара "${product.title}":`, error.message);
        }
      } else {
        console.log(`⚠️  Не удалось определить категорию для товара "${product.title}" (ID: ${product.id}, Артикул: ${product.article || 'нет'})`);
        skipped++;
      }
    }

    console.log(`\n📊 Результат:`);
    console.log(`   ✅ Привязано: ${assigned}`);
    console.log(`   ⚠️  Пропущено: ${skipped}`);
  } else {
    console.log('✅ Все товары уже привязаны к категориям!');
  }

  // Проверяем товары с категориями
  if (productsWithCategory.length > 0) {
    console.log('\n📋 Товары с категориями (первые 10):');
    productsWithCategory.slice(0, 10).forEach(p => {
      console.log(`   - "${p.title}" → ${p.category?.name || 'неизвестно'} (${p.category?.slug || 'нет slug'})`);
    });
  }
}

async function main() {
  let strapi;
  try {
    strapi = await bootstrapStrapi();
    await assignCategories(strapi);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  } finally {
    if (strapi) {
      await strapi.destroy();
    }
  }
}

main();

