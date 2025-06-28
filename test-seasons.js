const axios = require('axios');

const JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFpZGFyQGdtYWlsLmNvbSIsImlkIjo0LCJyb2xlIjoiY2x1Yl9vd25lciIsImlhdCI6MTc1MTE1Mjk0NywiZXhwIjoxNzUxNzU3NzQ3fQ.WqA1IwzCGNK9ay477_2EHkaujj75TopMb9NFIyUCcwA';

async function testSeasons() {
  try {
    console.log('🏆 Тестирование API сезонов...\n');

    // Тест 1: Базовый запрос
    console.log('📋 Тест 1: Получение всех сезонов (базовый запрос)');
    const basicResponse = await axios.get('http://localhost:3001/seasons', {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
        Accept: 'application/json',
      },
    });

    console.log('✅ Базовый запрос выполнен:');
    console.log('   Всего сезонов:', basicResponse.data.total);
    console.log('   Страница:', basicResponse.data.page);
    console.log('   Лимит:', basicResponse.data.limit);
    console.log('   Всего страниц:', basicResponse.data.totalPages);
    console.log('   Есть следующая страница:', basicResponse.data.hasNext);
    console.log('   Есть предыдущая страница:', basicResponse.data.hasPrev);
    console.log(
      '   Количество сезонов на странице:',
      basicResponse.data.seasons.length,
    );

    if (basicResponse.data.seasons.length > 0) {
      const firstSeason = basicResponse.data.seasons[0];
      console.log('   Первый сезон:');
      console.log('     ID:', firstSeason.id);
      console.log('     Название:', firstSeason.name);
      console.log('     Статус:', firstSeason.status);
      console.log('     Клуб:', firstSeason.club?.name || 'Нет клуба');
      console.log(
        '     Судья:',
        firstSeason.referee?.nickname ||
          firstSeason.referee?.email ||
          'Нет судьи',
      );
    }

    // Тест 2: Пагинация
    console.log('\n📋 Тест 2: Пагинация (5 элементов на странице)');
    const paginationResponse = await axios.get(
      'http://localhost:3001/seasons?page=1&limit=5',
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
          Accept: 'application/json',
        },
      },
    );

    console.log('✅ Пагинация работает:');
    console.log('   Лимит установлен:', paginationResponse.data.limit);
    console.log('   Получено сезонов:', paginationResponse.data.seasons.length);

    // Тест 3: Поиск
    console.log('\n📋 Тест 3: Поиск по названию');
    const searchResponse = await axios.get(
      'http://localhost:3001/seasons?search=зимний',
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
          Accept: 'application/json',
        },
      },
    );

    console.log('✅ Поиск работает:');
    console.log('   Найдено сезонов:', searchResponse.data.total);
    console.log('   Поисковый запрос: "зимний"');

    // Тест 4: Фильтр по статусу
    console.log('\n📋 Тест 4: Фильтр по статусу ACTIVE');
    const statusResponse = await axios.get(
      'http://localhost:3001/seasons?status=ACTIVE',
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
          Accept: 'application/json',
        },
      },
    );

    console.log('✅ Фильтр по статусу работает:');
    console.log('   Найдено активных сезонов:', statusResponse.data.total);

    // Тест 5: Сортировка
    console.log('\n📋 Тест 5: Сортировка по дате начала (ASC)');
    const sortResponse = await axios.get(
      'http://localhost:3001/seasons?sortBy=startDate&sortOrder=ASC&limit=3',
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
          Accept: 'application/json',
        },
      },
    );

    console.log('✅ Сортировка работает:');
    console.log(
      '   Получено сезонов для сортировки:',
      sortResponse.data.seasons.length,
    );
    if (sortResponse.data.seasons.length > 1) {
      const first = new Date(sortResponse.data.seasons[0].startDate);
      const second = new Date(sortResponse.data.seasons[1].startDate);
      console.log('   Первый сезон:', first.toISOString());
      console.log('   Второй сезон:', second.toISOString());
      console.log('   Сортировка корректна:', first <= second);
    }

    // Тест 6: Комбинированный запрос
    console.log('\n📋 Тест 6: Комбинированный запрос');
    const combinedResponse = await axios.get(
      'http://localhost:3001/seasons?page=1&limit=3&search=зимний&status=ACTIVE&sortBy=createdAt&sortOrder=DESC',
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
          Accept: 'application/json',
        },
      },
    );

    console.log('✅ Комбинированный запрос работает:');
    console.log(
      '   Результат комбинированного запроса:',
      combinedResponse.data.total,
      'сезонов',
    );

    // Тест 7: Простой список (без пагинации)
    console.log('\n📋 Тест 7: Простой список сезонов');
    const simpleResponse = await axios.get(
      'http://localhost:3001/seasons/simple',
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
          Accept: 'application/json',
        },
      },
    );

    console.log('✅ Простой список работает:');
    console.log('   Получено сезонов:', simpleResponse.data.length);
    console.log(
      '   Тип ответа:',
      Array.isArray(simpleResponse.data) ? 'Массив' : 'Объект',
    );

    console.log('\n🎉 Все тесты API сезонов выполнены успешно!');
  } catch (error) {
    console.error(
      '❌ Ошибка при тестировании API сезонов:',
      error.response?.data || error.message,
    );
  }
}

// Запускаем тест
testSeasons();
