import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TournamentStatus } from '../tournament.entity';

export class GetAllTournamentsQueryDto {
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
    description: 'Поиск по названию турнира (частичное совпадение)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Фильтр по статусу', 
    enum: TournamentStatus, 
    required: false 
  })
  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;

  @ApiProperty({ 
    description: 'Фильтр по ID клуба', 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  clubId?: number;

  @ApiProperty({ 
    description: 'Фильтр по ID судьи', 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  refereeId?: number;

  @ApiProperty({ 
    description: 'Сортировка по полю', 
    default: 'date', 
    required: false 
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'date';

  @ApiProperty({ 
    description: 'Порядок сортировки', 
    default: 'DESC', 
    enum: ['ASC', 'DESC'], 
    required: false 
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class TournamentDto {
  @ApiProperty({ description: 'ID турнира' })
  id: number;

  @ApiProperty({ description: 'Название турнира' })
  name: string;

  @ApiProperty({ description: 'Описание турнира' })
  description?: string;

  @ApiProperty({ description: 'Дата проведения турнира' })
  date: Date;

  @ApiProperty({ description: 'Статус турнира' })
  status: string;

  @ApiProperty({ description: 'ID клуба' })
  clubId: number;

  @ApiProperty({ description: 'Название клуба' })
  clubName: string;

  @ApiProperty({ description: 'Логотип клуба' })
  clubLogo?: string;

  @ApiProperty({ description: 'ID судьи' })
  refereeId: number;

  @ApiProperty({ description: 'Имя судьи' })
  refereeName: string;

  @ApiProperty({ description: 'Email судьи' })
  refereeEmail: string;

  @ApiProperty({ description: 'Количество игр в турнире' })
  gamesCount: number;

  @ApiProperty({ description: 'Дата создания турнира' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления турнира' })
  updatedAt: Date;
}

export class GetAllTournamentsResponseDto {
  @ApiProperty({ description: 'Список турниров', type: [TournamentDto] })
  tournaments: TournamentDto[];

  @ApiProperty({ description: 'Общее количество турниров' })
  total: number;

  @ApiProperty({ description: 'Текущая страница' })
  page: number;

  @ApiProperty({ description: 'Количество элементов на странице' })
  limit: number;

  @ApiProperty({ description: 'Общее количество страниц' })
  totalPages: number;
} 