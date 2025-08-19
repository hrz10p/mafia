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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userRoleStatsService: UserRoleStatsService,
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
      whereConditions.nickname = Like(`%${query}%`);
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
}
