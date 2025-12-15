module.exports = ({ env }) => ({
  'users-permissions': {
    enabled: true,
    config: {
      jwt: {
        expiresIn: '7d',
      },
    },
  },
  // Upload plugin configuration
  upload: {
    config: {
      providerOptions: {
        localServer: {
          maxage: 300000,
        },
      },
      sizeLimit: 250 * 1024 * 1024,
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64,
      },
      // Дополнительная валидация файлов для защиты от обхода whitelist
      allowedFileTypes: [
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
      ],
      // Проверка расширений файлов
      allowedExtensions: [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx',
      ],
    },
  },
  // Email plugin configuration
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.yandex.ru'),
        port: env.int('SMTP_PORT', 465),
        auth: {
          user: env('SMTP_USERNAME', 'centertkani-shop@yandex.com'),
          pass: env('SMTP_PASSWORD'),
        },
        secure: env.bool('SMTP_SECURE', true),
        requireTLS: env.bool('SMTP_TLS', true),
      },
      settings: {
        defaultFrom: 'centertkani-shop@yandex.com',
        defaultReplyTo: 'centertkani-shop@yandex.com',
      },
    },
  },
  // Delivery plugin configuration
  // delivery: {
  //   enabled: true,
  //   resolve: './src/plugins/delivery',
  //   config: {
  //     providers: {
  //       cdek: {
  //         account: env('CDEK_ACCOUNT'),
  //         securePassword: env('CDEK_SECURE_PASSWORD'),
  //         apiUrl: env('CDEK_API_URL', 'https://api.cdek.ru/v2'),
  //       },
  //       russianPost: {
  //         apiUrl: env('RUSSIAN_POST_API_URL', 'https://otpravka-api.pochta.ru'),
  //         token: env('RUSSIAN_POST_TOKEN'),
  //         key: env('RUSSIAN_POST_KEY'),
  //       },
  //     },
  //   },
  // },
  // Payments plugin
  // payments: {
  //   enabled: true,
  //   resolve: './src/plugins/payments',
  //   config: {
  //     providers: {
  //       yookassa: {
  //         shopId: env('YOOMONEY_SHOP_ID'),
  //         apiKey: env('YOOMONEY_SECRET_KEY'),
  //       },
  //       cloudpayments: {
  //         publicId: env('CLOUDPAYMENTS_PUBLIC_ID'),
  //         apiKey: env('CLOUDPAYMENTS_API_KEY'),
  //       },
  //     },
  //   },
  // },
  // Orders plugin
  orders: {
    enabled: true,
    resolve: './src/plugins/orders',
  },
  // SEO plugin
  seo: {
    enabled: true,
    resolve: './src/plugins/seo',
  },
  // Audit log plugin
  'audit-log': {
    enabled: true,
    resolve: './src/plugins/audit-log',
  },
});
