import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { ApiRoles } from '../common/decorators/api-roles.decorator';
import { Club } from '../clubs/club.entity';
import { AdminUpdateUserDto } from './dto/update-user.dto';

@ApiTags('Admin - Администрирование системы')
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Управление заявками на клубы (клубы со статусом PENDING)
  @Get('club-requests')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN], 'Получить все клубы в статусе PENDING')
  @ApiOperation({ summary: 'Получить все клубы в статусе PENDING' })
  @ApiResponse({ status: 200, description: 'Список клубов в статусе PENDING', type: [Club] })
  async getClubRequests() {
    return this.adminService.getClubRequests();
  }

  @Put('club-requests/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN], 'Одобрить клуб и назначить владельца')
  @ApiOperation({ summary: 'Одобрить клуб и назначить владельца' })
  @ApiResponse({ status: 200, description: 'Клуб одобрен, владелец назначен', type: Club })
  async approveClubRequest(@Param('id') id: string) {
    return this.adminService.approveClubRequest(+id);
  }

  @Put('club-requests/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN], 'Отклонить клуб')
  @ApiOperation({ summary: 'Отклонить клуб' })
  @ApiResponse({ status: 200, description: 'Клуб отклонен', type: Club })
  async rejectClubRequest(
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ) {
    return this.adminService.rejectClubRequest(+id, body.reason);
  }

  // Статистика системы
  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN], 'Получить статистику системы')
  @ApiOperation({ summary: 'Получить общую статистику системы' })
  @ApiResponse({ status: 200, description: 'Статистика получена' })
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  // Управление пользователями
  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN], 'Получить всех пользователей')
  @ApiOperation({ summary: 'Получить всех пользователей системы' })
  @ApiResponse({ status: 200, description: 'Список пользователей получен' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Put('users/:id/role')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN], 'Изменить роль пользователя')
  @ApiOperation({ summary: 'Изменить роль пользователя' })
  @ApiResponse({ status: 200, description: 'Роль пользователя изменена' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: UserRole }
  ) {
    return this.adminService.updateUserRole(+id, body.role);
  }

  @Delete('users/:id')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN], 'Удалить пользователя')
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiResponse({ 
    status: 200, 
    description: 'Пользователь успешно удален',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Пользователь успешно удален' },
        deletedUser: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 123 },
            nickname: { type: 'string', example: 'player123' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(+id);
  }

  // Управление клубами
  @Get('clubs')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN], 'Получить все клубы')
  @ApiOperation({ summary: 'Получить все клубы системы' })
  @ApiResponse({ status: 200, description: 'Список клубов получен', type: [Club] })
  async getAllClubs() {
    return this.adminService.getAllClubs();
  }

  @Delete('clubs/:id')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN], 'Удалить клуб')
  @ApiOperation({ summary: 'Удалить клуб' })
  @ApiResponse({ status: 200, description: 'Клуб удален' })
  async deleteClub(@Param('id') id: string) {
    return this.adminService.deleteClub(+id);
  }

  // Reset all players ELO
  @Post('reset-elo')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN], 'Сбросить ELO всех игроков')
  @ApiOperation({ summary: 'Сбросить ELO всех игроков до 1000' })
  @ApiResponse({ 
    status: 200, 
    description: 'ELO всех игроков сброшен',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'All players ELO has been reset to 1000' },
        affectedUsers: { type: 'number', example: 150 }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async resetAllPlayersElo() {
    return this.adminService.resetAllPlayersElo();
  }

  // Update basic user profile fields (email, nickname)
  @Put('users/:id/profile')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN], 'Обновить профиль пользователя (email, ник)')
  @ApiOperation({ summary: 'Обновить профиль пользователя (email, ник)' })
  @ApiResponse({ status: 200, description: 'Профиль пользователя обновлен' })
  async updateUserProfile(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUserProfileBasic(+id, dto);
  }
} 