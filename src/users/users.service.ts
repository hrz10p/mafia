import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from 'src/common/dto/auth.dto';
import { LoginDto } from 'src/common/dto/auth.dto';
import { UserMapper } from '../common/utils/mapper';
import { UserDTO, UpdateUserProfileDto} from 'src/common/dto/user.dto';
import { UserRole } from '../common/enums/roles.enum';
import { UserSearchResultDto } from './dto/search-users.dto';
import { GetAllPlayersQueryDto, GetAllPlayersResponseDto, PlayerDto } from './dto/get-all-players.dto';
import { UserRoleStatsService } from './user-role-stats.service';
import { UserDetailedStatsDto } from './dto/user-role-stats.dto';
import { ExtendedUserProfileDto } from './dto/extended-profile.dto';
import { Club } from 'src/clubs/club.entity';
import { ClubInfoDto } from 'src/self/dto/club-info';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userRoleStatsService: UserRoleStatsService,
    @InjectRepository(Club)
    private clubRepository: Repository<Club>,
  ) {}

  async createUser(dto: SignupDto): Promise<UserDTO> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      nickname: dto.nickname,
    });

    const savedUser = await this.userRepository.save(user);

    // Инициализируем статистику по ролям для нового пользователя
    await this.userRoleStatsService.initializeUserRoleStats(savedUser.id);

    return UserMapper.toDTO(savedUser);
  }

  async confirmUser(email: string): Promise<UserDTO | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    user.confirmed = true;
    const updatedUser = await this.userRepository.save(user);
    return UserMapper.toDTO(updatedUser);
  }

  async updateProfile(userId: number, dto: UpdateUserProfileDto): Promise<UserDTO> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (dto.nickname) user.nickname = dto.nickname;
    if (dto.avatar) user.avatar = dto.avatar;

    const updatedUser = await this.userRepository.save(user);
    return UserMapper.toDTO(updatedUser);
  }

  async getUserById(userId: number): Promise<UserDTO> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return UserMapper.toDTO(user);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async validateUser(dto: LoginDto): Promise<UserDTO | null> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (user && (await bcrypt.compare(dto.password, user.password))) {
      return UserMapper.toDTO(user);
    }
    return null;
  }

  async searchUsersByEmail(email: string, limit: number = 10): Promise<UserSearchResultDto[]> {
    const users = await this.userRepository.find({
      where: {
        email: Like(`%${email}%`),
      },
      relations: ['club'],
      take: limit,
      order: { email: 'ASC' },
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.nickname || user.email,
      role: user.role,
      club: user.club?.name,
    }));
  }

  async searchUsers(query: string): Promise<UserSearchResultDto[]> {
    const users = await this.userRepository.find({
      where: [
        { nickname: Like(`%${query}%`) },
        { email: Like(`%${query}%`) },
      ],
      relations: ['club'],
      take: 10,
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.nickname || user.email,
      role: user.role,
      club: user.club?.name,
    }));
  }

  async getAllPlayers(query: GetAllPlayersQueryDto): Promise<GetAllPlayersResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      sortBy = 'nickname',
      sortOrder = 'ASC'
    } = query;

    const skip = (page - 1) * limit;

    // Строим условия поиска
    const whereConditions: any = {};
    
    if (search) {
      whereConditions.nickname = Like(`%${search}%`);
    }
    
    if (role) {
      whereConditions.role = role;
    }

    // Получаем общее количество игроков
    const total = await this.userRepository.count({ 
      where: whereConditions 
    });

    // Получаем игроков с пагинацией и сортировкой
    const players = await this.userRepository.find({
      where: whereConditions,
      relations: ['club'],
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
    });

    // Преобразуем в DTO
    const playersDto: PlayerDto[] = players.map(player => ({
      id: player.id,
      email: player.email,
      nickname: player.nickname,
      avatar: player.avatar,
      role: player.role,
      confirmed: player.confirmed,
      clubName: player.club?.name,
      totalGames: player.totalGames,
      totalWins: player.totalWins,
      totalPoints: player.totalPoints,
      eloRating: player.eloRating,
      totalBonusPoints: player.totalBonusPoints,
      tournamentsParticipated: player.tournamentsParticipated,
      createdAt: player.createdAt,
    }));

    return {
      players: playersDto,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserDetailedStats(userId: number): Promise<UserDetailedStatsDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roleStats']
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const roleStats = await this.userRoleStatsService.getUserRoleStats(userId);

    return {
      id: user.id,
      nickname: user.nickname,
      generalStats: {
        totalGames: user.totalGames,
        totalWins: user.totalWins,
        totalPoints: user.totalPoints,
        eloRating: user.eloRating,
        totalBonusPoints: user.totalBonusPoints,
      },
      roleStats: roleStats.map(stat => ({
        id: stat.id,
        role: stat.role,
        gamesPlayed: stat.gamesPlayed,
        gamesWon: stat.gamesWon,
        createdAt: stat.createdAt,
        updatedAt: stat.updatedAt,
      }))
    };
  }

  async getExtendedProfileForUser(userId: number): Promise<ExtendedUserProfileDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['club'],
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const roleStats = await this.userRoleStatsService.getUserRoleStats(userId);

    const ownedClub = await this.clubRepository.findOne({
      where: { owner: { id: userId } },
    });

    const adminClub = await this.clubRepository
      .createQueryBuilder('club')
      .innerJoin('club.administrators', 'admin')
      .where('admin.id = :userId', { userId })
      .getOne();

    const memberClub = await this.clubRepository
      .createQueryBuilder('club')
      .innerJoin('club.members', 'member')
      .where('member.id = :userId', { userId })
      .getOne();

    let clubInfo: ClubInfoDto | undefined;

    if (ownedClub) {
      const elo = this.calculateClubElo(ownedClub);
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
        elo,
      };
    } else if (adminClub) {
      const elo = this.calculateClubElo(adminClub);
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
        elo,
      };
    } else if (memberClub) {
      const elo = this.calculateClubElo(memberClub);
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
        elo,
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
      tournamentsParticipated: user.tournamentsParticipated,
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

  private calculateClubElo(club: any): number {
    // Get all unique members (owner + administrators + members)
    const allMembers = new Set<any>();
    
    // Add owner
    if (club.owner) {
      allMembers.add(club.owner);
    }
    
    // Add administrators
    if (club.administrators) {
      club.administrators.forEach(admin => allMembers.add(admin));
    }
    
    // Add members
    if (club.members) {
      club.members.forEach(member => allMembers.add(member));
    }
    
    // Convert Set to Array and calculate average ELO
    const membersArray = Array.from(allMembers);
    
    if (membersArray.length === 0) {
      return 0; // Default ELO if no members
    }
    
    const totalElo = membersArray.reduce((sum, member) => sum + (member.eloRating || 0), 0);
    return Math.round(totalElo / membersArray.length);
  }
}
