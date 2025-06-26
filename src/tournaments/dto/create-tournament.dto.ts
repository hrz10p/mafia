import { IsString, IsDateString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTournamentDto {
  @ApiProperty({ description: 'Название турнира' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Описание турнира' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Дата проведения турнира' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'ID клуба' })
  @IsNumber()
  clubId: number;

  @ApiProperty({ description: 'ID судьи' })
  @IsNumber()
  refereeId: number;
} 