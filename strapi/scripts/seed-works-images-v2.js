
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
    
    // В Strapi 5 попробуем использовать Upload Service напрямую, но с другой структурой
    // Часто проблема в том, как передается файл (stream vs buffer)
    
    const uploadService = strapi.plugin('upload').service('upload');
    
    // Формируем объект файла так, как его ожидает formidable/upload provider
    const file = {
      path: filePath,
      name: fileName,
      type: mimeType,
      size: stats.size,
    };
    
    // Вариант 2: Передаем файлы как массив в поле files, и пустую data
    // Это эмулирует multipart запрос
    
    // В Strapi v4/v5 метод upload часто имеет сигнатуру upload({ data, files })
    // Но если мы вызываем его из кода, иногда нужно передавать иначе.
    
    // Попробуем через provider напрямую, если service не хочет работать с путями
    // Но provider требует stream.
    
    // Попробуем классический способ для Strapi, но с учетом ошибки "path argument ... Received undefined"
    // Скорее всего, внутри upload сервиса он пытается прочитать path из объекта, который мы передали неверно.
    
    const uploadedFiles = await uploadService.upload({
        data: {
            fileInfo: {
                name: fileName,
                caption: fileName,
                alternativeText: fileName,
            }
        },
        files: {
            path: filePath,
            name: fileName,
            type: mimeType, 
            size: stats.size,
            // Важно: некоторые провайдеры требуют stream, некоторые buffer
            // Передадим оба для надежности, если это поддерживается, или path
        }
    });

    return Array.isArray(uploadedFiles) ? uploadedFiles[0] : uploadedFiles;

  } catch (error) {
    console.error(`Ошибка загрузки файла ${fileName}:`, error);
    // Если не получилось, попробуем альтернативный метод (через Strapi Fetch API если бы мы были снаружи, но мы внутри)
    return null;
  }
}

async function seedWorksWithImages(strapi) {
  console.log('🎨 Обновление работ с изображениями (попытка 2)...\n');

  const worksDir = path.resolve(__dirname, '../../static/works');
  
  // Данные (те же самые)
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
  ];

  let updated = 0;

  const existingWorks = await strapi.entityService.findMany('api::work.work', {
    populate: ['images'],
  });

  for (const workInfo of worksData) {
    const work = existingWorks.find(w => w.title === workInfo.title);
    if (!work) continue;

    if (work.images && work.images.length > 0) {
      console.log(`ℹ Работа "${work.title}" уже имеет фото.`);
      continue;
    }

    const imagePath = path.join(worksDir, workInfo.image);
    if (!fs.existsSync(imagePath)) continue;

    console.log(`📤 Загрузка ${workInfo.image} для "${work.title}"...`);
    
    const file = await uploadFile(strapi, imagePath, workInfo.image);
    
    if (file && file.id) {
        await strapi.entityService.update('api::work.work', work.id, {
            data: {
                images: [file.id],
                publishedAt: new Date()
            }
        });
        console.log(`✅ Успешно!`);
        updated++;
    }
  }
  
  console.log(`Обновлено: ${updated}`);
}

async function main() {
  let app;
  try {
    app = await bootstrapStrapi();
    await seedWorksWithImages(app);
  } catch (error) {
    console.error(error);
  } finally {
    if (app) await app.destroy();
    process.exit(0);
  }
}

main();

