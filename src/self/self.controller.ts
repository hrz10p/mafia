import { Controller, Get, Put, Body, UseGuards, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { SelfService } from './self.service';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../common/decorators/user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateUserProfileDto } from '../common/dto/user.dto';
import { UserDTO } from '../common/dto/user.dto';
import { UserRole } from '../common/enums/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('self')
@UseGuards(AuthGuard, RolesGuard)
export class SelfController {
  constructor(private readonly selfService: SelfService) {}

  @Get('profile')
  @Roles(UserRole.PLAYER, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  async getMyProfile(@User() user: { id: number }): Promise<UserDTO> {
    return this.selfService.getMyProfile(user.id);
  }

  @Put('profile')
  @Roles(UserRole.PLAYER, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  async updateMyProfile(
    @User() user: { id: number },
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserDTO> {
    return this.selfService.updateMyProfile(user.id, dto);
  }

  @Post('avatar')
  @Roles(UserRole.PLAYER, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @User() user: { id: number },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserDTO> {
    return this.selfService.updateAvatar(user.id, file);
  }

  @Put('role')
  @Roles(UserRole.ADMIN)
  async updateUserRole(
    @User() user: { id: number },
    @Body() dto: { userId: number; role: UserRole },
  ): Promise<UserDTO> {
    return this.selfService.updateUserRole(dto.userId, dto.role);
  }
}
