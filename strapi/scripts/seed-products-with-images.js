#!/usr/bin/env node
'use strict';

/**
 * Скрипт для создания товаров с изображениями
 * Использование: node scripts/seed-products-with-images.js
 */

const { resolve } = require('path');
const https = require('https');
const fs = require('fs');
const path = require('path');

async function bootstrapStrapi() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({
    appDir: resolve(__dirname, '..'),
  }).load();
  return app;
}

// Функция для загрузки изображения по URL
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filepath);
        });
        fileStream.on('error', reject);
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Редирект
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    });
    request.on('error', reject);
  });
}

// Функция для загрузки изображения в Strapi
async function uploadImageToStrapi(strapi, imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      console.error(`Файл не существует: ${imagePath}`);
      return null;
    }

    const fileData = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);
    const mimeType = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') 
      ? 'image/jpeg' 
      : fileName.endsWith('.png') 
        ? 'image/png' 
        : 'image/jpeg';

    // Используем правильный формат для Strapi v4
    const file = await strapi.plugins.upload.services.upload.upload({
      data: {},
      files: {
        path: imagePath,
        name: fileName,
        type: mimeType,
        size: fileData.length,
      },
    });

    // Возвращаем весь объект файла
    const uploadedFile = Array.isArray(file) ? file[0] : file;
    return uploadedFile || null;
  } catch (error) {
    console.error('Ошибка загрузки изображения в Strapi:', error.message);
    return null;
  }
}

// Изображения тканей - используем реальные публичные URL изображений из Unsplash
const fabricImages = {
  'dak': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'vafelnoe-polotno': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'len-postelnyj': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'satin-turiciya': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'mahra': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'muslin': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'tensel': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'poplin-turiciya': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'pike-kosichka': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'flanel': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'satin-lyuks': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'shtapel': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'kupra': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'shelk': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'dzhinsa': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'hlopok': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'trikotazh': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
  'len': [
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  ],
};

// Товары для создания
const productsData = [
  // Для одежды
  { title: 'Дак бежевый', categorySlug: 'dak', price: 450, stock: 50, article: 'DAK-001' },
  { title: 'Дак серый', categorySlug: 'dak', price: 450, stock: 30, article: 'DAK-002' },
  { title: 'Дак белый', categorySlug: 'dak', price: 450, stock: 40, article: 'DAK-003' },
  { title: 'Вафельное полотно голубое', categorySlug: 'vafelnoe-polotno', price: 380, stock: 25, article: 'VAF-001' },
  { title: 'Вафельное полотно розовое', categorySlug: 'vafelnoe-polotno', price: 380, stock: 35, article: 'VAF-002' },
  { title: 'Лен постельный натуральный', categorySlug: 'len-postelnyj', price: 520, stock: 20, article: 'LEN-001' },
  { title: 'Сатин Туриция белый', categorySlug: 'satin-turiciya', price: 480, stock: 45, article: 'SAT-001' },
  { title: 'Сатин Туриция кремовый', categorySlug: 'satin-turiciya', price: 480, stock: 30, article: 'SAT-002' },
  { title: 'Махра пушистая', categorySlug: 'mahra', price: 350, stock: 60, article: 'MAH-001' },
  { title: 'Махра мягкая', categorySlug: 'mahra', price: 350, stock: 50, article: 'MAH-002' },
  { title: 'Муслин легкий', categorySlug: 'muslin', price: 290, stock: 40, article: 'MUS-001' },
  { title: 'Тенсель премиум', categorySlug: 'tensel', price: 650, stock: 15, article: 'TEN-001' },
  { title: 'Поплин Туриция', categorySlug: 'poplin-turiciya', price: 420, stock: 35, article: 'POP-001' },
  { title: 'Пике косичка', categorySlug: 'pike-kosichka', price: 400, stock: 28, article: 'PIK-001' },
  { title: 'Фланель теплая', categorySlug: 'flanel', price: 380, stock: 42, article: 'FLA-001' },
  { title: 'Сатин люкс', categorySlug: 'satin-lyuks', price: 550, stock: 25, article: 'SLU-001' },
  
  // Для дома
  { title: 'Муслин для дома', categorySlug: 'muslin', price: 320, stock: 30, article: 'MUS-H-001' },
  { title: 'Штапель домашний', categorySlug: 'shtapel', price: 360, stock: 40, article: 'SHT-001' },
  { title: 'Купра элегантная', categorySlug: 'kupra', price: 480, stock: 20, article: 'KUP-001' },
  { title: 'Шелк натуральный', categorySlug: 'shelk', price: 720, stock: 10, article: 'SHE-001' },
  { title: 'Джинса домашняя', categorySlug: 'dzhinsa', price: 450, stock: 35, article: 'DZH-001' },
  { title: 'Тенсель для дома', categorySlug: 'tensel', price: 680, stock: 18, article: 'TEN-H-001' },
  { title: 'Хлопок 100%', categorySlug: 'hlopok', price: 380, stock: 50, article: 'HLP-001' },
  { title: 'Трикотаж мягкий', categorySlug: 'trikotazh', price: 420, stock: 45, article: 'TRI-001' },
  { title: 'Лен домашний', categorySlug: 'len', price: 500, stock: 30, article: 'LEN-H-001' },
];

