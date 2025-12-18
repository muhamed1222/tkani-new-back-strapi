#!/usr/bin/env node
'use strict';

/**
 * Скрипт для создания товаров в Strapi
 * Использование: node scripts/seed-products-simple.js
 */

const { resolve } = require('path');

async function bootstrapStrapi() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({
    appDir: resolve(__dirname, '..'),
  }).load();
  return app;
}

async function seedProducts(strapi) {
  console.log('🛍️ Создание товаров...\n');

  // Получаем все категории
  const categories = await strapi.entityService.findMany('api::category.category', {
    limit: 1000
  });

  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
  });

  // Получаем бренды
  const brands = await strapi.entityService.findMany('api::brand.brand', {
    limit: 10
  });
  const defaultBrand = brands.length > 0 ? brands[0].id : null;

  console.log(`Найдено категорий: ${categories.length}`);
  console.log(`Найдено брендов: ${brands.length}\n`);

  // Товары для разных категорий
  const productsData = [
    // Дак (clothing)
    { title: 'Дак бежевый', categorySlug: 'dak', price: 450, stock: 50, article: 'DAK-001', description: 'Мягкая ткань дак бежевого цвета, идеальна для пошива одежды.', composition: '100% хлопок', width: '150 см', density: '120 г/м²', country: 'Турция' },
    { title: 'Дак серый', categorySlug: 'dak', price: 450, stock: 30, article: 'DAK-002', description: 'Классический дак серого оттенка.', composition: '100% хлопок', width: '150 см', density: '120 г/м²', country: 'Турция' },
    { title: 'Дак белый', categorySlug: 'dak', price: 450, stock: 40, article: 'DAK-003', description: 'Чистый белый дак для светлой одежды.', composition: '100% хлопок', width: '150 см', density: '120 г/м²', country: 'Турция' },
    
    // Вафельное полотно (clothing)
    { title: 'Вафельное полотно голубое', categorySlug: 'vafelnoe-polotno', price: 380, stock: 25, article: 'VAF-001', description: 'Вафельное полотно нежного голубого цвета.', composition: '100% хлопок', width: '140 см', density: '110 г/м²', country: 'Беларусь' },
    { title: 'Вафельное полотно розовое', categorySlug: 'vafelnoe-polotno', price: 380, stock: 35, article: 'VAF-002', description: 'Вафельное полотно розового оттенка.', composition: '100% хлопок', width: '140 см', density: '110 г/м²', country: 'Беларусь' },
    
    // Лен постельный (clothing)
    { title: 'Лен постельный натуральный', categorySlug: 'len-postelnyj', price: 520, stock: 20, article: 'LEN-001', description: 'Натуральный лен для постельного белья высшего качества.', composition: '100% лен', width: '150 см', density: '140 г/м²', country: 'Беларусь' },
    { title: 'Лен постельный бежевый', categorySlug: 'len-postelnyj', price: 520, stock: 18, article: 'LEN-002', description: 'Лен бежевого оттенка для элегантного постельного белья.', composition: '100% лен', width: '150 см', density: '140 г/м²', country: 'Беларусь' },
    
    // Сатин Туриция (clothing)
    { title: 'Сатин Туриция белый', categorySlug: 'satin-turiciya', price: 480, stock: 45, article: 'SAT-001', description: 'Гладкий сатин белого цвета с блеском.', composition: '100% хлопок', width: '150 см', density: '130 г/м²', country: 'Турция' },
    { title: 'Сатин Туриция кремовый', categorySlug: 'satin-turiciya', price: 480, stock: 30, article: 'SAT-002', description: 'Нежный кремовый сатин.', composition: '100% хлопок', width: '150 см', density: '130 г/м²', country: 'Турция' },
    
    // Махра (clothing)
    { title: 'Махра пушистая', categorySlug: 'mahra', price: 350, stock: 60, article: 'MAH-001', description: 'Мягкая пушистая махра для полотенец и халатов.', composition: '100% хлопок', width: '150 см', density: '180 г/м²', country: 'Турция' },
    { title: 'Махра мягкая', categorySlug: 'mahra', price: 350, stock: 50, article: 'MAH-002', description: 'Особенно мягкая махра.', composition: '100% хлопок', width: '150 см', density: '180 г/м²', country: 'Турция' },
    
    // Муслин (clothing)
    { title: 'Муслин легкий', categorySlug: 'muslin', price: 290, stock: 40, article: 'MUS-001', description: 'Легкий дышащий муслин.', composition: '100% хлопок', width: '140 см', density: '90 г/м²', country: 'Турция' },
    { title: 'Муслин двухслойный', categorySlug: 'muslin', price: 320, stock: 35, article: 'MUS-002', description: 'Двухслойный муслин повышенной прочности.', composition: '100% хлопок', width: '140 см', density: '180 г/м²', country: 'Турция' },
    
    // Тенсель (clothing)
    { title: 'Тенсель премиум', categorySlug: 'tensel', price: 650, stock: 15, article: 'TEN-001', description: 'Премиальный тенсель из эвкалипта.', composition: '100% тенсель', width: '150 см', density: '150 г/м²', country: 'Китай' },
    
    // Поплин Туриция (clothing)
    { title: 'Поплин Туриция', categorySlug: 'poplin-turiciya', price: 420, stock: 35, article: 'POP-001', description: 'Классический поплин турецкого производства.', composition: '100% хлопок', width: '150 см', density: '125 г/м²', country: 'Турция' },
    
    // Пике косичка (clothing)
    { title: 'Пике косичка', categorySlug: 'pike-kosichka', price: 400, stock: 28, article: 'PIK-001', description: 'Пике с рисунком косичка.', composition: '100% хлопок', width: '150 см', density: '130 г/м²', country: 'Турция' },
    
    // Фланель (clothing)
    { title: 'Фланель теплая', categorySlug: 'flanel', price: 380, stock: 42, article: 'FLA-001', description: 'Мягкая теплая фланель.', composition: '100% хлопок', width: '150 см', density: '160 г/м²', country: 'Беларусь' },
    
    // Сатин люкс (clothing)
    { title: 'Сатин люкс', categorySlug: 'satin-lyuks', price: 550, stock: 25, article: 'SLU-001', description: 'Люксовый сатин высшего качества.', composition: '100% хлопок', width: '150 см', density: '140 г/м²', country: 'Турция' },
    
    // Для дома - Муслин
    { title: 'Муслин для дома', categorySlug: 'muslin', price: 320, stock: 30, article: 'MUS-H-001', description: 'Муслин для домашнего текстиля.', composition: '100% хлопок', width: '150 см', density: '100 г/м²', country: 'Турция', section: 'home' },
    
    // Штапель (home)
    { title: 'Штапель домашний', categorySlug: 'shtapel', price: 360, stock: 40, article: 'SHT-001', description: 'Штапель для домашнего текстиля.', composition: '100% хлопок', width: '150 см', density: '115 г/м²', country: 'Беларусь' },
    
    // Купра (home)
    { title: 'Купра элегантная', categorySlug: 'kupra', price: 480, stock: 20, article: 'KUP-001', description: 'Элегантная купра для штор и декора.', composition: '100% хлопок', width: '150 см', density: '135 г/м²', country: 'Турция' },
    
    // Шелк (home)
    { title: 'Шелк натуральный', categorySlug: 'shelk', price: 720, stock: 10, article: 'SHE-001', description: 'Натуральный шелк премиум качества.', composition: '100% шелк', width: '140 см', density: '80 г/м²', country: 'Китай' },
    
    // Джинса (home)
    { title: 'Джинса домашняя', categorySlug: 'dzhinsa', price: 450, stock: 35, article: 'DZH-001', description: 'Джинсовая ткань для домашнего декора.', composition: '98% хлопок, 2% эластан', width: '150 см', density: '300 г/м²', country: 'Турция' },
    
    // Тенсель для дома (home)
    { title: 'Тенсель для дома', categorySlug: 'tensel', price: 680, stock: 18, article: 'TEN-H-001', description: 'Тенсель для домашнего текстиля.', composition: '100% тенсель', width: '150 см', density: '150 г/м²', country: 'Китай', section: 'home' },
    
    // Хлопок (home)
    { title: 'Хлопок 100%', categorySlug: 'hlopok', price: 380, stock: 50, article: 'HLP-001', description: 'Чистый хлопок для домашнего использования.', composition: '100% хлопок', width: '150 см', density: '120 г/м²', country: 'Турция' },
    
    // Трикотаж (home)
    { title: 'Трикотаж мягкий', categorySlug: 'trikotazh', price: 420, stock: 45, article: 'TRI-001', description: 'Мягкий трикотаж для домашнего текстиля.', composition: '100% хлопок', width: '150 см', density: '200 г/м²', country: 'Беларусь' },
    
    // Лен (home)
    { title: 'Лен домашний', categorySlug: 'len', price: 500, stock: 30, article: 'LEN-H-001', description: 'Лен для домашнего декора и текстиля.', composition: '100% лен', width: '150 см', density: '140 г/м²', country: 'Беларусь' },
  ];

  let created = 0;
  let skipped = 0;

  for (const productData of productsData) {
    try {
      // Проверяем, существует ли товар
      const existing = await strapi.entityService.findMany('api::product.product', {
        filters: { article: productData.article },
        limit: 1
      });

      if (existing.length > 0) {
        console.log(`⚠ Пропущен товар ${productData.article} - уже существует`);
        skipped++;
        continue;
      }

      const categoryId = categoryMap[productData.categorySlug];
      if (!categoryId) {
        console.log(`⚠ Категория ${productData.categorySlug} не найдена для товара ${productData.article}`);
        skipped++;
        continue;
      }

      // Создаем товар
      const { section, ...productFields } = productData;
      await strapi.entityService.create('api::product.product', {
        data: {
          title: productFields.title,
          description: productFields.description || `${productFields.title} - качественная ткань для ваших нужд.`,
          price: productFields.price,
          stock: productFields.stock,
          article: productFields.article,
          composition: productFields.composition,
          width: productFields.width,
          density: productFields.density,
          country: productFields.country,
          category: categoryId,
          brand: defaultBrand,
          rating: Math.round((Math.random() * 1 + 4) * 10) / 10, // От 4.0 до 5.0
          reviews_count: Math.floor(Math.random() * 50) + 5, // От 5 до 55
          discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 10 : 0, // 30% товаров со скидкой
          discount_price: null, // Будет рассчитано автоматически
          publishedAt: new Date(),
        },
      });

      created++;
      const discountText = productFields.discount > 0 ? ` (скидка ${productFields.discount}%)` : '';
      console.log(`✓ Создан товар: ${productFields.title}${discountText}`);
    } catch (error) {
      console.error(`✗ Ошибка создания товара ${productData.article}:`, error.message);
    }
  }

  console.log(`\n=== Результат ===`);
  console.log(`Создано товаров: ${created}`);
  console.log(`Пропущено товаров: ${skipped}`);
  console.log(`\n⚠ ВАЖНО: Изображения можно добавить через Strapi Admin панель!`);
  console.log(`   Перейдите в Content Manager → Product и загрузите изображения для каждого товара.`);
}

async function main() {
  let app;
  try {
    app = await bootstrapStrapi();
    await seedProducts(app);
    console.log('\n✅ Готово!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exitCode = 1;
  } finally {
    if (app) {
      await app.destroy();
    }
  }
}

main();

