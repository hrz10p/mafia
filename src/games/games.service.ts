import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, GameResult } from './game.entity';
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
    const playerSeatIndices = new Map<number, Set<number>>(); // Глобальные занятые seatIndex для каждого игрока
    const playerRounds = new Map<number, Set<number>>(); // Туры, в которых играл игрок

    // Инициализируем счетчики
    players.forEach(player => {
      playerGameCount.set(player.id, 0);
      playerSeatIndices.set(player.id, new Set());
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
        // Выбираем игроков для текущей игры с учетом уникальности позиции на столе
        const gamePlayers = this.assignPlayersToTable(
          shuffledPlayers,
          generateGamesDto.playersPerGame,
          playerGameCount,
          playerSeatIndices,
          playerRounds,
          table,
          round,
        );

        // Создаем игру
        const game = this.gamesRepository.create({
          name: `Игра #${gameIndex + 1}`,
          description: `Автоматически сгенерированная игра для турнира`,
          club: tournament.club,
          referee: tournament.referee,
          season: null,
          tournament,
          result: null,
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
          gamePlayer.seatIndex = index;
          return gamePlayer;
        });

        await this.gamePlayersRepository.save(gamePlayerEntities);

        // Обновляем счетчики
        gamePlayers.forEach((player, position) => {
          playerGameCount.set(player.id, playerGameCount.get(player.id)! + 1);
          // Отмечаем глобальный seatIndex
          playerSeatIndices.get(player.id)!.add(position);

          playerRounds.get(player.id)!.add(round);

          // Удаляем игрока из доступных для этого тура
          const playerIndex = shuffledPlayers.findIndex((p) => p.id === player.id);
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

  private assignPlayersToTable(
    availablePlayers: User[],
    playersPerGame: number,
    playerGameCount: Map<number, number>,
    playerSeatIndices: Map<number, Set<number>>,
    playerRounds: Map<number, Set<number>>,
    currentTable: number,
    currentRound: number,
  ): User[] {
    // Пробуем несколько попыток подобрать без конфликтов
    const MAX_ATTEMPTS = 100;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Копия пула доступных игроков на этот стол
      const pool = [...availablePlayers].sort(() => Math.random() - 0.5);
      const selected: (User | null)[] = new Array(playersPerGame).fill(null);
      const usedInThisTable = new Set<number>();

      let failed = false;
      for (let position = 0; position < playersPerGame; position++) {
        // Находим игроков, которые подходят на эту позицию
        const eligible = pool.filter((player) => {
          if (usedInThisTable.has(player.id)) return false;
          const gameCount = playerGameCount.get(player.id)!;
          if (gameCount >= 6) return false;
          const roundsPlayed = playerRounds.get(player.id)!;
          if (roundsPlayed.has(currentRound)) return false; // уже играет в этом туре

          const usedSeats = playerSeatIndices.get(player.id)!;
          if (usedSeats.has(position)) return false; // уже сидел на этой позиции в любой игре

          return true;
        });

        if (eligible.length === 0) {
          failed = true;
          break;
        }

        // Выбираем среди тех, у кого минимальное число игр, случайно из равных
        let minGames = Number.MAX_SAFE_INTEGER;
        eligible.forEach((p) => {
          const cnt = playerGameCount.get(p.id)!;
          if (cnt < minGames) minGames = cnt;
        });
        const best = eligible.filter((p) => playerGameCount.get(p.id)! === minGames);
        const chosen = best[Math.floor(Math.random() * best.length)];

        selected[position] = chosen;
        usedInThisTable.add(chosen.id);

        // Убираем выбранного из пула, чтобы не предлагать снова на другой позиции
        const idx = pool.findIndex((p) => p.id === chosen.id);
        if (idx !== -1) pool.splice(idx, 1);
      }

      if (!failed && selected.every((p) => p !== null)) {
        return selected as User[];
      }
    }

    // Если подобрать без конфликтов не удалось после многих попыток
    throw new ForbiddenException('Не удалось выполнить рассадку без повторов позиций для игроков. Попробуйте уменьшить количество игр/туров или изменить состав.');
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
      club,
      referee,
      season,
      tournament,
      result: createGameDto.result,
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

  async updateGameResults(
    id: number,
    updateGameResultDto: UpdateGameResultDto,
    currentUser: User,
  ): Promise<GamePlayer[]> {
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

    const updatedGamePlayers: GamePlayer[] = [];
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

      const saved = await this.gamePlayersRepository.save(gamePlayer);
      updatedGamePlayers.push(saved);
    }

    const savedGame = await this.findOne(id);
    savedGame.result = updateGameResultDto.result;
    await this.gamesRepository.save(savedGame);

    // Сохраняем обновленную игру
    return updatedGamePlayers;
  }
}
