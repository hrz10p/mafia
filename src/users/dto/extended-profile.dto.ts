import { ApiProperty } from '@nestjs/swagger';
import { ClubInfoDto } from '../../self/dto/club-info';
import { UserRoleStatsDto } from './user-role-stats.dto';

export class ExtendedUserProfileDto {
    @ApiProperty({ description: 'ID пользователя' })
    id: number;
  
    @ApiProperty({ description: 'Email пользователя' })
    email: string;
  
    @ApiProperty({ description: 'Никнейм пользователя' })
    nickname: string;
  
    @ApiProperty({ description: 'Аватар пользователя' })
    avatar?: string;
  
    @ApiProperty({ 
      description: 'Роль пользователя в системе',
      enum: ['player', 'judge', 'club_admin', 'club_owner', 'admin']
    })
    role: string;
  
    @ApiProperty({ description: 'Подтвержден ли email' })
    confirmed: boolean;
  
    @ApiProperty({ 
      description: 'Информация о клубе (если пользователь состоит в клубе)',
      type: ClubInfoDto,
      required: false
    })
    club?: ClubInfoDto;
  
    @ApiProperty({ description: 'Общее количество игр' })
    totalGames: number;
  
    @ApiProperty({ description: 'Общее количество побед' })
    totalWins: number;
  
    @ApiProperty({ description: 'Общее количество очков' })
    totalPoints: number;
  
    // ELO rating system
    @ApiProperty({ description: 'ELO рейтинг', default: 0 })
    eloRating: number;
  
    // Additional points
    @ApiProperty({ description: 'Общее количество бонусных очков' })
    totalBonusPoints: number;

    @ApiProperty({ description: 'Общее количество турниров, в которых принял участие' })
    tournamentsParticipated: number;
  
    @ApiProperty({ 
      description: 'Статистика по ролям игрока',
      type: [UserRoleStatsDto],
      required: false
    })
    roleStats?: UserRoleStatsDto[];
  
    @ApiProperty({ description: 'Дата регистрации' })
    createdAt: Date;
  
    @ApiProperty({ description: 'Дата последнего обновления' })
    updatedAt: Date;
  } 