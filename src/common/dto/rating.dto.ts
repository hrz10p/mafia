import { ApiProperty } from '@nestjs/swagger';

export class PlayerRatingDto {
  @ApiProperty({ description: 'ID игрока' })
  playerId: number;

  @ApiProperty({ description: 'Email игрока' })
  email: string;

  @ApiProperty({ description: 'Имя игрока' })
  name: string;

  @ApiProperty({ description: 'Общее количество очков' })
  totalPoints: number;

  @ApiProperty({ description: 'Количество игр' })
  gamesPlayed: number;

  @ApiProperty({ description: 'Среднее количество очков за игру' })
  averagePoints: number;

  @ApiProperty({ description: 'Количество побед' })
  gamesWon: number;

  @ApiProperty({ description: 'Процент побед' })
  winRate: number;

  @ApiProperty({ description: 'Позиция в рейтинге' })
  rank: number;
}

export class SeasonRatingDto {
  @ApiProperty({ description: 'ID сезона' })
  seasonId: number;

  @ApiProperty({ description: 'Название сезона' })
  seasonName: string;

  @ApiProperty({ description: 'Рейтинг игроков', type: [PlayerRatingDto] })
  players: PlayerRatingDto[];
}

export class TournamentRatingDto {
  @ApiProperty({ description: 'ID турнира' })
  tournamentId: number;

  @ApiProperty({ description: 'Название турнира' })
  tournamentName: string;

  @ApiProperty({ description: 'Рейтинг игроков', type: [PlayerRatingDto] })
  players: PlayerRatingDto[];
} 