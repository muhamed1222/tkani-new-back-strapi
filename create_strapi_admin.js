#!/usr/bin/env node
/**
 * Скрипт для создания администратора в Strapi
 * Использование: node create_strapi_admin.js
 */

const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('==========================================');
  console.log('👤 Создание администратора Strapi');
  console.log('==========================================');
  console.log('');

  try {
    // Проверка доступности Strapi
    await axios.get(`${STRAPI_URL}/admin`);
    console.log('✅ Strapi доступен');
  } catch (error) {
    console.log('❌ Strapi недоступен. Убедитесь, что Strapi запущен на', STRAPI_URL);
    process.exit(1);
  }

  // Запрашиваем данные
  const username = await question('Имя пользователя: ');
  const email = await question('Email: ');
  const password = await question('Пароль (минимум 8 символов): ');
  const firstname = await question('Имя: ') || username;
  const lastname = await question('Фамилия: ') || '';

  if (!username || !email || !password) {
    console.log('❌ Все поля обязательны!');
    rl.close();
    process.exit(1);
  }

  if (password.length < 8) {
    console.log('❌ Пароль должен быть минимум 8 символов!');
    rl.close();
    process.exit(1);
  }

  console.log('');
  console.log('⏳ Создание администратора...');

  try {
    // Создание администратора через API
    const response = await axios.post(`${STRAPI_URL}/admin/users`, {
      email,
      username,
      password,
      firstname,
      lastname,
      isActive: true,
      roles: [1] // ID роли Super Admin
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('');
    console.log('✅ Администратор успешно создан!');
    console.log('');
    console.log('📝 Данные для входа:');
    console.log(`   Email: ${email}`);
    console.log(`   Пароль: ${password}`);
    console.log('');
    console.log(`🌐 Войдите в админ-панель: ${STRAPI_URL}/admin`);

  } catch (error) {
    if (error.response) {
      console.log('');
      console.log('❌ Ошибка при создании администратора:');
      console.log('   Статус:', error.response.status);
      console.log('   Сообщение:', error.response.data?.error?.message || error.response.data?.message || JSON.stringify(error.response.data));
      
      if (error.response.status === 401) {
        console.log('');
        console.log('💡 Возможно, нужна авторизация. Попробуйте создать администратора через веб-интерфейс:');
        console.log(`   ${STRAPI_URL}/admin`);
      }
    } else {
      console.log('');
      console.log('❌ Ошибка:', error.message);
    }
  }

  rl.close();
}

createAdmin();


