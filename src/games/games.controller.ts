import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CreateGameDto, CreateGamePlayerDto, UpdateGameDto, GenerateGamesDto } from './dto';
import { Game, GameStatus } from './game.entity';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../users/user.entity';
import { ApiRoles } from '../common/decorators/api-roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('Games - Управление играми')
@Controller('games')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.JUDGE, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.JUDGE, UserRole.ADMIN], 'Создать игру (после завершения)')
  @ApiResponse({ status: 201, description: 'Игра успешно создана с результатами', type: Game })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Клуб, сезон или турнир не найден' })
  create(@Body() createGameDto: CreateGameDto, @Request() req: { user: User }) {
    return this.gamesService.create(createGameDto, req.user);
  }

  @Post('generate')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.JUDGE, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.JUDGE, UserRole.ADMIN], 'Генерировать игры для турнира')
  @ApiOperation({ summary: 'Генерировать игры для турнира с автоматической рассадкой игроков' })
  @ApiResponse({ status: 201, description: 'Игры успешно сгенерированы', type: [Game] })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Турнир не найден' })
  generateGames(@Body() generateGamesDto: GenerateGamesDto, @Request() req: { user: User }) {
    return this.gamesService.generateGames(generateGamesDto, req.user);
  }

  @Get()
  @Roles(UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiRoles([UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN], 'Получить список игр')
  @ApiResponse({ status: 200, description: 'Список игр', type: [Game] })
  @ApiQuery({ name: 'clubId', required: false, description: 'ID клуба для фильтрации' })
  @ApiQuery({ name: 'seasonId', required: false, description: 'ID сезона для фильтрации' })
  @ApiQuery({ name: 'tournamentId', required: false, description: 'ID турнира для фильтрации' })
  findAll(
    @Query('clubId') clubId?: string,
    @Query('seasonId') seasonId?: string,
    @Query('tournamentId') tournamentId?: string,
  ) {
    return this.gamesService.findAll(
      clubId ? parseInt(clubId) : undefined,
      seasonId ? parseInt(seasonId) : undefined,
      tournamentId ? parseInt(tournamentId) : undefined,
    );
  }

  @Get(':id')
  @Roles(UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  @ApiRoles([UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN], 'Получить игру по ID')
  @ApiResponse({ status: 200, description: 'Игра найдена', type: Game })
  @ApiResponse({ status: 404, description: 'Игра не найдена' })
  findOne(@Param('id') id: string) {
    return this.gamesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.JUDGE, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.JUDGE, UserRole.ADMIN], 'Обновить игру')
  @ApiResponse({ status: 200, description: 'Игра обновлена', type: Game })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Игра не найдена' })
  update(
    @Param('id') id: string,
    @Body() updateGameDto: UpdateGameDto,
    @Request() req: { user: User }
  ) {
    return this.gamesService.update(+id, updateGameDto, req.user);
  }

  @Patch(':id/status')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.JUDGE, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.JUDGE, UserRole.ADMIN], 'Обновить статус игры')
  @ApiResponse({ status: 200, description: 'Статус игры обновлен', type: Game })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Игра не найдена' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: GameStatus,
    @Request() req: { user: User }
  ) {
    return this.gamesService.updateStatus(+id, status, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Удалить игру')
  @ApiResponse({ status: 200, description: 'Игра удалена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Игра не найдена' })
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.gamesService.remove(+id, req.user);
  }
} 