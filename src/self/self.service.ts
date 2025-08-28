import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { UserDTO } from '../common/dto/user.dto';
import { UpdateUserProfileDto } from '../common/dto/user.dto';
import { UserRole } from '../common/enums/roles.enum';
import { FilesService } from '../files/files.service';
import { User } from '../users/user.entity';
import { ExtendedUserProfileDto } from '../users/dto/extended-profile.dto';

@Injectable()
export class SelfService {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getMyProfile(userId: number): Promise<UserDTO> {
    return this.usersService.getUserById(userId);
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

  async getMyExtendedProfile(userId: number): Promise<ExtendedUserProfileDto> {
    return this.usersService.getExtendedProfileForUser(userId);
  }
}
