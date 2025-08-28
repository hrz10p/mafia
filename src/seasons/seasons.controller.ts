import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto, UpdateSeasonDto, GetSeasonsDto, SeasonResponseDto } from './dto';
import { Season, SeasonStatus } from './season.entity';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../users/user.entity';
import { ApiRoles } from '../common/decorators/api-roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('Seasons - Управление сезонами')
@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Создать новый сезон')
  @ApiResponse({ status: 201, description: 'Сезон успешно создан', type: Season })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Клуб или судья не найден' })
  create(@Body() createSeasonDto: CreateSeasonDto, @Request() req: { user: User }) {
    return this.seasonsService.create(createSeasonDto, req.user);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Получить все сезоны',
    description: 'Возвращает список сезонов с пагинацией, фильтрацией и сортировкой. Поддерживает поиск по названию, фильтрацию по статусу, клубу, судье и сортировку по различным полям.'
  })
  @ApiResponse({ status: 200, description: 'Список сезонов получен', type: SeasonResponseDto })
  @ApiQuery({ name: 'page', required: false, description: 'Номер страницы', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Количество элементов на странице', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по названию сезона', example: 'зимний' })
  @ApiQuery({ name: 'status', required: false, description: 'Фильтр по статусу', enum: SeasonStatus })
  @ApiQuery({ name: 'clubId', required: false, description: 'Фильтр по ID клуба', example: 1 })
  @ApiQuery({ name: 'refereeId', required: false, description: 'Фильтр по ID судьи', example: 1 })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Поле для сортировки', example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Порядок сортировки', enum: ['ASC', 'DESC'] })
  getAllSeasons(@Query() query: GetSeasonsDto): Promise<SeasonResponseDto> {
    return this.seasonsService.getAllSeasons(query);
  }

  @Get('simple')
  @ApiResponse({ status: 200, description: 'Список сезонов', type: [Season] })
  @ApiQuery({ name: 'clubId', required: false, description: 'ID клуба для фильтрации' })
  findAll(@Query('clubId') clubId?: string) {
    return this.seasonsService.findAll(clubId ? parseInt(clubId) : undefined);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Сезон найден', type: Season })
  @ApiResponse({ status: 404, description: 'Сезон не найден' })
  findOne(@Param('id') id: string) {
    return this.seasonsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Обновить сезон')
  @ApiResponse({ status: 200, description: 'Сезон обновлен', type: Season })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Сезон не найден' })
  update(
    @Param('id') id: string,
    @Body() updateSeasonDto: UpdateSeasonDto,
    @Request() req: { user: User }
  ) {
    return this.seasonsService.update(+id, updateSeasonDto, req.user);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Обновить статус сезона')
  @ApiResponse({ status: 200, description: 'Статус сезона обновлен', type: Season })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Сезон не найден' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: SeasonStatus,
    @Request() req: { user: User }
  ) {
    return this.seasonsService.updateStatus(+id, status, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Удалить сезон')
  @ApiResponse({ status: 200, description: 'Сезон удален' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Сезон не найден' })
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.seasonsService.remove(+id, req.user);
  }
} 