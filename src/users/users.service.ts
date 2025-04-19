import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from 'src/common/dto/auth.dto';
import { LoginDto } from 'src/common/dto/auth.dto';
import { UserMapper } from '../common/utils/mapper';
import { UserDTO, UpdateUserProfileDto} from 'src/common/dto/user.dto';
import { UserRole } from '../common/enums/roles.enum';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(dto: SignupDto): Promise<UserDTO> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      nickname: dto.nickname,
      avatar: 'default-avatar.png',
      confirmed: false,
      role: UserRole.PLAYER,
    });

    const savedUser = await this.userRepository.save(user);
    return UserMapper.toDTO(savedUser);
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

  async confirmUser(email: string): Promise<UserDTO | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || user.confirmed) {
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

  async updateUserRole(userId: number, role: UserRole): Promise<UserDTO> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.role = role;
    const updatedUser = await this.userRepository.save(user);
    return UserMapper.toDTO(updatedUser);
  }
}
