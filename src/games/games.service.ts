import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, GameStatus, GameResult } from './game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { UpdateGameResultDto } from './dto/update-game-result.dto';
import { GenerateGamesDto } from './dto/generate-games.dto';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { Season } from '../seasons/season.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { GamePlayer, PlayerRole } from './game-player.entity';
import { UserRole } from '../common/enums/roles.enum';
import * as bcrypt from 'bcrypt';

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

  async generateGames(generateGamesDto: GenerateGamesDto, currentUser: User): Promise<Game[]> {
    // Проверяем турнир
    const tournament = await this.tournamentsRepository.findOne({
      where: { id: generateGamesDto.tournamentId },
      relations: ['club', 'club.owner', 'club.administrators'],
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    // Проверяем права доступа
    const hasAccess =
      currentUser.role === UserRole.ADMIN ||
      tournament.club.owner.id === currentUser.id ||
      tournament.club.administrators.some((admin) => admin.id === currentUser.id) ||
      currentUser.role === UserRole.JUDGE;

    if (!hasAccess) {
      throw new ForbiddenException('Недостаточно прав для генерации игр');
    }

    // Проверяем валидность параметров
    const totalPlayersNeeded = generateGamesDto.tablesCount * generateGamesDto.playersPerGame;
    if (generateGamesDto.playerNicknames.length < totalPlayersNeeded) {
      throw new ForbiddenException(
        `Недостаточно игроков. Нужно минимум ${totalPlayersNeeded}, а предоставлено ${generateGamesDto.playerNicknames.length}`,
      );
    }

    // Создаем или находим пользователей по никнеймам
    const players: User[] = [];
    for (const nickname of generateGamesDto.playerNicknames) {
      let player = await this.usersRepository.findOne({
        where: { nickname },
      });

      if (!player) {
        // Создаем нового пользователя с никнеймом
        player = this.usersRepository.create({
          nickname,
          email: `${nickname}@mafspace.ru`, // Временный email
          role: UserRole.PLAYER,
          password: await bcrypt.hash(nickname, 10),
        });
        await this.usersRepository.save(player);
      }

      players.push(player);
    }

    // Генерируем расписание игр
    const games: Game[] = [];
    const playerGameCount = new Map<number, number>(); // Количество игр для каждого игрока
    const playerPositions = new Map<number, Map<number, Set<number>>>(); // Позиции игрока на каждом столе
    const playerRounds = new Map<number, Set<number>>(); // Туры, в которых играл игрок

    // Инициализируем счетчики
    players.forEach(player => {
      playerGameCount.set(player.id, 0);
      playerPositions.set(player.id, new Map()); // Для каждого стола отдельный Set позиций
      playerRounds.set(player.id, new Set());
    });

    let gameIndex = 1;
    for (let round = 1; round <= generateGamesDto.roundsCount; round++) {
      // Создаем копию игроков для текущего тура
      const availablePlayersForRound = players.filter(player => {
        const gameCount = playerGameCount.get(player.id)!;
        const roundsPlayed = playerRounds.get(player.id)!;
        // Игрок может играть если у него меньше 6 игр и он не играл в этом туре
        return gameCount < 6 && !roundsPlayed.has(round);
      });

      // Перемешиваем игроков для случайности
      const shuffledPlayers = [...availablePlayersForRound].sort(() => Math.random() - 0.5);

      for (let table = 1; table <= generateGamesDto.tablesCount; table++) {
        // Выбираем игроков для текущей игры
        const gamePlayers = this.selectPlayersForGameInRound(
          shuffledPlayers,
          generateGamesDto.playersPerGame,
          playerGameCount,
          playerPositions,
          playerRounds,
          table,
          round,
        );

        // Создаем игру
        const game = this.gamesRepository.create({
          name: `Стол ${table} - Тур ${round} - Игра ${gameIndex}`,
          description: `Автоматически сгенерированная игра для турнира`,
          scheduledDate: new Date(), // Можно настроить по расписанию
          completedDate: null,
          club: tournament.club,
          referee: tournament.referee,
          season: null,
          tournament,
          status: GameStatus.SCHEDULED,
          result: null,
          resultTable: null,
          totalPlayers: gamePlayers.length,
        });

        const savedGame = await this.gamesRepository.save(game);

        // Создаем записи игроков
        const gamePlayerEntities = gamePlayers.map((player, index) => {
          const gamePlayer = new GamePlayer();
          gamePlayer.game = savedGame;
          gamePlayer.player = player;
          gamePlayer.role = PlayerRole.CITIZEN; // По умолчанию гражданин, можно рандомизировать
          gamePlayer.points = 0;
          gamePlayer.bonusPoints = 0;
          gamePlayer.penaltyPoints = 0;
          gamePlayer.notes = '';
          return gamePlayer;
        });

        await this.gamePlayersRepository.save(gamePlayerEntities);

        // Обновляем счетчики
        gamePlayers.forEach((player, position) => {
          playerGameCount.set(player.id, playerGameCount.get(player.id)! + 1);
          
          // Отмечаем позицию игрока на этом столе
          const playerTablePositions = playerPositions.get(player.id)!;
          if (!playerTablePositions.has(table)) {
            playerTablePositions.set(table, new Set());
          }
          playerTablePositions.get(table)!.add(position);
          
          playerRounds.get(player.id)!.add(round);
          
          // Удаляем игрока из доступных для этого тура
          const playerIndex = shuffledPlayers.findIndex(p => p.id === player.id);
          if (playerIndex !== -1) {
            shuffledPlayers.splice(playerIndex, 1);
          }
        });

        games.push(savedGame);
        gameIndex++;
      }
    }

    return games;
  }

  private selectPlayersForGameInRound(
    availablePlayers: User[],
    playersPerGame: number,
    playerGameCount: Map<number, number>,
    playerPositions: Map<number, Map<number, Set<number>>>,
    playerRounds: Map<number, Set<number>>,
    currentTable: number,
    currentRound: number,
  ): User[] {
    // Фильтруем игроков, которые могут играть в этой игре
    const eligiblePlayers = availablePlayers.filter(player => {
      const gameCount = playerGameCount.get(player.id)!;
      const playerTablePositions = playerPositions.get(player.id)!;
      const roundsPlayed = playerRounds.get(player.id)!;
      
      // Игрок может играть если:
      // 1. У него меньше 6 игр
      // 2. Он не играл в этом туре
      // 3. На этом столе у него занято меньше позиций чем нужно игроков
      const positionsOnThisTable = playerTablePositions.get(currentTable)?.size || 0;
      
      return gameCount < 6 && !roundsPlayed.has(currentRound) && positionsOnThisTable < playersPerGame;
    });

    if (eligiblePlayers.length < playersPerGame) {
      // Если недостаточно игроков, берем тех, кто меньше всего играл
      const sortedByGames = availablePlayers
        .sort((a, b) => {
          const countA = playerGameCount.get(a.id)!;
          const countB = playerGameCount.get(b.id)!;
          return countA - countB;
        })
        .slice(0, playersPerGame);
      return sortedByGames;
    }

    // Выбираем игроков случайным образом из доступных
    const selectedPlayers: User[] = [];
    const shuffled = [...eligiblePlayers].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < playersPerGame && i < shuffled.length; i++) {
      selectedPlayers.push(shuffled[i]);
    }

    return selectedPlayers;
  }

  async create(createGameDto: CreateGameDto, currentUser: User): Promise<Game> {
    // Проверяем, что указан либо сезон, либо турнир, но не оба
    if (!createGameDto.seasonId && !createGameDto.tournamentId) {
      throw new ForbiddenException(
        'Необходимо указать либо сезон, либо турнир',
      );
    }
    if (createGameDto.seasonId && createGameDto.tournamentId) {
      throw new ForbiddenException(
        'Игра может принадлежать либо сезону, либо турниру, но не обоим одновременно',
      );
    }

    const club = await this.clubsRepository.findOne({
      where: { id: createGameDto.clubId },
      relations: ['owner', 'administrators'],
    });

    if (!club) {
      throw new NotFoundException('Клуб не найден');
    }

    // Проверяем права доступа (владелец, администратор клуба, судья или админ системы)
    const hasAccess =
      currentUser.role === UserRole.ADMIN ||
      club.owner.id === currentUser.id ||
      club.administrators.some((admin) => admin.id === currentUser.id) ||
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
        relations: ['club', 'referee'],
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
        relations: ['club', 'referee'],
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
      mafiaCount: createGameDto.players.filter(
        (p) => p.role === PlayerRole.MAFIA,
      ).length,
      citizenCount: createGameDto.players.filter(
        (p) => p.role === PlayerRole.CITIZEN,
      ).length,
    });

    const savedGame = await this.gamesRepository.save(game);

    // Создаем записи игроков с результатами
    const gamePlayers = createGameDto.players.map((playerDto) => {
      const gamePlayer = new GamePlayer();
      gamePlayer.player = { id: playerDto.playerId } as User;
      gamePlayer.role = playerDto.role;
      gamePlayer.points = playerDto.points || 0;
      gamePlayer.bonusPoints = playerDto.bonusPoints || 0;
      gamePlayer.penaltyPoints = playerDto.penaltyPoints || 0;
      gamePlayer.notes = playerDto.notes;
      gamePlayer.game = savedGame;
      return gamePlayer;
    });

    await this.gamePlayersRepository.save(gamePlayers);

    return this.findOne(savedGame.id);
  }

  async findAll(
    clubId?: number,
    seasonId?: number,
    tournamentId?: number,
  ): Promise<Game[]> {
    const query = this.gamesRepository
      .createQueryBuilder('game')
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
      relations: [
        'club',
        'referee',
        'season',
        'tournament',
        'players',
        'players.player',
      ],
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    return game;
  }

  async update(
    id: number,
    updateGameDto: UpdateGameDto,
    currentUser: User,
  ): Promise<Game> {
    const game = await this.findOne(id);

    // Проверяем права доступа (владелец, администратор клуба, судья или админ системы)
    const hasAccess =
      currentUser.role === UserRole.ADMIN ||
      game.club.owner.id === currentUser.id ||
      game.club.administrators.some((admin) => admin.id === currentUser.id) ||
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
    if (
      currentUser.role !== UserRole.ADMIN &&
      game.club.owner.id !== currentUser.id &&
      !game.club.administrators.some((admin) => admin.id === currentUser.id)
    ) {
      throw new ForbiddenException('Недостаточно прав для удаления игры');
    }

    await this.gamesRepository.remove(game);
  }

  async updateStatus(
    id: number,
    status: GameStatus,
    currentUser: User,
  ): Promise<Game> {
    const game = await this.findOne(id);

    // Проверяем права доступа (владелец, администратор клуба, судья или админ системы)
    const hasAccess =
      currentUser.role === UserRole.ADMIN ||
      game.club.owner.id === currentUser.id ||
      game.club.administrators.some((admin) => admin.id === currentUser.id) ||
      currentUser.role === UserRole.JUDGE;

    if (!hasAccess) {
      throw new ForbiddenException(
        'Недостаточно прав для обновления статуса игры',
      );
    }

    game.status = status;
    return this.gamesRepository.save(game);
  }

  async updateGameResults(
    id: number,
    updateGameResultDto: UpdateGameResultDto,
    currentUser: User,
  ): Promise<Game> {
    const game = await this.findOne(id);

    // Проверяем права доступа (владелец, администратор клуба, судья или админ системы)
    const hasAccess =
      currentUser.role === UserRole.ADMIN ||
      game.club.owner.id === currentUser.id ||
      game.club.administrators.some((admin) => admin.id === currentUser.id) ||
      currentUser.role === UserRole.JUDGE;

    if (!hasAccess) {
      throw new ForbiddenException('Недостаточно прав для обновления результатов игры');
    }

    // Обновляем общие результаты игры
    if (updateGameResultDto.result !== undefined) {
      game.result = updateGameResultDto.result;
    }
    if (updateGameResultDto.resultTable !== undefined) {
      game.resultTable = updateGameResultDto.resultTable;
    }

    // Обновляем результаты игроков
    for (const playerResult of updateGameResultDto.playerResults) {
      const gamePlayer = await this.gamePlayersRepository.findOne({
        where: {
          game: { id },
          player: { id: playerResult.playerId },
        },
        relations: ['player'],
      });

      if (!gamePlayer) {
        throw new NotFoundException(
          `Игрок с ID ${playerResult.playerId} не найден в игре`,
        );
      }

      // Обновляем данные игрока
      gamePlayer.role = playerResult.role;
      gamePlayer.points = playerResult.points;
      gamePlayer.bonusPoints = playerResult.bonusPoints || 0;
      gamePlayer.penaltyPoints = playerResult.penaltyPoints || 0;
      gamePlayer.notes = playerResult.notes || '';

      await this.gamePlayersRepository.save(gamePlayer);
    }

    // Сохраняем обновленную игру
    return this.gamesRepository.save(game);
  }
}
