import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleStats } from './user-role-stats.entity';
import { User } from './user.entity';
import { PlayerRole } from '../games/game-player.entity';

@Injectable()
export class UserRoleStatsService {
  constructor(
    @InjectRepository(UserRoleStats)
    private userRoleStatsRepository: Repository<UserRoleStats>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async initializeUserRoleStats(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Создаем записи статистики для всех ролей
    const roles = Object.values(PlayerRole);
    const existingStats = await this.userRoleStatsRepository.find({
      where: { user: { id: userId } }
    });

    const existingRoleIds = existingStats.map(stat => stat.role);
    const missingRoles = roles.filter(role => !existingRoleIds.includes(role));

    for (const role of missingRoles) {
      const roleStats = this.userRoleStatsRepository.create({
        user,
        role,
        gamesPlayed: 0,
        gamesWon: 0,
      });

      await this.userRoleStatsRepository.save(roleStats);
    }
  }

  async updateUserRoleStats(
    userId: number,
    role: PlayerRole,
    won: boolean
  ): Promise<UserRoleStats> {
    let roleStats = await this.userRoleStatsRepository.findOne({
      where: { user: { id: userId }, role }
    });

    if (!roleStats) {
      // Если статистика не существует, создаем её
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }

      roleStats = this.userRoleStatsRepository.create({
        user,
        role,
        gamesPlayed: 0,
        gamesWon: 0,
      });
    }

    // Обновляем статистику
    roleStats.gamesPlayed += 1;
    if (won) {
      roleStats.gamesWon += 1;
    }

    return this.userRoleStatsRepository.save(roleStats);
  }

  async updateUserRoleStatsBulk(
    userId: number,
    roleStats: { role: PlayerRole; gamesPlayed: number; gamesWon: number }[]
  ): Promise<void> {
    for (const stat of roleStats) {
      let roleStatsEntity = await this.userRoleStatsRepository.findOne({
        where: { user: { id: userId }, role: stat.role }
      });

      if (!roleStatsEntity) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
          throw new NotFoundException('Пользователь не найден');
        }

        roleStatsEntity = this.userRoleStatsRepository.create({
          user,
          role: stat.role,
          gamesPlayed: 0,
          gamesWon: 0,
        });
      }

      // Обновляем статистику
      roleStatsEntity.gamesPlayed = stat.gamesPlayed;
      roleStatsEntity.gamesWon = stat.gamesWon;

      await this.userRoleStatsRepository.save(roleStatsEntity);
    }
  }

  async getUserRoleStats(userId: number): Promise<UserRoleStats[]> {
    const roleStats = await this.userRoleStatsRepository.find({
      where: { user: { id: userId } },
      order: { role: 'ASC' }
    });

    if (roleStats.length === 0) {
      // Если статистики нет, инициализируем её
      await this.initializeUserRoleStats(userId);
      return this.getUserRoleStats(userId);
    }

    return roleStats;
  }

  async getUserRoleStatsByRole(userId: number, role: PlayerRole): Promise<UserRoleStats | null> {
    return this.userRoleStatsRepository.findOne({
      where: { user: { id: userId }, role }
    });
  }
}
