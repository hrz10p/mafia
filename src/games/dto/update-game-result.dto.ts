import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsEnum, Min, Max, IsArray } from 'class-validator';
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
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  points: number;

  @ApiProperty({
    description: 'Дополнительные баллы',
    example: 2,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonusPoints?: number;

  @ApiProperty({
    description: 'Вычеты баллов',
    example: 1,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
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