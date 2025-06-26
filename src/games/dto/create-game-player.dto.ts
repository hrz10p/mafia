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
    example: 10
  })
  @IsOptional()
  @IsNumber()
  points?: number;

  @ApiPropertyOptional({ 
    description: 'Количество убийств', 
    default: 0,
    example: 2
  })
  @IsOptional()
  @IsNumber()
  kills?: number;

  @ApiPropertyOptional({ 
    description: 'Количество смертей', 
    default: 0,
    example: 0
  })
  @IsOptional()
  @IsNumber()
  deaths?: number;

  @ApiPropertyOptional({ 
    description: 'Заметки',
    example: 'Отличная игра, хорошо читал людей'
  })
  @IsOptional()
  @IsString()
  notes?: string;
} 