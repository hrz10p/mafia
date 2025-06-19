import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto, UpdateClubDto, ClubDTO } from './dto/club.dto';
import { CreateJoinRequestDto, CreateClubRequestDto, ClubRequestDTO } from './dto/club-request.dto';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { User } from '../common/decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Clubs')
@ApiBearerAuth()
@Controller('clubs')
@UseGuards(AuthGuard, RolesGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @ApiOperation({ summary: 'Create a new club request' })
  @ApiBody({ type: CreateClubRequestDto })
  @ApiResponse({ status: 201, description: 'Club request created successfully', type: ClubDTO })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('requests')
  @Roles(UserRole.PLAYER)
  async createClubRequest(
    @User() user: { id: number },
    @Body() dto: CreateClubRequestDto,
  ): Promise<ClubDTO> {
    return this.clubsService.createClubRequest(user.id, dto);
  }

  @ApiOperation({ summary: 'Approve a club request' })
  @ApiParam({ name: 'id', type: 'number', description: 'Club request ID' })
  @ApiResponse({ status: 200, description: 'Club request approved successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club request not found' })
  @Put('requests/:id/approve')
  @Roles(UserRole.ADMIN)
  async approveClubRequest(@Param('id') id: number): Promise<ClubDTO> {
    return this.clubsService.approveClubRequest(id);
  }

  @ApiOperation({ summary: 'Reject a club request' })
  @ApiParam({ name: 'id', type: 'number', description: 'Club request ID' })
  @ApiResponse({ status: 200, description: 'Club request rejected successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club request not found' })
  @Put('requests/:id/reject')
  @Roles(UserRole.ADMIN)
  async rejectClubRequest(@Param('id') id: number): Promise<ClubDTO> {
    return this.clubsService.rejectClubRequest(id);
  }

  @ApiOperation({ summary: 'Add an administrator to a club' })
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Administrator added successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club or user not found' })
  @Post(':id/administrators/:userId')
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  async addAdministrator(
    @Param('id') clubId: number,
    @Param('userId') userId: number,
  ): Promise<ClubDTO> {
    return this.clubsService.addAdministrator(clubId, userId);
  }

  @ApiOperation({ summary: 'Remove an administrator from a club' })
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Administrator removed successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club or user not found' })
  @Delete(':id/administrators/:userId')
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  async removeAdministrator(
    @Param('id') clubId: number,
    @Param('userId') userId: number,
  ): Promise<ClubDTO> {
    return this.clubsService.removeAdministrator(clubId, userId);
  }

  @ApiOperation({ summary: 'Add a member to a club' })
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Member added successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club or user not found' })
  @Post(':id/members/:userId')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async addMember(
    @Param('id') clubId: number,
    @Param('userId') userId: number,
  ): Promise<ClubDTO> {
    return this.clubsService.addMember(clubId, userId);
  }

  @ApiOperation({ summary: 'Remove a member from a club' })
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Member removed successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club or user not found' })
  @Delete(':id/members/:userId')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  async removeMember(
    @Param('id') clubId: number,
    @Param('userId') userId: number,
  ): Promise<ClubDTO> {
    return this.clubsService.removeMember(clubId, userId);
  }

  @ApiOperation({ summary: 'Get club by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiResponse({ status: 200, description: 'Club retrieved successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club not found' })
  @Get(':id')
  @Roles(UserRole.PLAYER, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  async getClub(@Param('id') id: number): Promise<ClubDTO> {
    return this.clubsService.getClubById(id);
  }

  @ApiOperation({ summary: 'Update club information' })
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiBody({ type: UpdateClubDto })
  @ApiResponse({ status: 200, description: 'Club updated successfully', type: ClubDTO })
  @ApiResponse({ status: 404, description: 'Club not found' })
  @Put(':id')
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  async updateClub(
    @Param('id') id: number,
    @Body() dto: UpdateClubDto,
  ): Promise<ClubDTO> {
    return this.clubsService.updateClub(id, dto);
  }

  @ApiOperation({ summary: 'Create a join request for a club' })
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiBody({ type: CreateJoinRequestDto })
  @ApiResponse({ status: 201, description: 'Join request created successfully', type: ClubRequestDTO })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':id/join')
  @Roles(UserRole.PLAYER)
  async createJoinRequest(
    @User() user: { id: number },
    @Param('id') clubId: number,
    @Body() dto: CreateJoinRequestDto,
  ): Promise<ClubRequestDTO> {
    return this.clubsService.createJoinRequest(user.id, clubId, dto);
  }

  @ApiOperation({ summary: 'Approve a join request' })
  @ApiParam({ name: 'id', type: 'number', description: 'Join request ID' })
  @ApiResponse({ status: 200, description: 'Join request approved successfully', type: ClubRequestDTO })
  @ApiResponse({ status: 404, description: 'Join request not found' })
  @Put('requests/:id/approve')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async approveJoinRequest(
    @User() user: { id: number },
    @Param('id') requestId: number,
  ): Promise<ClubRequestDTO> {
    return this.clubsService.approveJoinRequest(requestId, user.id);
  }

  @ApiOperation({ summary: 'Reject a join request' })
  @ApiParam({ name: 'id', type: 'number', description: 'Join request ID' })
  @ApiResponse({ status: 200, description: 'Join request rejected successfully', type: ClubRequestDTO })
  @ApiResponse({ status: 404, description: 'Join request not found' })
  @Put('requests/:id/reject')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async rejectJoinRequest(
    @User() user: { id: number },
    @Param('id') requestId: number,
  ): Promise<ClubRequestDTO> {
    return this.clubsService.rejectJoinRequest(requestId, user.id);
  }

  @ApiOperation({ summary: 'Get all join requests for a club' })
  @ApiParam({ name: 'id', type: 'number', description: 'Club ID' })
  @ApiResponse({ status: 200, description: 'Join requests retrieved successfully', type: [ClubRequestDTO] })
  @ApiResponse({ status: 404, description: 'Club not found' })
  @Get(':id/requests')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async getClubJoinRequests(@Param('id') clubId: number): Promise<ClubRequestDTO[]> {
    return this.clubsService.getClubJoinRequests(clubId);
  }

  @ApiOperation({ summary: 'Get all join requests created by the current user' })
  @ApiResponse({ status: 200, description: 'Join requests retrieved successfully', type: [ClubRequestDTO] })
  @Get('requests/my')
  @Roles(UserRole.PLAYER)
  async getMyJoinRequests(@User() user: { id: number }): Promise<ClubRequestDTO[]> {
    return this.clubsService.getUserJoinRequests(user.id);
  }
} 