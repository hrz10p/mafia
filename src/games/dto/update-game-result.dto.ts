import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { PlayerRole } from '../game-player.entity';
import { GameResult } from '../game.entity';

export class UpdateGamePlayerResultDto {
  @ApiProperty({
    description: 'ID игрока',
    example: 1,
  })
  @IsNumber()
  playerId: number;

  @ApiProperty({
    description: 'Роль игрока в игре',
    enum: PlayerRole,
    example: PlayerRole.MAFIA,
  })
  @IsEnum(PlayerRole)
  role: PlayerRole;

  @ApiProperty({
    description: 'Баллы игрока',
    example: 10.5,
  })
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  points: number;

  @ApiPropertyOptional({
    description: 'LH очки',
    example: 1.5,
    required: false,
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  lh?: number;

  @ApiPropertyOptional({
    description: 'CI очки',
    example: 1.0,
    required: false,
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  ci?: number;

  @ApiProperty({
    description: 'Дополнительные баллы',
    example: 2.25,
    required: false,
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  bonusPoints?: number;

  @ApiProperty({
    description: 'Вычеты баллов',
    example: 1.75,
    required: false,
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  penaltyPoints?: number;

}

export class UpdateGameResultDto {
  @ApiProperty({
    description: 'Результат игры',
    enum: GameResult,
    example: GameResult.MAFIA_WIN,
    required: false,
  })
  @IsOptional()
  @IsEnum(GameResult)
  result?: GameResult;

  @ApiProperty({
    description: 'Массив результатов игроков',
    type: [UpdateGamePlayerResultDto],
  })
  @IsArray()
  playerResults: UpdateGamePlayerResultDto[];
} 