import { IsString, IsDateString, IsOptional, IsNumber, IsEnum, Min, Max, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentType } from '../tournament.entity';

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

  @ApiProperty({ 
    description: 'Тип турнира', 
    enum: TournamentType,
    default: TournamentType.DEFAULT
  })
  @IsEnum(TournamentType)
  type: TournamentType;

  @ApiPropertyOptional({ 
    description: 'Звездность турнира (от 1 до 6, только для ELO турниров)',
    minimum: 1,
    maximum: 6
  })
  @ValidateIf(o => o.type === TournamentType.ELO)
  @IsNumber()
  @Min(1)
  @Max(6)
  stars?: number;

  @ApiPropertyOptional({ description: 'ID клуба (необязательно для ELO турниров)' })
  @IsOptional()
  @IsNumber()
  clubId?: number;

  @ApiProperty({ description: 'ID судьи' })
  @IsNumber()
  refereeId: number;
} 