#!/usr/bin/env node
'use strict';

/**
 * Скрипт для публикации товаров и расчета discount_price
 * Использование: node scripts/publish-products.js
 */

const { resolve } = require('path');

async function bootstrapStrapi() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({
    appDir: resolve(__dirname, '..'),
  }).load();
  return app;
}

async function publishProducts(strapi) {
  console.log('📦 Публикация товаров и расчет скидок...\n');

  // Получаем все неопубликованные товары
  const products = await strapi.entityService.findMany('api::product.product', {
    filters: {
      publishedAt: {
        $null: true
      }
    },
    limit: 1000
  });

  console.log(`Найдено неопубликованных товаров: ${products.length}\n`);

  let published = 0;
  let updated = 0;

  for (const product of products) {
    try {
      // Рассчитываем discount_price если есть discount
      let discountPrice = null;
      if (product.discount && product.discount > 0 && product.price) {
        discountPrice = parseFloat((product.price * (1 - product.discount / 100)).toFixed(2));
      }

      // Обновляем товар: публикуем и устанавливаем discount_price
      await strapi.entityService.update('api::product.product', product.id, {
        data: {
          publishedAt: new Date(),
          discount_price: discountPrice
        }
      });

      published++;
      if (discountPrice) {
        console.log(`✓ Опубликован: ${product.title} (скидка ${product.discount}%, цена со скидкой: ${discountPrice} руб.)`);
        updated++;
      } else {
        console.log(`✓ Опубликован: ${product.title}`);
      }
    } catch (error) {
      console.error(`✗ Ошибка публикации товара ${product.id}:`, error.message);
    }
  }

  // Также обновляем discount_price для уже опубликованных товаров
  const publishedProducts = await strapi.entityService.findMany('api::product.product', {
    filters: {
      publishedAt: {
        $notNull: true
      },
      discount: {
        $gt: 0
      },
      discount_price: {
        $null: true
      }
    },
    limit: 1000
  });

  console.log(`\nОбновление discount_price для опубликованных товаров: ${publishedProducts.length}`);

  for (const product of publishedProducts) {
    try {
      if (product.discount && product.discount > 0 && product.price) {
        const discountPrice = parseFloat((product.price * (1 - product.discount / 100)).toFixed(2));
        await strapi.entityService.update('api::product.product', product.id, {
          data: {
            discount_price: discountPrice
          }
        });
        updated++;
        console.log(`✓ Обновлен discount_price: ${product.title} (${discountPrice} руб.)`);
      }
    } catch (error) {
      console.error(`✗ Ошибка обновления товара ${product.id}:`, error.message);
    }
  }

  console.log(`\n=== Результат ===`);
  console.log(`Опубликовано товаров: ${published}`);
  console.log(`Обновлено discount_price: ${updated}`);
}

async function main() {
  let app;
  try {
    app = await bootstrapStrapi();
    await publishProducts(app);
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

