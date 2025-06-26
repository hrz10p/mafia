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

  // Управление заявками на создание клубов
  async getClubRequests(): Promise<ClubRequest[]> {
    return this.clubRequestsRepository.find({
      relations: ['user', 'club'],
      order: { createdAt: 'DESC' },
    });
  }

  async approveClubRequest(requestId: number): Promise<Club> {
    const request = await this.clubRequestsRepository.findOne({
      where: { id: requestId },
      relations: ['user', 'club'],
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (request.status !== ClubRequestStatus.PENDING) {
      throw new ForbiddenException('Заявка уже обработана');
    }

    // Обновляем статус заявки
    request.status = ClubRequestStatus.APPROVED;
    await this.clubRequestsRepository.save(request);

    // Обновляем статус клуба
    const club = request.club;
    club.status = ClubStatus.APPROVED;
    
    // Обновляем роль владельца клуба
    club.owner.role = UserRole.CLUB_OWNER;
    await this.usersRepository.save(club.owner);

    return this.clubsRepository.save(club);
  }

  async rejectClubRequest(requestId: number, reason?: string): Promise<ClubRequest> {
    const request = await this.clubRequestsRepository.findOne({
      where: { id: requestId },
      relations: ['user', 'club'],
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (request.status !== ClubRequestStatus.PENDING) {
      throw new ForbiddenException('Заявка уже обработана');
    }

    // Обновляем статус заявки
    request.status = ClubRequestStatus.REJECTED;
    
    return this.clubRequestsRepository.save(request);
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
      this.clubRequestsRepository.count({ where: { status: ClubRequestStatus.PENDING } }),
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
    });

    if (!club) {
      throw new NotFoundException('Клуб не найден');
    }

    await this.clubsRepository.remove(club);
  }
} 