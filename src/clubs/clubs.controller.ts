import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto, UpdateClubDto, ClubDTO, CreateJoinRequestDto, CreateClubRequestDto, ClubRequestDTO } from './dto';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { User } from '../common/decorators/user.decorator';
import { ApiTags, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ApiRoles } from '../common/decorators/api-roles.decorator';

@ApiTags('Clubs - Управление клубами')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @ApiRoles([UserRole.PLAYER], 'Создать заявку на создание клуба')
  @ApiBody({ type: CreateClubRequestDto })
  @ApiResponse({ status: 201, description: 'Club request created successfully', type: ClubDTO })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('requests')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.PLAYER)
  async createClubRequest(
    @User() user: { id: number },
    @Body() dto: CreateClubRequestDto,
  ): Promise<ClubDTO> {
    return this.clubsService.createClubRequest(user.id, dto);
  }

  @ApiResponse({ status: 200, description: 'Clubs retrieved successfully', type: [ClubDTO] })
  @Get()
  async getAllClubs(): Promise<ClubDTO[]> {
    return this.clubsService.getAllClubs();
  }

  @ApiRoles([UserRole.CLUB_OWNER, UserRole.ADMIN], 'Добавить администратора в клуб')
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Administrator added successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club or user not found' })
  @Post(':id/administrators/:userId')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  async addAdministrator(
    @Param('id') clubId: number,
    @Param('userId') userId: number,
  ): Promise<ClubDTO> {
    return this.clubsService.addAdministrator(clubId, userId);
  }

  @ApiRoles([UserRole.CLUB_OWNER, UserRole.ADMIN], 'Удалить администратора из клуба')
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Administrator removed successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club or user not found' })
  @Delete(':id/administrators/:userId')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  async removeAdministrator(
    @Param('id') clubId: number,
    @Param('userId') userId: number,
  ): Promise<ClubDTO> {
    return this.clubsService.removeAdministrator(clubId, userId);
  }

  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN], 'Добавить участника в клуб')
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Member added successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club or user not found' })
  @Post(':id/members/:userId')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async addMember(
    @Param('id') clubId: number,
    @Param('userId') userId: number,
  ): Promise<ClubDTO> {
    return this.clubsService.addMember(clubId, userId);
  }

  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN], 'Удалить участника из клуба')
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Member removed successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club or user not found' })
  @Delete(':id/members/:userId')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  async removeMember(
    @Param('id') clubId: number,
    @Param('userId') userId: number,
  ): Promise<ClubDTO> {
    return this.clubsService.removeMember(clubId, userId);
  }

  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiResponse({ status: 200, description: 'Club retrieved successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club not found' })
  @Get(':id')
  async getClub(@Param('id') id: number): Promise<ClubDTO> {
    return this.clubsService.getClubById(id);
  }

  @ApiRoles([UserRole.CLUB_OWNER, UserRole.ADMIN], 'Обновить информацию о клубе')
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiBody({ type: UpdateClubDto })
  @ApiResponse({ status: 200, description: 'Club updated successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club not found' })
  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  async updateClub(
    @Param('id') id: number,
    @Body() dto: UpdateClubDto,
  ): Promise<ClubDTO> {
    return this.clubsService.updateClub(id, dto);
  }

  @ApiRoles([UserRole.PLAYER], 'Создать заявку на вступление в клуб')
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiBody({ type: CreateJoinRequestDto })
  @ApiResponse({ status: 201, description: 'Join request created successfully', type: ClubRequestDTO })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':id/join')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.PLAYER)
  async createJoinRequest(
    @User() user: { id: number },
    @Param('id') clubId: number,
    @Body() dto: CreateJoinRequestDto,
  ): Promise<ClubRequestDTO> {
    return this.clubsService.createJoinRequest(user.id, clubId, dto);
  }

  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN], 'Одобрить заявку на вступление')
  @ApiParam({ name: 'id', type: 'number', description: 'Join request ID' })
  @ApiResponse({ status: 200, description: 'Join request approved successfully', type: ClubRequestDTO })
  @ApiResponse({ status: 404, description: 'Join request not found' })
  @Put('requests/:id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async approveJoinRequest(
    @User() user: { id: number },
    @Param('id') requestId: number,
  ): Promise<ClubRequestDTO> {
    return this.clubsService.approveJoinRequest(requestId, user.id);
  }

  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN], 'Отклонить заявку на вступление')
  @ApiParam({ name: 'id', type: 'number', description: 'Join request ID' })
  @ApiResponse({ status: 200, description: 'Join request rejected successfully', type: ClubRequestDTO })
  @ApiResponse({ status: 404, description: 'Join request not found' })
  @Put('requests/:id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async rejectJoinRequest(
    @User() user: { id: number },
    @Param('id') requestId: number,
  ): Promise<ClubRequestDTO> {
    return this.clubsService.rejectJoinRequest(requestId, user.id);
  }

  @ApiRoles([UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN], 'Получить все заявки на вступление в клуб')
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiResponse({ status: 200, description: 'Join requests retrieved successfully', type: [ClubRequestDTO] })
  @ApiResponse({ status: 404, description: 'Club not found' })
  @Get(':id/requests')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async getClubJoinRequests(@Param('id') clubId: number): Promise<ClubRequestDTO[]> {
    return this.clubsService.getClubJoinRequests(clubId);
  }

  @ApiRoles([UserRole.PLAYER], 'Получить все свои заявки на вступление')
  @ApiResponse({ status: 200, description: 'Join requests retrieved successfully', type: [ClubRequestDTO] })
  @Get('requests/my')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.PLAYER)
  async getMyJoinRequests(@User() user: { id: number }): Promise<ClubRequestDTO[]> {
    return this.clubsService.getUserJoinRequests(user.id);
  }
} 