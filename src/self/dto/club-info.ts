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

  @ApiProperty({ 
    description: 'ELO рейтинг клуба (среднее значение всех участников)',
    example: 1500
  })
  elo: number;
}

