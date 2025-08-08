import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray, IsString, Min, Max, ArrayMinSize } from 'class-validator';

export class GenerateGamesDto {
  @ApiProperty({
    description: 'Количество столов',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  tablesCount: number;

  @ApiProperty({
    description: 'Количество туров',
    example: 6,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  roundsCount: number;

  @ApiProperty({
    description: 'Количество игроков в игре',
    example: 10,
    minimum: 6,
    maximum: 12,
  })
  @IsNumber()
  @Min(6)
  @Max(12)
  playersPerGame: number;

  @ApiProperty({
    description: 'Количество игр',
    example: 18,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  totalGames: number;

  @ApiProperty({
    description: 'Массив никнеймов игроков',
    example: ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8', 'player9', 'player10'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  playerNicknames: string[];

  @ApiProperty({
    description: 'ID турнира',
    example: 1,
  })
  @IsNumber()
  tournamentId: number;
}
