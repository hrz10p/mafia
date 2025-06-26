import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto, UpdateTournamentDto } from './dto';
import { Tournament, TournamentStatus } from './tournament.entity';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../users/user.entity';
import { ApiRoles } from '../common/decorators/api-roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('Tournaments - Управление турнирами')
@Controller('tournaments')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Создать новый турнир')
  @ApiResponse({ status: 201, description: 'Турнир успешно создан', type: Tournament })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Клуб или судья не найден' })
  create(@Body() createTournamentDto: CreateTournamentDto, @Request() req: { user: User }) {
    return this.tournamentsService.create(createTournamentDto, req.user);
  }

  @Get()
  @Roles(UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiRoles([UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN], 'Получить список турниров')
  @ApiResponse({ status: 200, description: 'Список турниров', type: [Tournament] })
  @ApiQuery({ name: 'clubId', required: false, description: 'ID клуба для фильтрации' })
  findAll(@Query('clubId') clubId?: string) {
    return this.tournamentsService.findAll(clubId ? parseInt(clubId) : undefined);
  }

  @Get(':id')
  @Roles(UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiRoles([UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN], 'Получить турнир по ID')
  @ApiResponse({ status: 200, description: 'Турнир найден', type: Tournament })
  @ApiResponse({ status: 404, description: 'Турнир не найден' })
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Обновить турнир')
  @ApiResponse({ status: 200, description: 'Турнир обновлен', type: Tournament })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Турнир не найден' })
  update(
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
    @Request() req: { user: User }
  ) {
    return this.tournamentsService.update(+id, updateTournamentDto, req.user);
  }

  @Patch(':id/status')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Обновить статус турнира')
  @ApiResponse({ status: 200, description: 'Статус турнира обновлен', type: Tournament })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Турнир не найден' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TournamentStatus,
    @Request() req: { user: User }
  ) {
    return this.tournamentsService.updateStatus(+id, status, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Удалить турнир')
  @ApiResponse({ status: 200, description: 'Турнир удален' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Турнир не найден' })
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.tournamentsService.remove(+id, req.user);
  }
} 