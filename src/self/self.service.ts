import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserDTO } from '../common/dto/user.dto';
import { UpdateUserProfileDto } from '../common/dto/user.dto';
import { UserRole } from '../common/enums/roles.enum';
import { FilesService } from '../files/files.service';

@Injectable()
export class SelfService {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  async getMyProfile(userId: number): Promise<UserDTO> {
    return this.usersService.getUserById(userId);
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
