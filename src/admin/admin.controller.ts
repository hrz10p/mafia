import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { ApiRoles } from '../common/decorators/api-roles.decorator';
import { Club } from '../clubs/club.entity';

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
} 