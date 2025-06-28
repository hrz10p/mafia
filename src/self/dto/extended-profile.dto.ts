import { ApiProperty } from '@nestjs/swagger';

export class ClubInfoDto {
  @ApiProperty({ description: 'ID клуба' })
  id: number;

  @ApiProperty({ description: 'Название клуба' })
  name: string;

  @ApiProperty({ description: 'Логотип клуба' })
  logo?: string;

  @ApiProperty({ description: 'Описание клуба' })
  description?: string;

  @ApiProperty({ description: 'Город клуба' })
  city?: string;

  @ApiProperty({ description: 'Статус клуба (PENDING, APPROVED, REJECTED)' })
  status: string;

  @ApiProperty({ 
    description: 'Роль пользователя в клубе',
    enum: ['owner', 'administrator', 'member'],
    example: 'owner'
  })
  userRole: 'owner' | 'administrator' | 'member';

  @ApiProperty({ description: 'Дата создания клуба' })
  joinedAt: Date;

  @ApiProperty({ description: 'Ссылка на социальные сети клуба' })
  socialMediaLink?: string;
}

export class ExtendedUserProfileDto {
  @ApiProperty({ description: 'ID пользователя' })
  id: number;

  @ApiProperty({ description: 'Email пользователя' })
  email: string;

  @ApiProperty({ description: 'Никнейм пользователя' })
  nickname: string;

  @ApiProperty({ description: 'Аватар пользователя' })
  avatar?: string;

  @ApiProperty({ 
    description: 'Роль пользователя в системе',
    enum: ['player', 'judge', 'club_admin', 'club_owner', 'admin']
  })
  role: string;

  @ApiProperty({ description: 'Подтвержден ли email' })
  confirmed: boolean;

  @ApiProperty({ 
    description: 'Информация о клубе (если пользователь состоит в клубе)',
    type: ClubInfoDto,
    required: false
  })
  club?: ClubInfoDto;

  @ApiProperty({ description: 'Общее количество игр' })
  totalGames: number;

  @ApiProperty({ description: 'Общее количество побед' })
  totalWins: number;

  @ApiProperty({ description: 'Общее количество очков' })
  totalPoints: number;

  @ApiProperty({ description: 'Общее количество убийств' })
  totalKills: number;

  @ApiProperty({ description: 'Общее количество смертей' })
  totalDeaths: number;

  @ApiProperty({ description: 'Игр за мафию' })
  mafiaGames: number;

  @ApiProperty({ description: 'Побед за мафию' })
  mafiaWins: number;

  @ApiProperty({ description: 'Игр за гражданского' })
  citizenGames: number;

  @ApiProperty({ description: 'Побед за гражданского' })
  citizenWins: number;

  @ApiProperty({ description: 'Дата регистрации' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата последнего обновления' })
  updatedAt: Date;
} 