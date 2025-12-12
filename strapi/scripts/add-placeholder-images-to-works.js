#!/usr/bin/env node
'use strict';

/**
 * Скрипт для добавления placeholder изображений к работам и их публикации
 * Использование: node scripts/add-placeholder-images-to-works.js
 */

const { resolve } = require('path');
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
  const https = require('https');
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

    // Используем правильный формат для Strapi
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

async function createPlaceholderImage(strapi) {
  // Используем placeholder изображение из интернета
  const placeholderUrl = 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80';
  
  // Создаем временную директорию
  const tempDir = path.join(__dirname, '..', '.tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFilePath = path.join(tempDir, `placeholder-work-${Date.now()}.jpg`);

  try {
    // Скачиваем изображение
    await downloadImage(placeholderUrl, tempFilePath);
    
    // Загружаем в Strapi
    const uploadedFile = await uploadImageToStrapi(strapi, tempFilePath);
    
    // Удаляем временный файл
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    return uploadedFile;
  } catch (error) {
    // Удаляем временный файл в случае ошибки
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    throw error;
  }
}

async function addImagesAndPublishWorks(strapi) {
  console.log('🖼️  Добавление изображений и публикация работ...\n');

  try {
    // Получаем все неопубликованные работы
    const allWorks = await strapi.entityService.findMany('api::work.work', {
      filters: {
        publishedAt: {
          $null: true
        }
      },
      populate: ['image'],
      limit: 1000
    });

    console.log(`Найдено неопубликованных работ: ${allWorks.length}\n`);

    if (allWorks.length === 0) {
      console.log('✅ Все работы уже опубликованы!');
      return;
    }

    // Создаем одно placeholder изображение для всех работ
    console.log('📸 Создание placeholder изображения...');
    let placeholderImage;
    try {
      placeholderImage = await createPlaceholderImage(strapi);
      console.log(`✓ Placeholder изображение создано (ID: ${placeholderImage.id})\n`);
    } catch (error) {
      console.error('✗ Ошибка создания placeholder изображения:', error.message);
      console.log('\n⚠ Продолжаем без изображений - работы останутся неопубликованными');
      return;
    }

    let published = 0;
    let errors = 0;

    for (const work of allWorks) {
      try {
        // Добавляем изображение, если его нет
        let imageId = work.image?.id;
        
        if (!imageId) {
          // Привязываем placeholder изображение
          await strapi.entityService.update('api::work.work', work.id, {
            data: {
              image: placeholderImage.id
            }
          });
          imageId = placeholderImage.id;
          console.log(`✓ Изображение добавлено к работе "${work.title}"`);
        }

        // Публикуем работу
        await strapi.entityService.update('api::work.work', work.id, {
          data: {
            publishedAt: new Date()
          }
        });

        console.log(`✓ Опубликована работа: "${work.title}" (ID: ${work.id})`);
        published++;
      } catch (error) {
        console.error(`✗ Ошибка публикации работы "${work.title}" (ID: ${work.id}):`, error.message);
        errors++;
      }
    }

    console.log(`\n=== Результат ===`);
    console.log(`Опубликовано работ: ${published}`);
    console.log(`Ошибок: ${errors}`);
    console.log(`\n✅ Работы теперь видны на сайте!`);
    console.log(`⚠ Примечание: Используется placeholder изображение.`);
    console.log(`   Вы можете заменить его на реальные фотографии через админ-панель.`);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  }
}

async function main() {
  let app;
  try {
    app = await bootstrapStrapi();
    await addImagesAndPublishWorks(app);
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

