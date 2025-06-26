import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { SeasonRatingDto, TournamentRatingDto } from '../common/dto';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { ApiRoles } from '../common/decorators/api-roles.decorator';

@ApiTags('Ratings - Рейтинги игроков')
@Controller('ratings')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get('seasons/:id')
  @Roles(UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiRoles([UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN], 'Получить рейтинг сезона')
  @ApiParam({ name: 'id', type: 'number', description: 'ID сезона' })
  @ApiResponse({ status: 200, description: 'Рейтинг сезона получен', type: SeasonRatingDto })
  @ApiResponse({ status: 404, description: 'Сезон не найден' })
  @ApiOperation({ summary: 'Получить рейтинг игроков по сезону' })
  async getSeasonRating(@Param('id') seasonId: string): Promise<SeasonRatingDto> {
    return this.ratingsService.getSeasonRating(+seasonId);
  }

  @Get('tournaments/:id')
  @Roles(UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiRoles([UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN], 'Получить рейтинг турнира')
  @ApiParam({ name: 'id', type: 'number', description: 'ID турнира' })
  @ApiResponse({ status: 200, description: 'Рейтинг турнира получен', type: TournamentRatingDto })
  @ApiResponse({ status: 404, description: 'Турнир не найден' })
  @ApiOperation({ summary: 'Получить рейтинг игроков по турниру' })
  async getTournamentRating(@Param('id') tournamentId: string): Promise<TournamentRatingDto> {
    return this.ratingsService.getTournamentRating(+tournamentId);
  }
} 