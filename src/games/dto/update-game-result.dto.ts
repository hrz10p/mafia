import { IsString, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameResult } from '../game.entity';
import { PlayerStatus } from '../game-player.entity';

export class UpdateGamePlayerResultDto {
  @ApiProperty({ description: 'ID игрока' })
  @IsString()
  playerId: number;

  @ApiPropertyOptional({ description: 'Статус игрока' })
  @IsOptional()
  @IsEnum(PlayerStatus)
  status?: PlayerStatus;

  @ApiPropertyOptional({ description: 'Очки игрока' })
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ description: 'Количество убийств' })
  @IsOptional()
  kills?: number;

  @ApiPropertyOptional({ description: 'Количество смертей' })
  @IsOptional()
  deaths?: number;

  @ApiPropertyOptional({ description: 'Заметки' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateGameResultDto {
  @ApiProperty({ description: 'Результат игры' })
  @IsEnum(GameResult)
  result: GameResult;

  @ApiPropertyOptional({ description: 'JSON таблица результатов' })
  @IsOptional()
  resultTable?: any;

  @ApiProperty({ description: 'Результаты игроков' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGamePlayerResultDto)
  playerResults: UpdateGamePlayerResultDto[];
} 