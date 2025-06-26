import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, GameStatus, GameResult } from './game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { UpdateGameResultDto } from './dto/update-game-result.dto';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { Season } from '../seasons/season.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { GamePlayer, PlayerRole } from './game-player.entity';
import { UserRole } from '../common/enums/roles.enum';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Club)
    private clubsRepository: Repository<Club>,
    @InjectRepository(Season)
    private seasonsRepository: Repository<Season>,
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
    @InjectRepository(GamePlayer)
    private gamePlayersRepository: Repository<GamePlayer>,
  ) {}

  async create(createGameDto: CreateGameDto, currentUser: User): Promise<Game> {
    // Проверяем, что указан либо сезон, либо турнир, но не оба
    if (!createGameDto.seasonId && !createGameDto.tournamentId) {
      throw new ForbiddenException('Необходимо указать либо сезон, либо турнир');
    }
    if (createGameDto.seasonId && createGameDto.tournamentId) {
      throw new ForbiddenException('Игра может принадлежать либо сезону, либо турниру, но не обоим одновременно');
    }

    const club = await this.clubsRepository.findOne({ 
      where: { id: createGameDto.clubId },
      relations: ['owner', 'administrators']
    });

    if (!club) {
      throw new NotFoundException('Клуб не найден');
    }

    // Проверяем права доступа (владелец, администратор клуба, судья или админ системы)
    const hasAccess = currentUser.role === UserRole.ADMIN ||
                     club.owner.id === currentUser.id || 
                     club.administrators.some(admin => admin.id === currentUser.id) ||
                     currentUser.role === UserRole.JUDGE;
    
    if (!hasAccess) {
      throw new ForbiddenException('Недостаточно прав для создания игры');
    }

    let season: Season | null = null;
    let tournament: Tournament | null = null;
    let referee: User;

    if (createGameDto.seasonId) {
      season = await this.seasonsRepository.findOne({ 
        where: { id: createGameDto.seasonId },
        relations: ['club', 'referee']
      });
      if (!season) {
        throw new NotFoundException('Сезон не найден');
      }
      if (season.club.id !== club.id) {
        throw new ForbiddenException('Сезон не принадлежит данному клубу');
      }
      referee = season.referee;
    } else {
      tournament = await this.tournamentsRepository.findOne({ 
        where: { id: createGameDto.tournamentId },
        relations: ['club', 'referee']
      });
      if (!tournament) {
        throw new NotFoundException('Турнир не найден');
      }
      if (tournament.club.id !== club.id) {
        throw new ForbiddenException('Турнир не принадлежит данному клубу');
      }
      referee = tournament.referee;
    }

    const game = this.gamesRepository.create({
      name: createGameDto.name,
      description: createGameDto.description,
      scheduledDate: new Date(createGameDto.scheduledDate),
      completedDate: new Date(), // Игра уже сыграна
      club,
      referee,
      season,
      tournament,
      status: GameStatus.COMPLETED,
      result: createGameDto.result,
      resultTable: createGameDto.resultTable,
      totalPlayers: createGameDto.players.length,
      mafiaCount: createGameDto.players.filter(p => p.role === PlayerRole.MAFIA).length,
      citizenCount: createGameDto.players.filter(p => p.role === PlayerRole.CITIZEN).length,
    });

    const savedGame = await this.gamesRepository.save(game);

    // Создаем записи игроков с результатами
    const gamePlayers = createGameDto.players.map(playerDto => 
      this.gamePlayersRepository.create({
        game: savedGame,
        player: { id: playerDto.playerId } as User,
        role: playerDto.role,
        points: playerDto.points || 0,
        kills: playerDto.kills || 0,
        deaths: playerDto.deaths || 0,
        notes: playerDto.notes,
      })
    );

    await this.gamePlayersRepository.save(gamePlayers);

    return this.findOne(savedGame.id);
  }

  async findAll(clubId?: number, seasonId?: number, tournamentId?: number): Promise<Game[]> {
    const query = this.gamesRepository.createQueryBuilder('game')
      .leftJoinAndSelect('game.club', 'club')
      .leftJoinAndSelect('game.referee', 'referee')
      .leftJoinAndSelect('game.season', 'season')
      .leftJoinAndSelect('game.tournament', 'tournament')
      .leftJoinAndSelect('game.players', 'players')
      .leftJoinAndSelect('players.player', 'player');

    if (clubId) {
      query.where('game.club.id = :clubId', { clubId });
    }

    if (seasonId) {
      query.andWhere('game.season.id = :seasonId', { seasonId });
    }

    if (tournamentId) {
      query.andWhere('game.tournament.id = :tournamentId', { tournamentId });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Game> {
    const game = await this.gamesRepository.findOne({
      where: { id },
      relations: ['club', 'referee', 'season', 'tournament', 'players', 'players.player'],
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    return game;
  }

  async update(id: number, updateGameDto: UpdateGameDto, currentUser: User): Promise<Game> {
    const game = await this.findOne(id);

    // Проверяем права доступа (владелец, администратор клуба, судья или админ системы)
    const hasAccess = currentUser.role === UserRole.ADMIN ||
                     game.club.owner.id === currentUser.id || 
                     game.club.administrators.some(admin => admin.id === currentUser.id) ||
                     currentUser.role === UserRole.JUDGE;
    
    if (!hasAccess) {
      throw new ForbiddenException('Недостаточно прав для обновления игры');
    }

    Object.assign(game, updateGameDto);
    return this.gamesRepository.save(game);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const game = await this.findOne(id);

    // Проверяем права доступа (владелец, администратор клуба или админ системы)
    if (currentUser.role !== UserRole.ADMIN && 
        game.club.owner.id !== currentUser.id && 
        !game.club.administrators.some(admin => admin.id === currentUser.id)) {
      throw new ForbiddenException('Недостаточно прав для удаления игры');
    }

    await this.gamesRepository.remove(game);
  }

  async updateStatus(id: number, status: GameStatus, currentUser: User): Promise<Game> {
    const game = await this.findOne(id);

    // Проверяем права доступа (владелец, администратор клуба, судья или админ системы)
    const hasAccess = currentUser.role === UserRole.ADMIN ||
                     game.club.owner.id === currentUser.id || 
                     game.club.administrators.some(admin => admin.id === currentUser.id) ||
                     currentUser.role === UserRole.JUDGE;
    
    if (!hasAccess) {
      throw new ForbiddenException('Недостаточно прав для обновления статуса игры');
    }

    game.status = status;
    return this.gamesRepository.save(game);
  }
} 