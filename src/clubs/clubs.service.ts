import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club, ClubStatus } from './club.entity';
import { ClubRequest, ClubRequestStatus } from './club-request.entity';
import { User } from '../users/user.entity';
import { CreateClubDto, UpdateClubDto, ClubDTO } from './dto/club.dto';
import { CreateJoinRequestDto, ClubRequestDTO } from './dto/club-request.dto';
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

  async createClubRequest(userId: number, dto: CreateClubDto): Promise<ClubDTO> {
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
      relations: ['owner', 'members'] 
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

  async addMember(clubId: number, userId: number, asAdmin: boolean = false): Promise<ClubDTO> {
    const [club, user] = await Promise.all([
      this.clubRepository.findOne({ where: { id: clubId } }),
      this.userRepository.findOne({ where: { id: userId } })
    ]);

    if (!club) throw new NotFoundException('Club not found');
    if (!user) throw new NotFoundException('User not found');
    if (club.status !== ClubStatus.APPROVED) {
      throw new BadRequestException('Club is not approved');
    }
    if (user.club) {
      throw new BadRequestException('User already belongs to a club');
    }

    user.club = club;
    if (asAdmin) {
      user.role = UserRole.CLUB_ADMIN;
    }

    await this.userRepository.save(user);
    return this.getClubById(clubId);
  }

  async removeMember(clubId: number, userId: number): Promise<ClubDTO> {
    const [club, user] = await Promise.all([
      this.clubRepository.findOne({ where: { id: clubId } }),
      this.userRepository.findOne({ where: { id: userId } })
    ]);

    if (!club) throw new NotFoundException('Club not found');
    if (!user) throw new NotFoundException('User not found');
    if (user.club?.id !== clubId) {
      throw new BadRequestException('User is not a member of this club');
    }
    if (club.owner.id === userId) {
      throw new BadRequestException('Cannot remove club owner');
    }

    user.club = null;
    if (user.role === UserRole.CLUB_ADMIN) {
      user.role = UserRole.PLAYER;
    }

    await this.userRepository.save(user);
    return this.getClubById(clubId);
  }

  async getClubById(clubId: number): Promise<ClubDTO> {
    const club = await this.clubRepository.findOne({
      where: { id: clubId },
      relations: ['owner', 'members']
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    return this.toDTO(club);
  }

  async updateClub(clubId: number, dto: UpdateClubDto): Promise<ClubDTO> {
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
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
      this.clubRepository.findOne({ where: { id: clubId } })
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!club) throw new NotFoundException('Club not found');
    if (club.status !== ClubStatus.APPROVED) {
      throw new BadRequestException('Club is not approved');
    }
    if (user.club) {
      throw new BadRequestException('User already belongs to a club');
    }

    // Check if there's already a pending request
    const existingRequest = await this.clubRequestRepository.findOne({
      where: {
        user: { id: userId },
        club: { id: clubId },
        status: ClubRequestStatus.PENDING
      }
    });

    if (existingRequest) {
      throw new BadRequestException('Join request already exists');
    }

    const request = this.clubRequestRepository.create({
      user,
      club,
      message: dto.message,
      status: ClubRequestStatus.PENDING
    });

    const savedRequest = await this.clubRequestRepository.save(request);
    return this.toRequestDTO(savedRequest);
  }

  async approveJoinRequest(requestId: number, actorId: number): Promise<ClubRequestDTO> {
    const request = await this.clubRequestRepository.findOne({
      where: { id: requestId },
      relations: ['club', 'user']
    });

    if (!request) throw new NotFoundException('Join request not found');
    if (request.status !== ClubRequestStatus.PENDING) {
      throw new BadRequestException('Request is not in pending status');
    }

    // Verify that actor is club owner or admin
    const actor = await this.userRepository.findOne({ 
      where: { id: actorId },
      relations: ['club']
    });

    if (!actor || (actor.club?.id !== request.club.id && actor.role !== UserRole.ADMIN)) {
      throw new ForbiddenException('Not authorized to manage this club');
    }

    request.status = ClubRequestStatus.APPROVED;
    request.user.club = request.club;
    
    await Promise.all([
      this.clubRequestRepository.save(request),
      this.userRepository.save(request.user)
    ]);

    return this.toRequestDTO(request);
  }

  async rejectJoinRequest(requestId: number, actorId: number): Promise<ClubRequestDTO> {
    const request = await this.clubRequestRepository.findOne({
      where: { id: requestId },
      relations: ['club', 'user']
    });

    if (!request) throw new NotFoundException('Join request not found');
    if (request.status !== ClubRequestStatus.PENDING) {
      throw new BadRequestException('Request is not in pending status');
    }

    // Verify that actor is club owner or admin
    const actor = await this.userRepository.findOne({ 
      where: { id: actorId },
      relations: ['club']
    });

    if (!actor || (actor.club?.id !== request.club.id && actor.role !== UserRole.ADMIN)) {
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
        status: ClubRequestStatus.PENDING
      },
      relations: ['user', 'club']
    });

    return requests.map(request => this.toRequestDTO(request));
  }

  async getUserJoinRequests(userId: number): Promise<ClubRequestDTO[]> {
    const requests = await this.clubRequestRepository.find({
      where: {
        user: { id: userId }
      },
      relations: ['user', 'club']
    });

    return requests.map(request => this.toRequestDTO(request));
  }

  private toDTO(club: Club): ClubDTO {
    return {
      id: club.id,
      name: club.name,
      description: club.description,
      logo: club.logo,
      status: club.status,
      owner: UserMapper.toDTO(club.owner),
      members: UserMapper.toDTOList(club.members) || [],
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    };
  }

  private toRequestDTO(request: ClubRequest): ClubRequestDTO {
    return {
      id: request.id,
      user: UserMapper.toDTO(request.user),
      club: this.toDTO(request.club),
      status: request.status,
      message: request.message,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }
} 