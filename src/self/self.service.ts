import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { UserDTO } from '../common/dto/user.dto';
import { UpdateUserProfileDto } from '../common/dto/user.dto';
import { UserRole } from '../common/enums/roles.enum';
import { FilesService } from '../files/files.service';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { ExtendedUserProfileDto, ClubInfoDto } from './dto/extended-profile.dto';
import { UserRoleStatsService } from '../users/user-role-stats.service';

@Injectable()
export class SelfService {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
    private readonly userRoleStatsService: UserRoleStatsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Club)
    private clubRepository: Repository<Club>,
  ) {}

  async getMyProfile(userId: number): Promise<UserDTO> {
    return this.usersService.getUserById(userId);
  }

  async getMyExtendedProfile(userId: number): Promise<ExtendedUserProfileDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['club'],
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // Получаем статистику по ролям
    const roleStats = await this.userRoleStatsService.getUserRoleStats(userId);

    // Находим клуб, где пользователь является владельцем
    const ownedClub = await this.clubRepository.findOne({
      where: { owner: { id: userId } },
    });

    // Находим клуб, где пользователь является администратором
    const adminClub = await this.clubRepository
      .createQueryBuilder('club')
      .innerJoin('club.administrators', 'admin')
      .where('admin.id = :userId', { userId })
      .getOne();

    // Находим клуб, где пользователь является участником
    const memberClub = await this.clubRepository
      .createQueryBuilder('club')
      .innerJoin('club.members', 'member')
      .where('member.id = :userId', { userId })
      .getOne();

    let clubInfo: ClubInfoDto | undefined;

    // Определяем приоритет: владелец > администратор > участник
    if (ownedClub) {
      clubInfo = {
        id: ownedClub.id,
        name: ownedClub.name,
        logo: ownedClub.logo,
        description: ownedClub.description,
        city: ownedClub.city,
        status: ownedClub.status,
        userRole: 'owner',
        joinedAt: ownedClub.createdAt,
        socialMediaLink: ownedClub.socialMediaLink,
      };
    } else if (adminClub) {
      clubInfo = {
        id: adminClub.id,
        name: adminClub.name,
        logo: adminClub.logo,
        description: adminClub.description,
        city: adminClub.city,
        status: adminClub.status,
        userRole: 'administrator',
        joinedAt: adminClub.createdAt,
        socialMediaLink: adminClub.socialMediaLink,
      };
    } else if (memberClub) {
      clubInfo = {
        id: memberClub.id,
        name: memberClub.name,
        logo: memberClub.logo,
        description: memberClub.description,
        city: memberClub.city,
        status: memberClub.status,
        userRole: 'member',
        joinedAt: memberClub.createdAt,
        socialMediaLink: memberClub.socialMediaLink,
      };
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      confirmed: user.confirmed,
      club: clubInfo,
      totalGames: user.totalGames,
      totalWins: user.totalWins,
      totalPoints: user.totalPoints,
      eloRating: user.eloRating,
      totalBonusPoints: user.totalBonusPoints,
      roleStats: roleStats.map(stat => ({
        id: stat.id,
        role: stat.role,
        gamesPlayed: stat.gamesPlayed,
        gamesWon: stat.gamesWon,
        createdAt: stat.createdAt,
        updatedAt: stat.updatedAt,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateMyProfile(userId: number, dto: UpdateUserProfileDto): Promise<UserDTO> {
    return this.usersService.updateProfile(userId, dto);
  }

  async updateAvatar(userId: number, file: Express.Multer.File): Promise<UserDTO> {
    const avatarFilename = await this.filesService.saveAvatar(userId, file);
    
    await this.userRepository.update(userId, { avatar: avatarFilename });
    
    return this.usersService.getUserById(userId);
  }

  async updateUserRole(userId: number, dto: { userId: number; role: UserRole }): Promise<UserDTO> {
    if (dto.userId !== userId) {
      throw new Error('Можно изменять только свою роль');
    }

    await this.userRepository.update(dto.userId, { role: dto.role });
    
    return this.usersService.getUserById(dto.userId);
  }
}
