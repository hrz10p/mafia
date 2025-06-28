const axios = require('axios');

const JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFpZGFyQGdtYWlsLmNvbSIsImlkIjo0LCJyb2xlIjoiY2x1Yl9vd25lciIsImlhdCI6MTc1MTE1Mjk0NywiZXhwIjoxNzUxNzU3NzQ3fQ.WqA1IwzCGNK9ay477_2EHkaujj75TopMb9NFIyUCcwA';

async function testProfile() {
  try {
    console.log(
      '🔍 Тестирование профиля пользователя с информацией о клубе...\n',
    );

    // Тест: Получение профиля с информацией о клубе
    console.log('📋 Тест: Получение профиля пользователя');
    const profile = await axios.get('http://localhost:3001/self/profile', {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
        Accept: 'application/json',
      },
    });

    console.log('✅ Профиль получен:');
    console.log('   ID:', profile.data.id);
    console.log('   Email:', profile.data.email);
    console.log('   Никнейм:', profile.data.nickname);
    console.log('   Роль в системе:', profile.data.role);
    console.log('   Подтвержден:', profile.data.confirmed);

    if (profile.data.club) {
      console.log('   🏢 Информация о клубе:');
      console.log('     ID клуба:', profile.data.club.id);
      console.log('     Название:', profile.data.club.name);
      console.log('     Город:', profile.data.club.city);
      console.log('     Статус:', profile.data.club.status);
      console.log('     Роль в клубе:', profile.data.club.userRole);
      console.log('     Дата создания:', profile.data.club.joinedAt);
      if (profile.data.club.socialMediaLink) {
        console.log('     Соц. сети:', profile.data.club.socialMediaLink);
      }
    } else {
      console.log('   ❌ Пользователь не состоит в клубе');
    }

    console.log('   📊 Статистика игрока:');
    console.log('     Всего игр:', profile.data.totalGames);
    console.log('     Побед:', profile.data.totalWins);
    console.log('     Очков:', profile.data.totalPoints);
    console.log('     Убийств:', profile.data.totalKills);
    console.log('     Смертей:', profile.data.totalDeaths);
    console.log('     Игр за мафию:', profile.data.mafiaGames);
    console.log('     Побед за мафию:', profile.data.mafiaWins);
    console.log('     Игр за гражданского:', profile.data.citizenGames);
    console.log('     Побед за гражданского:', profile.data.citizenWins);
  } catch (error) {
    console.error(
      '❌ Ошибка при тестировании:',
      error.response?.data || error.message,
    );
  }
}

// Запускаем тест
testProfile();
