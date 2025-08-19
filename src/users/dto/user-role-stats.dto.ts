import { ApiProperty } from '@nestjs/swagger';
import { PlayerRole } from '../../games/game-player.entity';

export class UserRoleStatsDto {
  @ApiProperty({ description: 'ID записи статистики' })
  id: number;

  @ApiProperty({ description: 'Роль игрока', enum: PlayerRole })
  role: PlayerRole;

  @ApiProperty({ description: 'Количество сыгранных игр в этой роли' })
  gamesPlayed: number;

  @ApiProperty({ description: 'Количество выигранных игр в этой роли' })
  gamesWon: number;

  @ApiProperty({ description: 'Дата создания записи' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата последнего обновления' })
  updatedAt: Date;
}

export class UserDetailedStatsDto {
  @ApiProperty({ description: 'ID пользователя' })
  id: number;

  @ApiProperty({ description: 'Никнейм пользователя' })
  nickname: string;

  @ApiProperty({ description: 'Общая статистика' })
  generalStats: {
    totalGames: number;
    totalWins: number;
    totalPoints: number;
    eloRating: number;
    totalBonusPoints: number;
  };

  @ApiProperty({ description: 'Статистика по ролям', type: [UserRoleStatsDto] })
  roleStats: UserRoleStatsDto[];
}
