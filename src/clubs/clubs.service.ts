import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club, ClubStatus } from './club.entity';
import { ClubRequest, ClubRequestStatus, ClubRequestType } from './club-request.entity';
import { User } from '../users/user.entity';
import { CreateClubDto, UpdateClubDto, ClubDTO } from './dto/club.dto';
import { CreateJoinRequestDto, CreateClubRequestDto, ClubRequestDTO } from './dto/club-request.dto';
import { UserRole } from '../common/enums/roles.enum';
import { UsersService } from '../users/users.service';
import { UserMapper } from 'src/common/utils/mapper';

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(Club)
    private clubRepository: Repository<Club>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ClubRequest)
    private clubRequestRepository: Repository<ClubRequest>,
    private usersService: UsersService,
  ) {}

  async createClubRequest(userId: number, dto: CreateClubRequestDto): Promise<ClubDTO> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.club) {
      throw new BadRequestException('User already belongs to a club');
    }

    const club = this.clubRepository.create({
      ...dto,
      owner: user,
      status: ClubStatus.PENDING,
    });

    const savedClub = await this.clubRepository.save(club);
    return this.toDTO(savedClub);
  }

  async approveClubRequest(clubId: number): Promise<ClubDTO> {
    const club = await this.clubRepository.findOne({ 
      where: { id: clubId },
      relations: ['owner', 'members', 'administrators'] 
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    if (club.status !== ClubStatus.PENDING) {
      throw new BadRequestException('Club is not in pending status');
    }

    // Update club status
    club.status = ClubStatus.APPROVED;
    
    // Update owner role to CLUB_OWNER
    club.owner.role = UserRole.CLUB_OWNER;
    await this.userRepository.save(club.owner);

    const savedClub = await this.clubRepository.save(club);
    return this.toDTO(savedClub);
  }

  async rejectClubRequest(clubId: number): Promise<ClubDTO> {
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    club.status = ClubStatus.REJECTED;
    const savedClub = await this.clubRepository.save(club);
    return this.toDTO(savedClub);
  }

  async addAdministrator(clubId: number, userId: number): Promise<ClubDTO> {
    const [club, user] = await Promise.all([
      this.clubRepository.findOne({ 
        where: { id: clubId },
        relations: ['owner', 'administrators', 'members']
      }),
      this.userRepository.findOne({ where: { id: userId } })
    ]);

    if (!club) throw new NotFoundException('Club not found');
    if (!user) throw new NotFoundException('User not found');
    if (club.status !== ClubStatus.APPROVED) {
      throw new BadRequestException('Club is not approved');
    }
    if (!club.members.some(member => member.id === userId)) {
      throw new BadRequestException('User must be a club member to become an administrator');
    }
    if (club.administrators.some(admin => admin.id === userId)) {
      throw new BadRequestException('User is already an administrator');
    }

    club.administrators = [...club.administrators, user];
    user.role = UserRole.CLUB_ADMIN;

    await Promise.all([
      this.clubRepository.save(club),
      this.userRepository.save(user)
    ]);

    return this.getClubById(clubId);
  }

  async removeAdministrator(clubId: number, userId: number): Promise<ClubDTO> {
    const [club, user] = await Promise.all([
      this.clubRepository.findOne({ 
        where: { id: clubId },
        relations: ['owner', 'administrators', 'members']
      }),
      this.userRepository.findOne({ where: { id: userId } })
    ]);

    if (!club) throw new NotFoundException('Club not found');
    if (!user) throw new NotFoundException('User not found');
    if (club.owner.id === userId) {
      throw new BadRequestException('Cannot remove club owner from administrators');
    }
    if (!club.administrators.some(admin => admin.id === userId)) {
      throw new BadRequestException('User is not an administrator');
    }

    club.administrators = club.administrators.filter(admin => admin.id !== userId);
    user.role = UserRole.PLAYER;

    await Promise.all([
      this.clubRepository.save(club),
      this.userRepository.save(user)
    ]);

    return this.getClubById(clubId);
  }

  async addMember(clubId: number, userId: number): Promise<ClubDTO> {
    const [club, user] = await Promise.all([
      this.clubRepository.findOne({ 
        where: { id: clubId },
        relations: ['members']
      }),
      this.userRepository.findOne({ where: { id: userId } })
    ]);

    if (!club) throw new NotFoundException('Club not found');
    if (!user) throw new NotFoundException('User not found');
    if (club.status !== ClubStatus.APPROVED) {
      throw new BadRequestException('Club is not approved');
    }
    if (club.members?.some(member => member.id === userId)) {
      throw new BadRequestException('User is already a member of this club');
    }

    club.members = club.members ? [...club.members, user] : [user];
    await this.clubRepository.save(club);

    return this.getClubById(clubId);
  }

  async removeMember(clubId: number, userId: number): Promise<ClubDTO> {
    const [club, user] = await Promise.all([
      this.clubRepository.findOne({ 
        where: { id: clubId },
        relations: ['owner', 'members', 'administrators']
      }),
      this.userRepository.findOne({ where: { id: userId } })
    ]);

    if (!club) throw new NotFoundException('Club not found');
    if (!user) throw new NotFoundException('User not found');
    if (club.owner.id === userId) {
      throw new BadRequestException('Cannot remove club owner');
    }
    if (!club.members?.some(member => member.id === userId)) {
      throw new BadRequestException('User is not a member of this club');
    }

    // Remove from members
    club.members = club.members.filter(member => member.id !== userId);
    
    // If user is an administrator, remove from administrators
    if (club.administrators?.some(admin => admin.id === userId)) {
      club.administrators = club.administrators.filter(admin => admin.id !== userId);
      user.role = UserRole.PLAYER;
    }

    await Promise.all([
      this.clubRepository.save(club),
      this.userRepository.save(user)
    ]);

    return this.getClubById(clubId);
  }

  async getClubById(clubId: number): Promise<ClubDTO> {
    const club = await this.clubRepository.findOne({
      where: { id: clubId },
      relations: ['owner', 'members', 'administrators']
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    return this.toDTO(club);
  }

  async updateClub(clubId: number, dto: UpdateClubDto): Promise<ClubDTO> {
    const club = await this.clubRepository.findOne({ 
      where: { id: clubId },
      relations: ['owner', 'members', 'administrators']
    });
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    Object.assign(club, dto);
    const savedClub = await this.clubRepository.save(club);
    return this.toDTO(savedClub);
  }

  async createJoinRequest(userId: number, clubId: number, dto: CreateJoinRequestDto): Promise<ClubRequestDTO> {
    const [user, club] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.clubRepository.findOne({ 
        where: { id: clubId },
        relations: ['members', 'administrators']
      })
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!club) throw new NotFoundException('Club not found');
    if (club.status !== ClubStatus.APPROVED) {
      throw new BadRequestException('Club is not approved');
    }
    if (club.members?.some(member => member.id === userId)) {
      throw new BadRequestException('User is already a member of this club');
    }

    // Check if there's already a pending request
    const existingRequest = await this.clubRequestRepository.findOne({
      where: {
        user: { id: userId },
        club: { id: clubId },
        status: ClubRequestStatus.PENDING,
        type: ClubRequestType.MEMBERSHIP
      }
    });

    if (existingRequest) {
      throw new BadRequestException('Join request already exists');
    }

    const request = this.clubRequestRepository.create({
      user,
      club,
      message: dto.message,
      status: ClubRequestStatus.PENDING,
      type: ClubRequestType.MEMBERSHIP
    });

    const savedRequest = await this.clubRequestRepository.save(request);
    return this.toRequestDTO(savedRequest);
  }

  async approveJoinRequest(requestId: number, actorId: number): Promise<ClubRequestDTO> {
    const request = await this.clubRequestRepository.findOne({
      where: { id: requestId },
      relations: ['club', 'club.owner', 'club.administrators', 'user']
    });

    if (!request) throw new NotFoundException('Join request not found');
    if (request.status !== ClubRequestStatus.PENDING) {
      throw new BadRequestException('Request is not in pending status');
    }

    // Verify that actor is club owner or admin
    const actor = await this.userRepository.findOne({ 
      where: { id: actorId }
    });

    if (!actor) {
      throw new ForbiddenException('User not found');
    }

    // Check if actor is admin or club owner/administrator
    const isAdmin = actor.role === UserRole.ADMIN;
    const isClubOwner = request.club.owner?.id === actorId;
    const isClubAdmin = request.club.administrators?.some(admin => admin.id === actorId);

    if (!isAdmin && !isClubOwner && !isClubAdmin) {
      throw new ForbiddenException('Not authorized to manage this club');
    }

    request.status = ClubRequestStatus.APPROVED;
    
    // Add user to club members
    const club = await this.clubRepository.findOne({
      where: { id: request.club.id },
      relations: ['members']
    });
    club.members = club.members ? [...club.members, request.user] : [request.user];
    
    await Promise.all([
      this.clubRequestRepository.save(request),
      this.clubRepository.save(club)
    ]);

    return this.toRequestDTO(request);
  }

  async rejectJoinRequest(requestId: number, actorId: number): Promise<ClubRequestDTO> {
    const request = await this.clubRequestRepository.findOne({
      where: { id: requestId },
      relations: ['club', 'club.owner', 'club.administrators', 'user']
    });

    if (!request) throw new NotFoundException('Join request not found');
    if (request.status !== ClubRequestStatus.PENDING) {
      throw new BadRequestException('Request is not in pending status');
    }

    // Verify that actor is club owner or admin
    const actor = await this.userRepository.findOne({ 
      where: { id: actorId }
    });

    if (!actor) {
      throw new ForbiddenException('User not found');
    }

    // Check if actor is admin or club owner/administrator
    const isAdmin = actor.role === UserRole.ADMIN;
    const isClubOwner = request.club.owner?.id === actorId;
    const isClubAdmin = request.club.administrators?.some(admin => admin.id === actorId);

    if (!isAdmin && !isClubOwner && !isClubAdmin) {
      throw new ForbiddenException('Not authorized to manage this club');
    }

    request.status = ClubRequestStatus.REJECTED;
    await this.clubRequestRepository.save(request);

    return this.toRequestDTO(request);
  }

  async getClubJoinRequests(clubId: number): Promise<ClubRequestDTO[]> {
    const requests = await this.clubRequestRepository.find({
      where: { 
        club: { id: clubId },
        type: ClubRequestType.MEMBERSHIP
      },
      relations: ['user', 'club']
    });

    return requests.map(request => this.toRequestDTO(request));
  }

  async getUserJoinRequests(userId: number): Promise<ClubRequestDTO[]> {
    const requests = await this.clubRequestRepository.find({
      where: { user: { id: userId }, type: ClubRequestType.MEMBERSHIP },
      relations: ['club'],
    });
    return requests.map(request => this.toRequestDTO(request));
  }

  async getAllClubs(): Promise<ClubDTO[]> {
    const clubs = await this.clubRepository.find({
      relations: ['owner', 'administrators', 'members'],
      order: { createdAt: 'DESC' },
    });
    return clubs.map(club => this.toDTO(club));
  }

  private toDTO(club: Club): ClubDTO {
    return {
      id: club.id,
      name: club.name,
      description: club.description,
      logo: club.logo,
      city: club.city,
      socialMediaLink: club.socialMediaLink,
      status: club.status,
      owner: UserMapper.toDTO(club.owner),
      administrators: club.administrators?.map(admin => UserMapper.toDTO(admin)) || [],
      members: club.members?.map(member => UserMapper.toDTO(member)) || [],
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    };
  }

  private toRequestDTO(request: ClubRequest): ClubRequestDTO {
    return {
      id: request.id,
      user: UserMapper.toDTO(request.user),
      club: this.toDTO(request.club),
      type: request.type,
      status: request.status,
      message: request.message,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }
} 