async function seedProducts(strapi) {
  console.log('🛍️ Создание товаров с изображениями...\n');

  // Получаем все категории
  const categories = await strapi.entityService.findMany('api::category.category', {
    populate: '*',
    limit: 1000
  });

  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
  });

  const tempDir = path.join(__dirname, '..', 'temp_images');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

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

      // Получаем изображения для категории
      const imageUrls = fabricImages[productData.categorySlug] || fabricImages['dak'];
      const numImages = Math.floor(Math.random() * 4) + 3; // От 3 до 6 изображений
      const selectedImages = imageUrls.slice(0, numImages);

      console.log(`📦 Создание товара: ${productData.title} (${numImages} изображений)...`);

      // Загружаем и загружаем изображения в Strapi
      const uploadedImages = [];
      let mainImage = null;

      for (let i = 0; i < selectedImages.length; i++) {
        try {
          const imageUrl = selectedImages[i];
          const tempPath = path.join(tempDir, `temp_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}.jpg`);
          
          console.log(`  📥 Загрузка изображения ${i + 1}/${selectedImages.length}...`);
          await downloadImage(imageUrl, tempPath);
          
          const uploadedFile = await uploadImageToStrapi(strapi, tempPath);
          if (uploadedFile && uploadedFile.id) {
            uploadedImages.push(uploadedFile.id);
            if (i === 0) {
              mainImage = uploadedFile.id;
            }
            console.log(`  ✅ Изображение ${i + 1} загружено (ID: ${uploadedFile.id})`);
          }
          
          // Удаляем временный файл
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        } catch (error) {
          console.error(`  ⚠ Ошибка загрузки изображения ${i + 1}:`, error.message);
        }
      }

      // Создаем товар (даже если нет изображений)
      const product = await strapi.entityService.create('api::product.product', {
        data: {
          title: productData.title,
          price: productData.price,
          stock: productData.stock,
          article: productData.article,
          category: categoryId,
          image: mainImage,
          images: uploadedImages.length > 1 ? uploadedImages.slice(1) : [],
          publishedAt: new Date(),
        },
      });

      created++;
      console.log(`✅ Создан товар: ${productData.title} (ID: ${product.id}, изображений: ${uploadedImages.length})\n`);
    } catch (error) {
      console.error(`❌ Ошибка создания товара ${productData.article}:`, error.message);
      skipped++;
    }
  }

  // Удаляем временную директорию
  if (fs.existsSync(tempDir)) {
    fs.readdirSync(tempDir).forEach(file => {
      fs.unlinkSync(path.join(tempDir, file));
    });
    fs.rmdirSync(tempDir);
  }

  console.log(`\n=== Результат ===`);
  console.log(`Создано товаров: ${created}`);
  console.log(`Пропущено товаров: ${skipped}`);
}

async function main() {
  let app;
  try {
    app = await bootstrapStrapi();
    await seedProducts(app);
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
