import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto, UpdateTournamentDto, GetAllTournamentsQueryDto, GetAllTournamentsResponseDto } from './dto';
import { Tournament, TournamentStatus, TournamentType } from './tournament.entity';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../users/user.entity';
import { ApiRoles } from '../common/decorators/api-roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('Tournaments - Управление турнирами')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @ApiOperation({ 
    summary: 'Получить все турниры',
    description: 'Возвращает список всех турниров с пагинацией, фильтрацией и сортировкой'
  })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: 'Номер страницы', default: 1 })
  @ApiQuery({ name: 'limit', type: 'number', required: false, description: 'Количество элементов на странице', default: 10 })
  @ApiQuery({ name: 'search', type: 'string', required: false, description: 'Поиск по названию турнира (частичное совпадение)' })
  @ApiQuery({ name: 'status', enum: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'], required: false, description: 'Фильтр по статусу' })
  @ApiQuery({ name: 'type', enum: ['DEFAULT', 'ELO'], required: false, description: 'Фильтр по типу турнира' })
  @ApiQuery({ name: 'stars', type: 'number', required: false, description: 'Фильтр по звездности (от 1 до 6)' })
  @ApiQuery({ name: 'clubId', type: 'number', required: false, description: 'Фильтр по ID клуба' })
  @ApiQuery({ name: 'refereeId', type: 'number', required: false, description: 'Фильтр по ID судьи' })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false, description: 'Поле для сортировки', default: 'date' })
  @ApiQuery({ name: 'sortOrder', enum: ['ASC', 'DESC'], required: false, description: 'Порядок сортировки', default: 'DESC' })
  @ApiResponse({ 
    status: 200, 
    description: 'Список турниров успешно получен',
    type: GetAllTournamentsResponseDto
  })
  @ApiResponse({ status: 400, description: 'Некорректные параметры запроса' })
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAllTournaments(@Query() query: GetAllTournamentsQueryDto): Promise<GetAllTournamentsResponseDto> {
    return this.tournamentsService.getAllTournaments(query);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN, UserRole.PLAYER)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Создать новый турнир')
  @ApiResponse({ status: 201, description: 'Турнир успешно создан', type: Tournament })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Клуб или судья не найден' })
  @ApiResponse({ status: 400, description: 'Некорректные параметры турнира' })
  create(@Body() createTournamentDto: CreateTournamentDto, @Request() req: { user: User }) {
    return this.tournamentsService.create(createTournamentDto, req.user);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Турнир найден', type: Tournament })
  @ApiResponse({ status: 404, description: 'Турнир не найден' })
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN, UserRole.PLAYER)
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

  @Patch(':id/complete')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN, UserRole.PLAYER)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Завершить турнир')
  @ApiResponse({ status: 200, description: 'Турнир успешно завершен', type: Tournament })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Турнир не найден' })
  @ApiResponse({ status: 400, description: 'Невозможно завершить турнир с текущим статусом' })
  completeTournament(
    @Param('id') id: string,
    @Request() req: { user: User }
  ) {
    return this.tournamentsService.completeTournament(+id, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN, UserRole.PLAYER)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Удалить турнир')
  @ApiResponse({ status: 200, description: 'Турнир удален' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Турнир не найден' })
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.tournamentsService.remove(+id, req.user);
  }
} 