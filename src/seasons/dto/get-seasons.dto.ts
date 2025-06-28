import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SeasonStatus } from '../season.entity';

export class GetSeasonsDto {
  @ApiPropertyOptional({ 
    description: 'Номер страницы', 
    example: 1,
    minimum: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Количество элементов на странице', 
    example: 10,
    minimum: 1,
    maximum: 100 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Поиск по названию сезона', 
    example: 'зимний' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Фильтр по статусу сезона',
    enum: SeasonStatus,
    example: SeasonStatus.ACTIVE 
  })
  @IsOptional()
  @IsEnum(SeasonStatus)
  status?: SeasonStatus;

  @ApiPropertyOptional({ 
    description: 'Фильтр по ID клуба', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  clubId?: number;

  @ApiPropertyOptional({ 
    description: 'Фильтр по ID судьи', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  refereeId?: number;

  @ApiPropertyOptional({ 
    description: 'Поле для сортировки',
    example: 'createdAt',
    enum: ['id', 'name', 'startDate', 'endDate', 'status', 'createdAt', 'updatedAt']
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ 
    description: 'Порядок сортировки',
    example: 'DESC',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
} 