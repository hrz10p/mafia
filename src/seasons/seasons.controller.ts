import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto, UpdateSeasonDto } from './dto';
import { Season, SeasonStatus } from './season.entity';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../users/user.entity';
import { ApiRoles } from '../common/decorators/api-roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('Seasons - Управление сезонами')
@Controller('seasons')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Post()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Создать новый сезон')
  @ApiResponse({ status: 201, description: 'Сезон успешно создан', type: Season })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Клуб или судья не найден' })
  create(@Body() createSeasonDto: CreateSeasonDto, @Request() req: { user: User }) {
    return this.seasonsService.create(createSeasonDto, req.user);
  }

  @Get()
  @Roles(UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiRoles([UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN], 'Получить список сезонов')
  @ApiResponse({ status: 200, description: 'Список сезонов', type: [Season] })
  @ApiQuery({ name: 'clubId', required: false, description: 'ID клуба для фильтрации' })
  findAll(@Query('clubId') clubId?: string) {
    return this.seasonsService.findAll(clubId ? parseInt(clubId) : undefined);
  }

  @Get(':id')
  @Roles(UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiRoles([UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN], 'Получить сезон по ID')
  @ApiResponse({ status: 200, description: 'Сезон найден', type: Season })
  @ApiResponse({ status: 404, description: 'Сезон не найден' })
  findOne(@Param('id') id: string) {
    return this.seasonsService.findOne(+id);
  }

  @Patch(':id')
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
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Удалить сезон')
  @ApiResponse({ status: 200, description: 'Сезон удален' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Сезон не найден' })
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.seasonsService.remove(+id, req.user);
  }
} 