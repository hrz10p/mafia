import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto, UpdateClubDto, ClubDTO } from './dto/club.dto';
import { CreateJoinRequestDto, ClubRequestDTO } from './dto/club-request.dto';
import { AuthGuard } from '../auth/authGuard.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { User } from '../common/decorators/user.decorator';

@Controller('clubs')
@UseGuards(AuthGuard, RolesGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  @Roles(UserRole.PLAYER)
  async createClubRequest(
    @User() user: { id: number },
    @Body() dto: CreateClubDto,
  ): Promise<ClubDTO> {
    return this.clubsService.createClubRequest(user.id, dto);
  }

  @Put(':id/approve')
  @Roles(UserRole.ADMIN)
  async approveClubRequest(@Param('id') id: number): Promise<ClubDTO> {
    return this.clubsService.approveClubRequest(id);
  }

  @Put(':id/reject')
  @Roles(UserRole.ADMIN)
  async rejectClubRequest(@Param('id') id: number): Promise<ClubDTO> {
    return this.clubsService.rejectClubRequest(id);
  }


  // for now dont use this endpoint
  @Post(':id/members/:userId')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async addMember(
    @Param('id') clubId: number,
    @Param('userId') userId: number,
    @Body('asAdmin') asAdmin: boolean,
  ): Promise<ClubDTO> {
    return this.clubsService.addMember(clubId, userId, asAdmin);
  }

  @Delete(':id/members/:userId')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN, UserRole.ADMIN)
  async removeMember(
    @Param('id') clubId: number,
    @Param('userId') userId: number,
  ): Promise<ClubDTO> {
    return this.clubsService.removeMember(clubId, userId);
  }

  @Get(':id')
  @Roles(UserRole.PLAYER, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN)
  async getClub(@Param('id') id: number): Promise<ClubDTO> {
    return this.clubsService.getClubById(id);
  }

  @Put(':id')
  @Roles(UserRole.CLUB_OWNER, UserRole.ADMIN)
  async updateClub(
    @Param('id') id: number,
    @Body() dto: UpdateClubDto,
  ): Promise<ClubDTO> {
    return this.clubsService.updateClub(id, dto);
  }

  @Post(':id/join')
  @Roles(UserRole.PLAYER)
  async createJoinRequest(
    @User() user: { id: number },
    @Param('id') clubId: number,
    @Body() dto: CreateJoinRequestDto,
  ): Promise<ClubRequestDTO> {
    return this.clubsService.createJoinRequest(user.id, clubId, dto);
  }

  @Put('requests/:id/approve')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async approveJoinRequest(
    @User() user: { id: number },
    @Param('id') requestId: number,
  ): Promise<ClubRequestDTO> {
    return this.clubsService.approveJoinRequest(requestId, user.id);
  }

  @Put('requests/:id/reject')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async rejectJoinRequest(
    @User() user: { id: number },
    @Param('id') requestId: number,
  ): Promise<ClubRequestDTO> {
    return this.clubsService.rejectJoinRequest(requestId, user.id);
  }

  @Get(':id/requests')
  @Roles(UserRole.CLUB_OWNER, UserRole.CLUB_ADMIN)
  async getClubJoinRequests(@Param('id') clubId: number): Promise<ClubRequestDTO[]> {
    return this.clubsService.getClubJoinRequests(clubId);
  }

  @Get('requests/my')
  @Roles(UserRole.PLAYER)
  async getMyJoinRequests(@User() user: { id: number }): Promise<ClubRequestDTO[]> {
    return this.clubsService.getUserJoinRequests(user.id);
  }
} 