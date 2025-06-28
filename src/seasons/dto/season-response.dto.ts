import { ApiProperty } from '@nestjs/swagger';
import { Season } from '../season.entity';

export class SeasonResponseDto {
  @ApiProperty({ description: 'Список сезонов', type: [Season] })
  seasons: Season[];

  @ApiProperty({ description: 'Общее количество сезонов', example: 25 })
  total: number;

  @ApiProperty({ description: 'Номер текущей страницы', example: 1 })
  page: number;

  @ApiProperty({ description: 'Количество элементов на странице', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Общее количество страниц', example: 3 })
  totalPages: number;

  @ApiProperty({ description: 'Есть ли следующая страница', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Есть ли предыдущая страница', example: false })
  hasPrev: boolean;
} 