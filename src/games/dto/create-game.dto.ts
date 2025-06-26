import { IsString, IsDateString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameResult } from '../game.entity';
import { CreateGamePlayerDto } from './create-game-player.dto';

export class CreateGameDto {
  @ApiProperty({ 
    description: 'Название игры',
    example: 'Игра #1 - Мафия против Горожан'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    description: 'Описание игры',
    example: 'Классическая игра в мафию с 10 игроками'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Дата проведения игры',
    example: '2024-01-15T18:00:00Z'
  })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ 
    description: 'ID клуба',
    example: 1
  })
  @IsNumber()
  clubId: number;

  @ApiPropertyOptional({ 
    description: 'ID сезона (взаимоисключающий с tournamentId)',
    example: 1
  })
  @ValidateIf(o => !o.tournamentId)
  @IsOptional()
  @IsNumber()
  seasonId?: number;

  @ApiPropertyOptional({ 
    description: 'ID турнира (взаимоисключающий с seasonId)',
    example: 1
  })
  @ValidateIf(o => !o.seasonId)
  @IsOptional()
  @IsNumber()
  tournamentId?: number;

  @ApiProperty({ 
    description: 'Результат игры', 
    enum: GameResult,
    example: GameResult.MAFIA_WIN
  })
  @IsEnum(GameResult)
  result: GameResult;

  @ApiPropertyOptional({ 
    description: 'JSON таблица результатов',
    example: { 'round1': 'mafia_kill', 'round2': 'citizen_vote' }
  })
  @IsOptional()
  resultTable?: any;

  @ApiProperty({ 
    description: 'Список игроков с результатами', 
    type: [CreateGamePlayerDto],
    isArray: true,
    example: [
      {
        playerId: 1,
        role: 'MAFIA',
        points: 10,
        kills: 2,
        deaths: 0,
        notes: 'Отличная игра'
      },
      {
        playerId: 2,
        role: 'CITIZEN',
        points: 5,
        kills: 0,
        deaths: 1,
        notes: 'Погиб в первом раунде'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGamePlayerDto)
  players: CreateGamePlayerDto[];
} 