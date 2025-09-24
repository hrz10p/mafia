import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Tournament, TournamentStatus, TournamentType } from './tournament.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { GetAllTournamentsQueryDto, GetAllTournamentsResponseDto, TournamentDto } from './dto/get-all-tournaments.dto';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { UserRole } from '../common/enums/roles.enum';
import { Game } from '../games/game.entity';
import { GamePlayer } from '../games/game-player.entity';
import { UserRoleStatsService } from '../users/user-role-stats.service';
import { getElo } from '../common/utils/elotable';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Club)
    private clubsRepository: Repository<Club>,
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private gamePlayersRepository: Repository<GamePlayer>,
    private userRoleStatsService: UserRoleStatsService,
  ) {}

  async create(createTournamentDto: CreateTournamentDto, currentUser: User): Promise<Tournament> {
    // Проверяем права для создания ELO турнира
    if (createTournamentDto.type === TournamentType.ELO) {
      if (currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Только администратор платформы может создавать ELO турниры');
      }
      
      if (!createTournamentDto.stars || createTournamentDto.stars < 1 || createTournamentDto.stars > 6) {
        throw new BadRequestException('Для ELO турнира необходимо указать звездность от 1 до 6');
      }
    }

    let club: Club | null = null;
    
    // Если указан клуб, проверяем его существование и права
    if (createTournamentDto.clubId) {
      club = await this.clubsRepository.findOne({ 
        where: { id: createTournamentDto.clubId },
        relations: ['owner', 'administrators']
      });

      if (!club) {
        throw new NotFoundException('Клуб не найден');
      }

      // Проверяем права доступа (владелец, администратор клуба или админ системы)
      if (currentUser.role !== UserRole.ADMIN && 
          club.owner.id !== currentUser.id && 
          !club.administrators.some(admin => admin.id === currentUser.id)) {
        throw new ForbiddenException('Недостаточно прав для создания турнира в этом клубе');
      }
    } else {
      // Если клуб не указан, проверяем что это ELO турнир или у пользователя есть права
      if (createTournamentDto.type !== TournamentType.ELO && currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Только администратор платформы может создавать турниры без привязки к клубу');
      }
    }

    const referee = await this.usersRepository.findOne({ 
      where: { id: createTournamentDto.refereeId } 
    });

    if (!referee) {
      throw new NotFoundException('Судья не найден');
    }

    const tournament = this.tournamentsRepository.create({
      ...createTournamentDto,
      club,
      referee,
      date: new Date(createTournamentDto.date),
    });

    return this.tournamentsRepository.save(tournament);
  }

  async findAll(clubId?: number): Promise<Tournament[]> {
    const query = this.tournamentsRepository.createQueryBuilder('tournament')
      .leftJoinAndSelect('tournament.club', 'club')
      .leftJoinAndSelect('tournament.referee', 'referee')
      .leftJoinAndSelect('tournament.games', 'games');

    if (clubId) {
      query.where('tournament.club.id = :clubId', { clubId });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Tournament> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
      relations: ['club', 'referee', 'games', 'games.players', 'games.players.player'],
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    return tournament;
  }

  async update(id: number, updateTournamentDto: UpdateTournamentDto, currentUser: User): Promise<Tournament> {
    const tournament = await this.findOne(id);

    // Проверяем права доступа
    if (currentUser.role !== UserRole.ADMIN && 
        (!tournament.club || (
          tournament.club.owner.id !== currentUser.id && 
          !tournament.club.administrators.some(admin => admin.id === currentUser.id)
        ))) {
      throw new ForbiddenException('Недостаточно прав для обновления турнира');
    }

    if (updateTournamentDto.refereeId) {
      const referee = await this.usersRepository.findOne({ 
        where: { id: updateTournamentDto.refereeId } 
      });
      if (!referee) {
        throw new NotFoundException('Судья не найден');
      }
      tournament.referee = referee;
    }

    Object.assign(tournament, updateTournamentDto);
    return this.tournamentsRepository.save(tournament);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
      relations: ['club', 'club.owner', 'club.administrators', 'games'],
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    // Проверяем права доступа
    if (currentUser.role !== UserRole.ADMIN && 
        (!tournament.club || (
          tournament.club.owner.id !== currentUser.id && 
          !tournament.club.administrators.some(admin => admin.id === currentUser.id)
        ))) {
      throw new ForbiddenException('Недостаточно прав для удаления турнира');
    }

    // Use a transaction to ensure all related data is deleted properly
    await this.tournamentsRepository.manager.transaction(async (transactionalEntityManager) => {
      // Delete the tournament (cascade will handle related games)
      await transactionalEntityManager.remove(Tournament, tournament);
    });
  }

  async updateStatus(id: number, status: TournamentStatus, currentUser: User): Promise<Tournament> {
    const tournament = await this.findOne(id);

    // Проверяем права доступа
    if (currentUser.role !== UserRole.ADMIN && 
        (!tournament.club || (
          tournament.club.owner.id !== currentUser.id && 
          !tournament.club.administrators.some(admin => admin.id === currentUser.id)
        ))) {
      throw new ForbiddenException('Недостаточно прав для обновления статуса турнира');
    }

    tournament.status = status;
    return this.tournamentsRepository.save(tournament);
  }

  async completeTournament(id: number, currentUser: User): Promise<Tournament> {
    const tournament = await this.findOne(id);

    // Проверяем права доступа
    if (currentUser.role !== UserRole.ADMIN && 
        (!tournament.club || (
          tournament.club.owner.id !== currentUser.id && 
          !tournament.club.administrators.some(admin => admin.id === currentUser.id)
        ))) {
      throw new ForbiddenException('Недостаточно прав для завершения турнира');
    }

    if (tournament.status === TournamentStatus.COMPLETED) {
      throw new BadRequestException('Можно завершить только активный турнир');
    }

    // Собираем статистику из всех игр турнира
    await this.updatePlayerStatsFromTournament(tournament);

    // Обновляем статус турнира
    tournament.status = TournamentStatus.COMPLETED;
    return this.tournamentsRepository.save(tournament);
  }

  private async updatePlayerStatsFromTournament(tournament: Tournament): Promise<void> {
    // Получаем все игры турнира с игроками
    const games = await this.gamesRepository.find({
      where: { tournament: { id: tournament.id } },
      relations: ['players', 'players.player']
    });

    if (games.length === 0) {
      return; // Нет игр для обработки
    }

    // Собираем статистику по каждому игроку
    const playerStats = new Map<number, {
      totalGames: number;
      totalWins: number;
      totalPoints: number;
      totalBonusPoints: number;
      totalLh: number;
      totalCi: number;
      roleStats: Map<string, { gamesPlayed: number; gamesWon: number }>;
    }>();

    // Обрабатываем каждую игру
    for (const game of games) {
      for (const gamePlayer of game.players) {
        const playerId = gamePlayer.player.id;
        
        if (!playerStats.has(playerId)) {
          playerStats.set(playerId, {
            totalGames: 0,
            totalWins: 0,
            totalPoints: 0,
            totalBonusPoints: 0,
            totalLh: 0,
            totalCi: 0,
            roleStats: new Map()
          });
        }

        const stats = playerStats.get(playerId)!;
        stats.totalGames += 1;
        stats.totalPoints += gamePlayer.points || 0;

        // Определяем, выиграл ли игрок (по результату игры)
        const winPoints = this.getWinPoints(game, gamePlayer);
        if (winPoints > 0) {
          stats.totalWins += 1;
          stats.totalPoints += winPoints;
          gamePlayer.points += winPoints;
          await this.gamePlayersRepository.save(gamePlayer);
        }

        stats.totalBonusPoints += gamePlayer.bonusPoints || 0;
        stats.totalPoints -= gamePlayer.penaltyPoints || 0;
        stats.totalLh += (gamePlayer.lh || 0);
        stats.totalCi += (gamePlayer.ci || 0);

        // Статистика по роли
        const role = gamePlayer.role;
        if (!stats.roleStats.has(role)) {
          stats.roleStats.set(role, { gamesPlayed: 0, gamesWon: 0 });
        }
        
        const roleStats = stats.roleStats.get(role)!;
        roleStats.gamesPlayed += 1;
        if (winPoints > 0) {
          roleStats.gamesWon += 1;
        }
      }
    }

    // Обновляем профили игроков
    for (const [playerId, stats] of playerStats) {
      await this.updatePlayerProfile(playerId, stats);
    }

    // Если это ELO турнир, обновляем ELO рейтинги по финальной турнирной таблице
    if (tournament.type === TournamentType.ELO && tournament.stars) {
      await this.updateEloRatingsFromTournamentTable(tournament, playerStats);
    }
  }

  private async updateEloRatingsFromTournamentTable(
    tournament: Tournament, 
    playerStats: Map<number, any>
  ): Promise<void> {
    // Создаем финальную турнирную таблицу
    const tournamentTable = Array.from(playerStats.entries()).map(([playerId, stats]) => ({
      playerId,
      totalPoints: stats.totalPoints + stats.totalBonusPoints + stats.totalLh + stats.totalCi,
      stats
    }));

    // Сортируем по убыванию очков (1 место = максимальные очки)
    tournamentTable.sort((a, b) => b.totalPoints - a.totalPoints);

    // Обновляем ELO рейтинги по местам в турнире
    for (let i = 0; i < tournamentTable.length; i++) {
      const { playerId } = tournamentTable[i];
      const place = i + 1; // 1 место, 2 место, 3 место...
      
      // Получаем ELO очки по месту и звездам турнира
      const eloPoints = getElo(tournament.stars!, tournamentTable.length, place);
      
      // Обновляем ELO рейтинг игрока
      await this.updatePlayerEloRating(playerId, eloPoints);
    }
  }

  private async updatePlayerEloRating(playerId: number, eloPoints: number): Promise<void> {
    const player = await this.usersRepository.findOne({ where: { id: playerId } });
    if (!player) return;

    const newEloRating = Math.max(0, player.eloRating + eloPoints);
    
    await this.usersRepository.update(playerId, {
      eloRating: newEloRating
    });
  }

  private getWinPoints(game: Game, gamePlayer: GamePlayer): number {
    // Используем новую утилиту для определения победителя
    const { getWinPoints } = require('../common/utils/win-points');
    return getWinPoints(gamePlayer.role, game.result);
  }

  private async updatePlayerProfile(
    playerId: number, 
    stats: { 
      totalGames: number; 
      totalWins: number; 
      totalPoints: number; 
      totalBonusPoints: number;
      roleStats: Map<string, { gamesPlayed: number; gamesWon: number }>; 
    }
  ): Promise<void> {
    // Обновляем общую статистику пользователя
    await this.usersRepository.update(playerId, {
      totalGames: stats.totalGames,
      totalWins: stats.totalWins,
      totalPoints: stats.totalPoints,
      totalBonusPoints: stats.totalBonusPoints
    });

    // Подготавливаем данные для bulk обновления статистики по ролям
    const roleStatsArray = Array.from(stats.roleStats.entries()).map(([role, roleStats]) => ({
      role: role as any, // PlayerRole
      gamesPlayed: roleStats.gamesPlayed,
      gamesWon: roleStats.gamesWon
    }));

    // Обновляем статистику по ролям
    await this.userRoleStatsService.updateUserRoleStatsBulk(playerId, roleStatsArray);
  }

  async getAllTournaments(query: GetAllTournamentsQueryDto): Promise<GetAllTournamentsResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      type,
      stars,
      clubId,
      refereeId,
      sortBy = 'date',
      sortOrder = 'DESC'
    } = query;

    const skip = (page - 1) * limit;

    // Строим условия поиска
    const whereConditions: any = {};
    
    if (search) {
      whereConditions.name = Like(`%${search}%`);
    }
    
    if (status) {
      whereConditions.status = status;
    }

    if (type) {
      whereConditions.type = type;
    }

    if (stars) {
      whereConditions.stars = stars;
    }

    if (clubId) {
      whereConditions.club = { id: clubId };
    }

    if (refereeId) {
      whereConditions.referee = { id: refereeId };
    }

    // Получаем общее количество турниров
    const total = await this.tournamentsRepository.count({ 
      where: whereConditions,
      relations: clubId ? ['club'] : [],
    });

    // Получаем турниры с пагинацией и сортировкой
    const tournaments = await this.tournamentsRepository.find({
      where: whereConditions,
      relations: ['club', 'referee', 'games'],
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
    });

    // Преобразуем в DTO
    const tournamentsDto: TournamentDto[] = tournaments.map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      date: tournament.date,
      status: tournament.status,
      type: tournament.type,
      stars: tournament.stars,
      clubId: tournament.club?.id,
      clubName: tournament.club?.name,
      clubLogo: tournament.club?.logo,
      refereeId: tournament.referee.id,
      refereeName: tournament.referee.nickname,
      refereeEmail: tournament.referee.email,
      gamesCount: tournament.games?.length || 0,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt,
    }));

    return {
      tournaments: tournamentsDto,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
} 