import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserRole } from '../common/enums/roles.enum';
import { Club, ClubStatus } from '../clubs/club.entity';
import { ClubRequest, ClubRequestStatus } from '../clubs/club-request.entity';
import { Season } from '../seasons/season.entity';
import { Game } from '../games/game.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { AdminUpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Club)
    private clubsRepository: Repository<Club>,
    @InjectRepository(ClubRequest)
    private clubRequestsRepository: Repository<ClubRequest>,
    @InjectRepository(Season)
    private seasonsRepository: Repository<Season>,
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(Tournament)
    private tournamentsRepository: Repository<Tournament>,
  ) {}

  // Управление заявками на создание клубов (клубы со статусом PENDING)
  async getClubRequests(): Promise<Club[]> {
    return this.clubsRepository.find({
      where: { status: ClubStatus.PENDING },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async approveClubRequest(clubId: number): Promise<Club> {
    const club = await this.clubsRepository.findOne({
      where: { id: clubId },
      relations: ['owner'],
    });

    if (!club) {
      throw new NotFoundException('Клуб не найден');
    }

    if (club.status !== ClubStatus.PENDING) {
      throw new ForbiddenException('Клуб уже обработан');
    }

    // Обновляем статус клуба
    club.status = ClubStatus.APPROVED;
    
    // Обновляем роль владельца клуба на CLUB_OWNER
    const owner = club.owner;
    owner.role = UserRole.CLUB_OWNER;
    await this.usersRepository.save(owner);

    return this.clubsRepository.save(club);
  }

  async rejectClubRequest(clubId: number, reason?: string): Promise<Club> {
    const club = await this.clubsRepository.findOne({
      where: { id: clubId },
      relations: ['owner'],
    });

    if (!club) {
      throw new NotFoundException('Клуб не найден');
    }

    if (club.status !== ClubStatus.PENDING) {
      throw new ForbiddenException('Клуб уже обработан');
    }

    // Обновляем статус клуба на REJECTED
    club.status = ClubStatus.REJECTED;
    
    return this.clubsRepository.save(club);
  }

  // Общая статистика системы
  async getSystemStats() {
    const [
      totalUsers,
      totalClubs,
      totalSeasons,
      totalTournaments,
      totalGames,
      pendingClubRequests,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.clubsRepository.count(),
      this.seasonsRepository.count(),
      this.tournamentsRepository.count(),
      this.gamesRepository.count(),
      this.clubsRepository.count({ where: { status: ClubStatus.PENDING } }),
    ]);

    return {
      totalUsers,
      totalClubs,
      totalSeasons,
      totalTournaments,
      totalGames,
      pendingClubRequests,
    };
  }

  // Управление пользователями
  async getAllUsers(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['club'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateUserRole(userId: number, role: UserRole): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    user.role = role;
    return this.usersRepository.save(user);
  }

  async deleteUser(userId: number): Promise<{ message: string; deletedUser: { id: number; nickname: string } }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const userInfo = {
      id: user.id,
      nickname: user.nickname,
    };

    await this.usersRepository.remove(user);

    return {
      message: 'Пользователь успешно удален',
      deletedUser: userInfo,
    };
  }

  // Управление клубами
  async getAllClubs(): Promise<Club[]> {
    return this.clubsRepository.find({
      relations: ['owner', 'administrators', 'members'],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteClub(clubId: number): Promise<void> {
    const club = await this.clubsRepository.findOne({
      where: { id: clubId },
      relations: ['owner', 'administrators', 'members'],
    });

    if (!club) {
      throw new NotFoundException('Клуб не найден');
    }

    // Use a transaction to ensure all related data is deleted properly
    await this.clubsRepository.manager.transaction(async (transactionalEntityManager) => {
      // First, update users who have this club as their primary club to null
      await transactionalEntityManager
        .createQueryBuilder()
        .update(User)
        .set({ club: null })
        .where('clubId = :clubId', { clubId })
        .execute();

      // Remove users from ManyToMany relationships
      if (club.administrators && club.administrators.length > 0) {
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('club_administrators')
          .where('club_id = :clubId', { clubId })
          .execute();
      }

      if (club.members && club.members.length > 0) {
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from('club_members')
          .where('club_id = :clubId', { clubId })
          .execute();
      }

      // Delete the club (cascade will handle related entities)
      await transactionalEntityManager.remove(Club, club);
    });
  }

  // Reset all players ELO to 1000
  async resetAllPlayersElo(): Promise<{ message: string; affectedUsers: number }> {
    const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ eloRating: 1000 })
      .execute();

    return {
      message: 'All players ELO has been reset to 1000',
      affectedUsers: result.affected || 0,
    };
  }

  // Update basic user profile (email, nickname) without touching stats
  async updateUserProfileBasic(userId: number, dto: AdminUpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (dto.email && dto.email !== user.email) {
      const exists = await this.usersRepository.findOne({ where: { email: dto.email } });
      if (exists) {
        throw new ForbiddenException('Email уже используется другим пользователем');
      }
      user.email = dto.email;
    }

    if (dto.nickname) {
      user.nickname = dto.nickname;
    }

    return this.usersRepository.save(user);
  }
} 