import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Season } from '../seasons/season.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { Game } from '../games/game.entity';
import { GamePlayer } from '../games/game-player.entity';
import { PlayerRatingDto, SeasonRatingDto, TournamentRatingDto } from '../common/dto/rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Season)
    private seasonsRepository: Repository<Season>,
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private gamePlayersRepository: Repository<GamePlayer>,
  ) {}

  async getSeasonRating(seasonId: number): Promise<SeasonRatingDto> {
    const season = await this.seasonsRepository.findOne({
      where: { id: seasonId },
    });

    if (!season) {
      throw new NotFoundException('Сезон не найден');
    }

    // Получаем все игры сезона с игроками
    const games = await this.gamesRepository.find({
      where: { season: { id: seasonId } },
      relations: ['players', 'players.player'],
    });

    // Собираем статистику по игрокам
    const playerStats = new Map<number, {
      player: User;
      totalPoints: number;
      gamesPlayed: number;
      gamesWon: number;
    }>();

    for (const game of games) {
      for (const gamePlayer of game.players) {
        const playerId = gamePlayer.player.id;
        
        if (!playerStats.has(playerId)) {
          playerStats.set(playerId, {
            player: gamePlayer.player,
            totalPoints: 0,
            gamesPlayed: 0,
            gamesWon: 0,
          });
        }

        const stats = playerStats.get(playerId)!;
        const combinedPoints =
          (gamePlayer.points ?? 0) +
          (gamePlayer.lh ?? 0) +
          (gamePlayer.ci ?? 0) +
          (gamePlayer.bonusPoints ?? 0) -
          (gamePlayer.penaltyPoints ?? 0);
        stats.totalPoints += combinedPoints;
        stats.gamesPlayed += 1;


        

        const { isPlayerWinner } = require('../common/utils/win-points');
        if (isPlayerWinner(gamePlayer.role, game.result)) {
          stats.gamesWon += 1;
        }
      }
    }

    // Преобразуем в массив и сортируем по очкам
    const ratings: PlayerRatingDto[] = Array.from(playerStats.values())
      .map((stats, index) => ({
        playerId: stats.player.id,
        email: stats.player.email,
        name: stats.player.nickname || stats.player.email,
        totalPoints: stats.totalPoints,
        gamesPlayed: stats.gamesPlayed,
        averagePoints: stats.gamesPlayed > 0 ? Math.round((stats.totalPoints / stats.gamesPlayed) * 100) / 100 : 0,
        gamesWon: stats.gamesWon,
        winRate: stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0,
        rank: 0, // Будет установлено после сортировки
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((rating, index) => ({
        ...rating,
        rank: index + 1,
      }));

    return {
      seasonId: season.id,
      seasonName: season.name,
      players: ratings,
    };
  }

  async getTournamentRating(tournamentId: number): Promise<TournamentRatingDto> {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    // Получаем все игры турнира с игроками
    const games = await this.gamesRepository.find({
      where: { tournament: { id: tournamentId } },
      relations: ['players', 'players.player'],
    });

    // Собираем статистику по игрокам
    const playerStats = new Map<number, {
      player: User;
      totalPoints: number;
      gamesPlayed: number;
      gamesWon: number;
    }>();

    for (const game of games) {
      for (const gamePlayer of game.players) {
        const playerId = gamePlayer.player.id;
        
        if (!playerStats.has(playerId)) {
          playerStats.set(playerId, {
            player: gamePlayer.player,
            totalPoints: 0,
            gamesPlayed: 0,
            gamesWon: 0,
          });
        }

        const stats = playerStats.get(playerId)!;
        const combinedPoints =
          (gamePlayer.points ?? 0) +
          (gamePlayer.lh ?? 0) +
          (gamePlayer.ci ?? 0) +
          (gamePlayer.bonusPoints ?? 0) -
          (gamePlayer.penaltyPoints ?? 0);
        stats.totalPoints += combinedPoints;
        stats.gamesPlayed += 1;

        // Определяем победителя
        if (combinedPoints > 0) {
          stats.gamesWon += 1;
        }
      }
    }

    // Преобразуем в массив и сортируем по очкам
    const ratings: PlayerRatingDto[] = Array.from(playerStats.values())
      .map((stats, index) => ({
        playerId: stats.player.id,
        email: stats.player.email,
        name: stats.player.nickname || stats.player.email,
        totalPoints: stats.totalPoints,
        gamesPlayed: stats.gamesPlayed,
        averagePoints: stats.gamesPlayed > 0 ? Math.round((stats.totalPoints / stats.gamesPlayed) * 100) / 100 : 0,
        gamesWon: stats.gamesWon,
        winRate: stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0,
        rank: 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((rating, index) => ({
        ...rating,
        rank: index + 1,
      }));

    return {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      players: ratings,
    };
  }
} 