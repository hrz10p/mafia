import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../common/enums/roles.enum';

export class GetAllPlayersQueryDto {
  @ApiProperty({ 
    description: 'Номер страницы', 
    default: 1, 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Количество элементов на странице', 
    default: 10, 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ 
    description: 'Поиск по никнейму (частичное совпадение)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Фильтр по роли', 
    enum: UserRole, 
    required: false 
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ 
    description: 'Сортировка по полю', 
    default: 'nickname', 
    required: false 
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'nickname';

  @ApiProperty({ 
    description: 'Порядок сортировки', 
    default: 'ASC', 
    enum: ['ASC', 'DESC'], 
    required: false 
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class PlayerDto {
  @ApiProperty({ description: 'ID игрока' })
  id: number;

  @ApiProperty({ description: 'Email игрока' })
  email: string;

  @ApiProperty({ description: 'Никнейм игрока' })
  nickname: string;

  @ApiProperty({ description: 'Аватар игрока' })
  avatar?: string;

  @ApiProperty({ description: 'Роль игрока' })
  role: string;

  @ApiProperty({ description: 'Подтвержден ли email' })
  confirmed: boolean;

  @ApiProperty({ description: 'Название клуба (если есть)' })
  clubName?: string;

  @ApiProperty({ description: 'Общее количество игр' })
  totalGames: number;

  @ApiProperty({ description: 'Общее количество побед' })
  totalWins: number;

  @ApiProperty({ description: 'Общее количество очков' })
  totalPoints: number;

  // ELO rating system
  @ApiProperty({ description: 'ELO рейтинг', default: 0 })
  eloRating: number;

  // Additional points
  @ApiProperty({ description: 'Общее количество бонусных очков' })
  totalBonusPoints: number;

  @ApiProperty({ description: 'Дата регистрации' })
  createdAt: Date;
}

export class GetAllPlayersResponseDto {
  @ApiProperty({ description: 'Список игроков', type: [PlayerDto] })
  players: PlayerDto[];

  @ApiProperty({ description: 'Общее количество игроков' })
  total: number;

  @ApiProperty({ description: 'Текущая страница' })
  page: number;

  @ApiProperty({ description: 'Количество элементов на странице' })
  limit: number;

  @ApiProperty({ description: 'Общее количество страниц' })
  totalPages: number;
} 