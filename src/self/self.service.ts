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

@Injectable()
export class SelfService {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Club)
    private clubRepository: Repository<Club>,
  ) {}

  async getMyProfile(userId: number): Promise<UserDTO> {
    return this.usersService.getUserById(userId);
  }

  async getMyExtendedProfile(userId: number): Promise<ExtendedUserProfileDto> {
    // Сначала получаем пользователя с базовой информацией
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Ищем клуб, где пользователь является владельцем
    const ownedClub = await this.clubRepository.findOne({
      where: { owner: { id: userId } },
      relations: ['owner', 'administrators'],
    });

    // Ищем клуб, где пользователь является администратором
    const adminClub = await this.clubRepository.findOne({
      where: { administrators: { id: userId } },
      relations: ['owner', 'administrators'],
    });

    // Ищем клуб, где пользователь является участником
    const memberClub = await this.clubRepository.findOne({
      where: { members: { id: userId } },
      relations: ['owner', 'administrators'],
    });

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
      totalKills: user.totalKills,
      totalDeaths: user.totalDeaths,
      mafiaGames: user.mafiaGames,
      mafiaWins: user.mafiaWins,
      citizenGames: user.citizenGames,
      citizenWins: user.citizenWins,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateMyProfile(userId: number, dto: UpdateUserProfileDto): Promise<UserDTO> {
    return this.usersService.updateProfile(userId, dto);
  }

  async updateAvatar(userId: number, file: Express.Multer.File): Promise<UserDTO> {
    const avatarPath = await this.filesService.saveAvatar(userId, file);
    return this.usersService.updateProfile(userId, { avatar: avatarPath });
  }

  async updateUserRole(userId: number, role: UserRole): Promise<UserDTO> {
    return this.usersService.updateUserRole(userId, role);
  }
}
