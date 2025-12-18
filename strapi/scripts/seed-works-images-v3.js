
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

async function manualUploadFile(strapi, sourcePath, fileName) {
  try {
    const stats = fs.statSync(sourcePath);
    const mimeType = mime.lookup(sourcePath) || 'application/octet-stream';
    const ext = path.extname(fileName);
    const basename = path.basename(fileName, ext);
    
    // Генерируем уникальное имя файла, чтобы не конфликтовать
    const hash = Math.random().toString(36).substring(2, 15);
    const uniqueFileName = `${basename}_${hash}${ext}`;
    
    // Путь куда копировать (в public/uploads)
    const uploadDir = path.resolve(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const destPath = path.join(uploadDir, uniqueFileName);
    
    // Копируем файл
    fs.copyFileSync(sourcePath, destPath);
    
    // Создаем запись в базе данных напрямую
    const fileEntry = await strapi.db.query('plugin::upload.file').create({
      data: {
        name: fileName,
        alternativeText: fileName,
        caption: fileName,
        width: 800, // Примерные размеры, не критично для отображения
        height: 600,
        formats: null, // Нет миниатюр
        hash: `${basename}_${hash}`,
        ext: ext,
        mime: mimeType,
        size: stats.size / 1000, // в КБ
        url: `/uploads/${uniqueFileName}`,
        previewUrl: null,
        provider: 'local',
        provider_metadata: null,
        folderPath: '/',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    return fileEntry;

  } catch (error) {
    console.error(`Ошибка ручной загрузки файла ${fileName}:`, error);
    return null;
  }
}

async function seedWorksWithImages(strapi) {
  console.log('🎨 Обновление работ с изображениями (попытка 3 - прямой метод)...\n');

  const worksDir = path.resolve(__dirname, '../../static/works');
  
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

  // Используем populate: '*' чтобы точно получить images
  const existingWorks = await strapi.entityService.findMany('api::work.work', {
    populate: '*',
    limit: 1000
  });

  for (const workInfo of worksData) {
    const work = existingWorks.find(w => w.title === workInfo.title);
    if (!work) continue;

    if (work.images && work.images.length > 0) {
      console.log(`ℹ Работа "${work.title}" уже имеет фото (images).`);
      continue;
    }
    
    // Проверка альтернативного поля image
    if (work.image) {
       console.log(`ℹ Работа "${work.title}" уже имеет фото (image).`);
       continue;
    }

    const imagePath = path.join(worksDir, workInfo.image);
    if (!fs.existsSync(imagePath)) {
        console.warn(`⚠ Файл не найден: ${workInfo.image}`);
        continue;
    }

    console.log(`📤 Загрузка ${workInfo.image} для "${work.title}"...`);
    
    // Используем наш ручной метод загрузки
    const file = await manualUploadFile(strapi, imagePath, workInfo.image);
    
    if (file && file.id) {
        // Обновляем работу
        await strapi.entityService.update('api::work.work', work.id, {
            data: {
                images: [file.id],
                // image: file.id, // На всякий случай можно раскомментировать если images не сработает
                publishedAt: new Date()
            }
        });
        console.log(`✅ Успешно привязано!`);
        updated++;
    }
  }
  
  console.log(`\nОбновлено работ: ${updated}`);
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

