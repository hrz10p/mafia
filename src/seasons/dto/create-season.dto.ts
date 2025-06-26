import { IsString, IsDateString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSeasonDto {
  @ApiProperty({ description: 'Название сезона' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Описание сезона' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Дата начала сезона' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Дата окончания сезона' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'ID клуба' })
  @IsNumber()
  clubId: number;

  @ApiProperty({ description: 'ID судьи' })
  @IsNumber()
  refereeId: number;
} 