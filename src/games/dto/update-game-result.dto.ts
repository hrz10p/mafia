import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { PlayerRole } from '../game-player.entity';

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

  @ApiProperty({
    description: 'Заметки о игроке',
    example: 'Хорошо играл в команде',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateGameResultDto {
  @ApiProperty({
    description: 'Результат игры',
    example: 'Победа мафии',
    required: false,
  })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiProperty({
    description: 'Таблица результатов',
    example: 'Детальная таблица результатов',
    required: false,
  })
  @IsOptional()
  @IsString()
  resultTable?: string;

  @ApiProperty({
    description: 'Массив результатов игроков',
    type: [UpdateGamePlayerResultDto],
  })
  @IsArray()
  playerResults: UpdateGamePlayerResultDto[];
} 