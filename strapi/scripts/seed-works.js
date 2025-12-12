#!/usr/bin/env node
'use strict';

/**
 * Скрипт для создания тестовых работ в Strapi
 * Использование: node scripts/seed-works.js
 */

const { resolve } = require('path');

async function bootstrapStrapi() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({
    appDir: resolve(__dirname, '..'),
  }).load();
  return app;
}

async function seedWorks(strapi) {
  console.log('🎨 Создание работ из наших тканей...\n');

  // Примеры работ
  const works = [
    {
      title: "Платье из натурального хлопка",
      description: "Элегантное платье, сшитое из высококачественного натурального хлопка. Идеально подходит для повседневной носки и особых случаев. Ткань дышащая и приятная к телу.",
      link: "#"
    },
    {
      title: "Шторы для гостиной",
      description: "Роскошные шторы из плотной ткани для гостиной. Отлично пропускают свет и создают уютную атмосферу в доме. Доступны в различных цветах и размерах.",
      link: "#"
    },
    {
      title: "Детский костюм",
      description: "Яркий и удобный детский костюм из мягкой ткани. Безопасные материалы, не вызывающие аллергию. Отлично подходит для активных игр и повседневной носки.",
      link: "#"
    },
    {
      title: "Постельное белье премиум",
      description: "Комплект постельного белья из сатина премиум качества. Невероятно мягкое и приятное на ощупь. Обеспечивает комфортный и здоровый сон.",
      link: "#"
    },
    {
      title: "Женская блузка",
      description: "Стильная женская блузка из легкой ткани. Идеально подходит для офиса и повседневной носки. Классический крой и качественные материалы.",
      link: "#"
    },
    {
      title: "Покрывало для спальни",
      description: "Декоративное покрывало из плотной ткани для спальни. Добавит уюта и стиля в ваш интерьер. Легко стирается и сохраняет форму.",
      link: "#"
    },
    {
      title: "Мужская рубашка",
      description: "Классическая мужская рубашка из хлопка. Отличное качество пошива и долговечность. Подходит для делового стиля и повседневной носки.",
      link: "#"
    },
    {
      title: "Скатерть для стола",
      description: "Элегантная скатерть из качественной ткани. Идеально подходит для праздничных обедов и повседневного использования. Легко чистится.",
      link: "#"
    },
    {
      title: "Детское платье",
      description: "Очаровательное детское платье из мягкой ткани. Яркие цвета и милый дизайн. Комфортно для ребенка и легко стирается.",
      link: "#"
    },
    {
      title: "Диванные подушки",
      description: "Декоративные подушки для дивана из различных тканей. Добавят яркости и уюта в ваш интерьер. Различные размеры и расцветки.",
      link: "#"
    },
    {
      title: "Женская юбка",
      description: "Элегантная женская юбка из качественной ткани. Классический фасон, подходит для офиса и особых случаев. Отличное качество пошива.",
      link: "#"
    },
    {
      title: "Полотенца для ванной",
      description: "Мягкие и впитывающие полотенца из махровой ткани. Высокое качество и долговечность. Различные размеры и цвета.",
      link: "#"
    }
  ];

  let created = 0;
  let skipped = 0;
  let errors = 0;

  // Проверяем существующие работы
  const existingWorks = await strapi.entityService.findMany('api::work.work', {
    limit: 1000
  });

  console.log(`Найдено существующих работ: ${existingWorks.length}\n`);

  // Создаем работы
  console.log('📦 Создание работ...');
  for (const workData of works) {
    // Проверяем, существует ли уже работа с таким названием
    const exists = existingWorks.some(w => w.title === workData.title);
    
    if (exists) {
      console.log(`⚠ Пропущена работа "${workData.title}" - уже существует`);
      skipped++;
      continue;
    }

    try {
      // Создаем работу без изображения (изображение нужно будет добавить вручную)
      // В Strapi v5 можно создать draft без обязательных полей
      const work = await strapi.entityService.create('api::work.work', {
        data: {
          title: workData.title,
          description: workData.description,
          link: workData.link,
          // publishedAt не устанавливаем, так как нет изображения
          // Изображение нужно будет добавить через админ-панель перед публикацией
        },
      });
      
      console.log(`✓ Создана работа: "${workData.title}" (ID: ${work.id})`);
      console.log(`  ⚠ ВАЖНО: Добавьте изображение через админ-панель и опубликуйте работу!`);
      created++;
    } catch (error) {
      console.error(`✗ Ошибка создания работы "${workData.title}":`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Результат ===`);
  console.log(`Создано работ: ${created}`);
  console.log(`Пропущено работ: ${skipped}`);
  console.log(`Ошибок: ${errors}`);
  console.log(`\n⚠ ВАЖНО: Для каждой работы нужно:`);
  console.log(`   1. Перейти в Strapi Admin → Content Manager → Work`);
  console.log(`   2. Открыть созданную работу`);
  console.log(`   3. Загрузить изображение`);
  console.log(`   4. Нажать "Publish" для публикации`);
  console.log(`\n   Только опубликованные работы будут видны на сайте!`);
}

async function main() {
  let app;
  try {
    app = await bootstrapStrapi();
    await seedWorks(app);
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



