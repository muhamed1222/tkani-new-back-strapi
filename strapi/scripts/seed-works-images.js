
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

async function bootstrapStrapi() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({
    appDir: path.resolve(__dirname, '..'),
  }).load();
  return app;
}

async function uploadFile(strapi, filePath, fileName) {
  try {
    const stats = fs.statSync(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    
    // В Strapi v5 сервис загрузки может отличаться, пробуем стандартный плагин
    // Имитируем структуру файла, которую ожидает сервис загрузки
    const fileData = {
      path: filePath,
      name: fileName,
      type: mimeType,
      size: stats.size,
      buffer: fs.readFileSync(filePath),
    };

    // Используем плагин upload для загрузки файла
    // Примечание: API загрузки может меняться между версиями, это стандартный подход для v4/v5
    const uploadService = strapi.plugin('upload').service('upload');
    
    // В некоторых версиях uploadService.upload принимает структуру { data, files }
    // В других просто files. Пробуем наиболее универсальный метод
    
    // Создаем запись в таблице files и загружаем контент
    // Часто проще использовать strapi.plugins['upload'].services.upload.upload
    
    // Попытка 1: Через entityService (если файл уже загружен, но это маловероятно)
    // Попытка 2: Прямая загрузка через Upload Service
    
    // В контексте скрипта seed проще всего использовать внутренний API плагина
    // upload({ data, files })
    
    const uploadedFiles = await uploadService.upload({
      data: {}, // metadata
      files: {
        path: filePath,
        name: fileName,
        type: mimeType,
        size: stats.size,
        buffer: fs.readFileSync(filePath), // ВАЖНО: передаем буфер
      },
    });

    // Возвращает массив или один объект
    const file = Array.isArray(uploadedFiles) ? uploadedFiles[0] : uploadedFiles;
    return file;

  } catch (error) {
    console.error(`Ошибка загрузки файла ${fileName}:`, error);
    return null;
  }
}

async function seedWorksWithImages(strapi) {
  console.log('🎨 Обновление работ с изображениями...\n');

  const worksDir = path.resolve(__dirname, '../../static/works');
  if (!fs.existsSync(worksDir)) {
    console.error(`❌ Директория с изображениями не найдена: ${worksDir}`);
    return;
  }

  // Список работ (порядок важен для сопоставления с work1.jpg, work2.jpg...)
  const worksData = [
    { title: "Платье из натурального хлопка", image: "work1.jpg" },
    { title: "Шторы для гостиной", image: "work2.jpg" },
    { title: "Детский костюм", image: "work3.jpg" },
    { title: "Постельное белье премиум", image: "work4.jpg" },
    { title: "Женская блузка", image: "work5.jpg" },
    { title: "Покрывало для спальни", image: "work6.jpg" },
    { title: "Мужская рубашка", image: "work7.jpg" },
    { title: "Скатерть для стола", image: "work8.jpg" },
    { title: "Детское платье", image: "work9.jpg" },
    { title: "Диванные подушки", image: "work10.jpg" },
    { title: "Женская юбка", image: "work11.jpg" },
    { title: "Полотенца для ванной", image: "work12.jpg" }
    // Можно добавить больше если есть картинки
  ];

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Получаем все существующие работы
  const existingWorks = await strapi.entityService.findMany('api::work.work', {
    populate: ['images'], // В Strapi v5 поле может называться images или image
    limit: 1000
  });

  console.log(`Найдено работ в базе: ${existingWorks.length}`);

  for (let i = 0; i < worksData.length; i++) {
    const workInfo = worksData[i];
    const imagePath = path.join(worksDir, workInfo.image);

    if (!fs.existsSync(imagePath)) {
      console.warn(`⚠ Файл изображения не найден: ${workInfo.image}, пропускаем...`);
      continue;
    }

    // Ищем работу по названию
    const work = existingWorks.find(w => w.title === workInfo.title);

    if (!work) {
      console.warn(`⚠ Работа "${workInfo.title}" не найдена в базе, пропускаем...`);
      skipped++;
      continue;
    }

    // Проверяем, есть ли уже изображения
    if (work.images && work.images.length > 0) {
      console.log(`ℹ Работа "${work.title}" уже имеет изображение, пропускаем.`);
      skipped++;
      continue;
    }
    
    // Если поле называется 'image' (для обратной совместимости)
     if (work.image) {
      console.log(`ℹ Работа "${work.title}" уже имеет изображение (поле image), пропускаем.`);
      skipped++;
      continue;
    }

    console.log(`📤 Загружаю изображение ${workInfo.image} для "${work.title}"...`);

    try {
      const uploadedFile = await uploadFile(strapi, imagePath, workInfo.image);

      if (uploadedFile) {
        // Обновляем работу, привязывая файл
        // ВАЖНО: Strapi v5 может требовать 'images' (множественное) или 'image' (единственное)
        // Обычно 'images' для медиа-полей
        
        await strapi.entityService.update('api::work.work', work.id, {
          data: {
            images: [uploadedFile.id], // Привязываем массив ID файлов
            // image: uploadedFile.id, // Если поле единственного числа (попробуем оба если не уверены, но обычно images)
            publishedAt: new Date(), // Публикуем сразу
          },
        });
        
        console.log(`✅ Работа "${work.title}" обновлена и опубликована!`);
        updated++;
      }
    } catch (error) {
      console.error(`❌ Ошибка обновления работы "${work.title}":`, error.message);
      errors++;
    }
  }

  console.log(`\n=== Итог ===`);
  console.log(`Обновлено: ${updated}`);
  console.log(`Пропущено: ${skipped}`);
  console.log(`Ошибок: ${errors}`);
}

async function main() {
  let app;
  try {
    app = await bootstrapStrapi();
    await seedWorksWithImages(app);
    console.log('\n✅ Скрипт завершен!');
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  } finally {
    if (app) {
      await app.destroy();
    }
    process.exit(0);
  }
}

main();

