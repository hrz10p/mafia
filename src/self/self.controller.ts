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
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ExtendedUserProfileDto } from './dto/extended-profile.dto';

@ApiTags('Self')
@ApiBearerAuth()
@Controller('self')
@UseGuards(AuthGuard, RolesGuard)
export class SelfController {
  constructor(private readonly selfService: SelfService) {}

  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Returns detailed user profile with club information if user is club owner, administrator or member. Shows complete player statistics and club details including role in club.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile retrieved successfully with club information', 
    type: ExtendedUserProfileDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('profile')
  @Roles(UserRole.PLAYER, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  async getMyProfile(@User() user: { id: number }): Promise<ExtendedUserProfileDto> {
    return this.selfService.getMyExtendedProfile(user.id);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserDTO })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Put('profile')
  @Roles(UserRole.PLAYER, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  async updateMyProfile(
    @User() user: { id: number },
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserDTO> {
    return this.selfService.updateMyProfile(user.id, dto);
  }

  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully', type: UserDTO })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('avatar')
  @Roles(UserRole.PLAYER, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @User() user: { id: number },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserDTO> {
    return this.selfService.updateAvatar(user.id, file);
  }

  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        role: { type: 'string', enum: Object.values(UserRole) },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Role updated successfully', type: UserDTO })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Put('role')
  @Roles(UserRole.ADMIN)
  async updateUserRole(
    @User() user: { id: number },
    @Body() dto: { userId: number; role: UserRole },
  ): Promise<UserDTO> {
    return this.selfService.updateUserRole(dto.userId, dto);
  }
}
