'use strict';

/**
 * Middleware для валидации загружаемых файлов
 * Защищает от обхода whitelist типов файлов (CVE-2025-48985)
 */
module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Разрешенные MIME типы
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    // Разрешенные расширения
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    ];

    /**
     * Получает расширение файла из имени
     */
    const getFileExtension = (filename) => {
      if (!filename) return '';
      const lastDot = filename.lastIndexOf('.');
      return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '';
    };

    /**
     * Валидирует MIME тип
     */
    const isValidMimeType = (mimeType) => {
      if (!mimeType) return false;
      return allowedMimeTypes.includes(mimeType.toLowerCase());
    };

    /**
     * Валидирует расширение файла
     */
    const isValidExtension = (filename) => {
      const ext = getFileExtension(filename);
      return allowedExtensions.includes(ext);
    };

    // Проверяем только запросы на загрузку файлов
    if (ctx.method === 'POST' && ctx.path.includes('/upload')) {
      const files = ctx.request.files || ctx.request.body?.files || [];

      // Обрабатываем как массив, так и одиночный файл
      const fileArray = Array.isArray(files) ? files : [files];

      for (const file of fileArray) {
        if (!file) continue;

        const filename = file.name || file.filename || '';
        const mimeType = file.type || file.mime || '';

        // Проверка расширения файла
        if (!isValidExtension(filename)) {
          strapi.log.warn(`Blocked file upload: invalid extension - ${filename}`);
          return ctx.badRequest(
            `Недопустимый тип файла. Разрешенные расширения: ${allowedExtensions.join(', ')}`
          );
        }

        // Проверка MIME типа
        if (mimeType && !isValidMimeType(mimeType)) {
          strapi.log.warn(`Blocked file upload: invalid MIME type - ${mimeType} for ${filename}`);
          return ctx.badRequest(
            `Недопустимый MIME тип файла. Разрешенные типы: ${allowedMimeTypes.join(', ')}`
          );
        }

        // Дополнительная проверка: расширение должно соответствовать MIME типу
        if (mimeType) {
          const ext = getFileExtension(filename);
          const mimeExtMap = {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'image/webp': ['.webp'],
            'image/svg+xml': ['.svg'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          };

          const expectedExts = mimeExtMap[mimeType.toLowerCase()];
          if (expectedExts && !expectedExts.includes(ext)) {
            strapi.log.warn(
              `Blocked file upload: MIME type mismatch - ${mimeType} vs ${ext} for ${filename}`
            );
            return ctx.badRequest('Несоответствие MIME типа и расширения файла');
          }
        }
      }
    }

    await next();
  };
};
