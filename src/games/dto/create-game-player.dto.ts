import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlayerRole } from '../game-player.entity';

export class CreateGamePlayerDto {
  @ApiProperty({ 
    description: 'ID игрока',
    example: 1
  })
  @IsNumber()
  playerId: number;

  @ApiProperty({ 
    description: 'Роль игрока', 
    enum: PlayerRole,
    example: PlayerRole.MAFIA
  })
  @IsEnum(PlayerRole)
  role: PlayerRole;

  @ApiPropertyOptional({ 
    description: 'Очки игрока', 
    default: 0,
    example: 10.5
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  points?: number;

  @ApiPropertyOptional({ 
    description: 'LH очки', 
    default: 0,
    example: 1.5
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  lh?: number;

  @ApiPropertyOptional({ 
    description: 'CI очки', 
    default: 0,
    example: 1.0
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  ci?: number;

  @ApiPropertyOptional({ 
    description: 'Дополнительные баллы', 
    default: 0,
    example: 2.25
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  bonusPoints?: number;

  @ApiPropertyOptional({ 
    description: 'Вычеты баллов', 
    default: 0,
    example: 1.75
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  penaltyPoints?: number;

  @ApiPropertyOptional({ 
    description: 'Заметки',
    example: 'Отличная игра, хорошо читал людей'
  })
  @IsOptional()
  @IsString()
  notes?: string;
} 