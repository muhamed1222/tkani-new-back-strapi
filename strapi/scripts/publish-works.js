#!/usr/bin/env node
'use strict';

/**
 * Скрипт для публикации всех работ в Strapi
 * Использование: node scripts/publish-works.js
 */

const { resolve } = require('path');

async function bootstrapStrapi() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({
    appDir: resolve(__dirname, '..'),
  }).load();
  return app;
}

async function publishWorks(strapi) {
  console.log('📢 Публикация работ...\n');

  try {
    // Получаем все неопубликованные работы
    const allWorks = await strapi.entityService.findMany('api::work.work', {
      filters: {
        publishedAt: {
          $null: true
        }
      },
      limit: 1000
    });

    console.log(`Найдено неопубликованных работ: ${allWorks.length}\n`);

    if (allWorks.length === 0) {
      console.log('✅ Все работы уже опубликованы!');
      return;
    }

    let published = 0;
    let skipped = 0;
    let errors = 0;

    for (const work of allWorks) {
      try {
        // Публикуем работу (изображение теперь необязательное)
        await strapi.entityService.update('api::work.work', work.id, {
          data: {
            publishedAt: new Date()
          }
        });

        if (!work.image) {
          console.log(`✓ Опубликована работа: "${work.title}" (ID: ${work.id}) [без изображения]`);
          console.log(`   ⚠ Рекомендуется добавить изображение через админ-панель`);
        } else {
          console.log(`✓ Опубликована работа: "${work.title}" (ID: ${work.id})`);
        }
        published++;
      } catch (error) {
        console.error(`✗ Ошибка публикации работы "${work.title}" (ID: ${work.id}):`, error.message);
        errors++;
      }
    }

    console.log(`\n=== Результат ===`);
    console.log(`Опубликовано работ: ${published}`);
    console.log(`Ошибок: ${errors}`);
    
    if (published > 0) {
      console.log(`\n✅ Работы теперь видны на сайте!`);
      console.log(`⚠ Примечание: Некоторые работы могут быть без изображений.`);
      console.log(`   Вы можете добавить изображения через админ-панель Strapi.`);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  }
}

async function main() {
  let app;
  try {
    app = await bootstrapStrapi();
    await publishWorks(app);
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

