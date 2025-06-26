import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { ApiRoles } from '../common/decorators/api-roles.decorator';

@ApiTags('Admin - Администрирование системы')
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Управление заявками на клубы
  @Get('club-requests')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Получить все заявки на создание клубов' })
  @ApiResponse({ status: 200, description: 'Список заявок получен' })
  async getClubRequests() {
    return this.adminService.getClubRequests();
  }

  @Put('club-requests/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Одобрить заявку на создание клуба' })
  @ApiResponse({ status: 200, description: 'Заявка одобрена' })
  async approveClubRequest(@Param('id') id: string) {
    return this.adminService.approveClubRequest(+id);
  }

  @Put('club-requests/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Отклонить заявку на создание клуба' })
  @ApiResponse({ status: 200, description: 'Заявка отклонена' })
  async rejectClubRequest(
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ) {
    return this.adminService.rejectClubRequest(+id, body.reason);
  }

  // Статистика системы
  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Получить общую статистику системы' })
  @ApiResponse({ status: 200, description: 'Статистика получена' })
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  // Управление пользователями
  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Получить всех пользователей системы' })
  @ApiResponse({ status: 200, description: 'Список пользователей получен' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Put('users/:id/role')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN])
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
  @ApiRoles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Получить все клубы системы' })
  @ApiResponse({ status: 200, description: 'Список клубов получен' })
  async getAllClubs() {
    return this.adminService.getAllClubs();
  }

  @Delete('clubs/:id')
  @Roles(UserRole.ADMIN)
  @ApiRoles([UserRole.ADMIN])
  @ApiOperation({ summary: 'Удалить клуб' })
  @ApiResponse({ status: 200, description: 'Клуб удален' })
  async deleteClub(@Param('id') id: string) {
    return this.adminService.deleteClub(+id);
  }
} 